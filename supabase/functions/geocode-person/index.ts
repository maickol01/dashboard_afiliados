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
    // O si lo probamos manualmente, podría ser solo el objeto { ...datos }
    const record = payload.record || payload; 
    const table = payload.table || 'ciudadanos'; // Default para pruebas manuales

    if (!record || !record.direccion) {
      return new Response(JSON.stringify({ error: 'No address found in record' }), { status: 400 })
    }

    console.log(`[GEOCODE] Procesando ID: ${record.id} - ${record.nombre_completo || 'Sin nombre'}`);

    // 2. Limpiar y Construir Dirección
    // Quitamos prefijos comunes como "C " o "C. " si existen
    let cleanDireccion = record.direccion.trim();
    if (cleanDireccion.match(/^c\.?\s/i)) {
        cleanDireccion = cleanDireccion.replace(/^c\.?\s/i, '');
    }

    // Construir query para Mapbox: "Calle 123, Colonia Centro, Navojoa, Sonora"
    // Mapbox funciona mejor si le das la jerarquía clara
    const coloniaPart = record.colonia ? `, ${record.colonia}` : '';
    const addressQuery = `${cleanDireccion}${coloniaPart}, Navojoa, Sonora`;
    
    console.log(`[GEOCODE] Query: "${addressQuery}"`);

    // 3. Llamada a Mapbox Geocoding API (v5)
    // endpoint: mapbox.places
    // bbox: Navojoa aprox (minLon, minLat, maxLon, maxLat) -> -109.84,26.50,-109.03,27.38
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

      // Mapbox devuelve [lng, lat] en 'center' o 'geometry.coordinates'
      // Aceptamos si la relevancia es decente (e.g., > 0.5 para ser permisivos, o 0.8 estricto)
      if (relevance >= 0.6) {
        [lng, lat] = feature.center;
        status = 'success';
        rawResult = feature.place_name;
      } else {
          console.log(`[GEOCODE] Rechazado por baja relevancia (< 0.6)`);
      }
    } else {
        console.log(`[GEOCODE] Sin resultados de Mapbox`);
    }

    // 4. Actualizar Base de Datos (si hay ID)
    if (record.id) {
        // Solo actualizamos si tuvimos éxito o si queremos marcar el fallo
        const { error: updateError } = await supabase
        .from(table)
        .update({
            lat: lat,
            lng: lng,
            geocode_status: status,
            geocoded_at: new Date().toISOString()
        })
        .eq('id', record.id);

        if (updateError) {
            console.error('[DB ERROR]', updateError);
            throw updateError;
        }
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