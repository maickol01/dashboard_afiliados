# Supabase Edge Function: Geocodificación Automática (Geoapify)

Este documento contiene el código para la Edge Function `geocode-person` y las instrucciones para configurar el Webhook en Supabase.

## 1. Código de la Edge Function (`index.ts`)

Copia este código en tu función de Supabase. La función está diseñada para recibir un Webhook de las tablas `lideres`, `brigadistas`, `movilizadores` o `ciudadanos`.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEOAPIFY_API_KEY = Deno.env.get('GEOAPIFY_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const payload = await req.json()
    
    // El payload del webhook de Supabase contiene 'record', 'table' y 'type'
    const { record, table, type } = payload
    
    if (!record || !record.direccion) {
      return new Response(JSON.stringify({ error: 'No address found' }), { status: 400 })
    }

    // Construir la dirección completa para Navojoa
    const address = `${record.direccion}, ${record.colonia || ''}, ${record.municipio || 'Navojoa'}, ${record.entidad || 'Sonora'}, Mexico`
    
    console.log(`Geocodificando: ${address} para tabla ${table}`)

    // Llamada a Geoapify
    const query = encodeURIComponent(address)
    const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${query}&limit=1&filter=rect:-109.84,26.50,-109.03,27.38&apiKey=${GEOAPIFY_API_KEY}`
    
    const geoResponse = await fetch(geoUrl)
    const geoData = await geoResponse.json()

    let lat, lng, status = 'failed'

    if (geoData.features && geoData.features.length > 0) {
      const feature = geoData.features[0]
      const rank = feature.properties.rank
      
      // Solo aceptamos resultados con buena precisión (rank.confidence > 0.7)
      if (rank.confidence >= 0.7) {
        [lng, lat] = feature.geometry.coordinates
        status = 'success'
      }
    }

    // Actualizar el registro en la base de datos
    const { error: updateError } = await supabase
      .from(table)
      .update({
        lat: lat,
        lng: lng,
        geocode_status: status,
        geocoded_at: new Date().toISOString()
      })
      .eq('id', record.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ status, lat, lng }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

## 2. Configuración de Secretos

Para que la función funcione, debes configurar el secreto de Geoapify en tu proyecto de Supabase (vía CLI o Dashboard):

```bash
supabase secrets set GEOAPIFY_API_KEY=184f944846584c088997508785c7ec5e
```

## 3. Configuración del Webhook (Database Webhooks)

En el Dashboard de Supabase, ve a **Database > Webhooks** y crea uno nuevo:

1.  **Name:** `geocode_on_insert`
2.  **Table:** Selecciona `ciudadanos` (repite para `lideres`, `brigadistas`, `movilizadores`)
3.  **Events:** `INSERT` (y opcionalmente `UPDATE` si cambia la dirección)
4.  **Webhook Option:** `Supabase Edge Functions`
5.  **Edge Function:** Selecciona `geocode-person`
6.  **Method:** `POST`

## 4. Notas Técnicas
- **Bounding Box:** La función usa un rectángulo de búsqueda limitado a la zona de Navojoa (`filter=rect:-109.84,26.50,-109.03,27.38`) para evitar falsos positivos en otras ciudades.
- **Confianza:** Solo marca como `success` si Geoapify tiene una confianza del 70% o superior.
- **Service Role:** Se usa la `service_role_key` para asegurar que la función pueda actualizar los registros ignorando las políticas RLS.
