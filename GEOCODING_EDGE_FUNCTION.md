# Supabase Edge Function: Geocodificación Automática (Mapbox)

Este documento contiene el código para la Edge Function `geocode-person` y las instrucciones para configurar el Webhook en Supabase.

## 1. Código de la Edge Function (`index.ts`)

Copia este código en tu función de Supabase. La función está diseñada para recibir un Webhook de las tablas `lideres`, `brigadistas`, `movilizadores` o `ciudadanos`.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // 1. Validar entorno
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('Falta MAPBOX_ACCESS_TOKEN');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Mapbox Token' }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const payload = await req.json()
    
    // El payload del webhook de Supabase contiene 'record', 'table' y 'type'
    const record = payload.record || payload; 
    const table = payload.table || 'ciudadanos';

    if (!record || !record.direccion) {
      return new Response(JSON.stringify({ error: 'No address found in record' }), { status: 400 })
    }

    console.log(`[GEOCODE] Procesando ID: ${record.id} - ${record.nombre_completo || 'Sin nombre'}`);

    // 2. Limpiar y Construir Dirección
    let cleanDireccion = record.direccion.trim();
    if (cleanDireccion.match(/^c\.?\s/i)) {
        cleanDireccion = cleanDireccion.replace(/^c\.?\s/i, '');
    }

    // Construir query para Mapbox
    const coloniaPart = record.colonia ? `, ${record.colonia}` : '';
    const addressQuery = `${cleanDireccion}${coloniaPart}, Navojoa, Sonora`;
    
    console.log(`[GEOCODE] Query: "${addressQuery}"`);

    // 3. Llamada a Mapbox Geocoding API (v5)
    const encodedQuery = encodeURIComponent(addressQuery);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=mx&limit=1&bbox=-109.84,26.50,-109.03,27.38`;

    const geoResponse = await fetch(mapboxUrl);
    
    if (!geoResponse.ok) {
        throw new Error(`Mapbox API error: ${geoResponse.status} ${geoResponse.statusText}`);
    }

    const geoData = await geoResponse.json();

    let lat = null;
    let lng = null;
    let status = 'failed';
    let rawResult = null;

    if (geoData.features && geoData.features.length > 0) {
      const feature = geoData.features[0];
      const relevance = feature.relevance; // 0 a 1
      
      console.log(`[GEOCODE] Resultado encontrado. Relevancia: ${relevance}`);

      if (relevance >= 0.6) {
        [lng, lat] = feature.center;
        status = 'success';
        rawResult = feature.place_name;
      }
    }

    // 4. Actualizar Base de Datos (si hay ID)
    if (record.id) {
        const { error: updateError } = await supabase
        .from(table)
        .update({
            lat: lat,
            lng: lng,
            geocode_status: status,
            geocoded_at: new Date().toISOString()
        })
        .eq('id', record.id);

        if (updateError) throw updateError;
        console.log(`[DB] Registro ${record.id} actualizado: ${status} (${lat}, ${lng})`);
    }

    return new Response(JSON.stringify({ 
        status, 
        lat, 
        lng, 
        matched_address: rawResult,
        query: addressQuery 
    }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    console.error('[ERROR]', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

## 2. Configuración de Secretos

Para que la función funcione, debes configurar el secreto de Mapbox en tu proyecto de Supabase (vía CLI o Dashboard):

```bash
supabase secrets set MAPBOX_ACCESS_TOKEN=pk.tu_token_aqui
```

## 3. Configuración del Webhook (Database Webhooks)

En el Dashboard de Supabase, ve a **Database > Webhooks** y crea uno nuevo (o edita el existente):

1.  **Name:** `geocode_on_insert`
2.  **Table:** Selecciona `ciudadanos` (repite para `lideres`, `brigadistas`, `movilizadores`)
3.  **Events:** `INSERT` (y opcionalmente `UPDATE` si cambia la dirección)
4.  **Webhook Option:** `Supabase Edge Functions`
5.  **Edge Function:** Selecciona `geocode-person`
6.  **Method:** `POST`

## 4. Notas Técnicas
- **Bounding Box:** La función usa un rectángulo de búsqueda limitado a la zona de Navojoa (`-109.84,26.50,-109.03,27.38`) para evitar falsos positivos.
- **API Mapbox:** Se usa `mapbox.places` (v5). Si requieres caching legal masivo, considera el uso de la API Permanente bajo licencia comercial.

- **Para Pruebas:**
    curl -i --location --request POST 
     'tu supabase function' --header 
     'Authorization: Bearer 
     tu anonkey' --header 'Content-Type: application/json' --data 
     '{"table": "lideres", "record": {"id": "f834915d-b3db-46db-add8-e85a129a643b", 
     "nombre_completo": "MICHEL GAEL FIERRO MENDOZA", "direccion": "NACOZARI 807", "colonia"
     "SOP", "municipio": "NAVOJOA", "entidad": "SON"}}'
