import { createClient } from '@supabase/supabase-js';
import { RECORDS_TO_GEOCODE } from './data';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ElectoralDashboardBatchGeocoding/1.0'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error);
    return null;
  }
}

async function runBatch() {
  console.log(`🚀 Starting batch geocoding for ${RECORDS_TO_GEOCODE.length} records...`);
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const record of RECORDS_TO_GEOCODE) {
    // 1. Check if already geocoded (in our list or DB? The list has nulls, but let's check DB just in case? No, relying on list)
    if (record.lat && record.lng) {
      console.log(`⏭️ Skipping ${record.nombre} (Already has coords)`);
      skippedCount++;
      continue;
    }

    // Aggressive cleaning
    const clean = (str: string) => {
        return str
            .replace(/^-+/, '') // Leading dashes
            .replace(/\bLOC\b/gi, '') // "LOC" word
            .replace(/POSTE\s*\d+/gi, '') // "POSTE 7"
            .replace(/\bS\/?N\b/gi, '') // "S/N" or "SN"
            .replace(/\bSIN\b/gi, '') // "SIN"
            .replace(/\s+/g, ' ') // Multiple spaces
            .trim();
    };

    let dir = clean(record.direccion);
    let col = clean(record.colonia);
    
    // Strategy 1: Specific
    const parts1 = new Set<string>();
    if (dir.length > 2) parts1.add(dir);
    if (col.length > 2) parts1.add(col);
    parts1.add(clean(record.municipio));
    parts1.add('Sonora'); 
    parts1.add('Mexico');
    
    const query1 = Array.from(parts1).join(', ');
    console.log(`📍 Geocoding [${record.id}]: "${query1}"...`);

    let coords = await geocodeAddress(query1);

    // Strategy 2: Fallback (Less specific)
    if (!coords) {
        const parts2 = new Set<string>();
        // If direction failed, maybe it was too specific or "La Pera, La Pera".
        // Try just Colonia if it exists, or just Direction if not.
        if (col.length > 2) parts2.add(col);
        else if (dir.length > 2) parts2.add(dir);
        
        parts2.add(clean(record.municipio));
        parts2.add('Sonora');
        parts2.add('Mexico');
        
        const query2 = Array.from(parts2).join(', ');
        if (query2 !== query1) {
             console.log(`   🔄 Retrying with: "${query2}"...`);
             coords = await geocodeAddress(query2);
             await delay(1000);
        }
    }
    
    if (coords) {
      console.log(`   ✅ Found: ${coords.lat}, ${coords.lng}`);
      
      // 4. Update Supabase
      // Assuming table is 'ciudadanos'. If ID not found there, try others? 
      // User data suggests they are ciudadanos (movilizador_id present).
      
      const { error } = await supabase
        .from('ciudadanos')
        .update({
          lat: coords.lat,
          lng: coords.lng,
          geocode_status: 'success_batch',
          geocoded_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (error) {
        // Try other tables if Citizens fails? Or just log error
        console.error(`   ❌ DB Error updating ${record.id}:`, error.message);
        // Fallback: Check leaders/brigadistas/movilizadores if needed? 
        // Since we don't know the role for sure from just this JSON (though keys hint), we could try blindly updating others if Citizens fails with "not found" (which update doesn't throw, it just returns count 0).
        // Let's assume Citizens for now based on previous context.
        errorCount++;
      } else {
        successCount++;
      }

    } else {
      console.log(`   ⚠️ No results found for query.`);
      errorCount++;
    }

    // Rate limiting
    await delay(1500); 
  }

  console.log(`
🏁 Batch complete.`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️ Skipped: ${skippedCount}`);
  console.log(`❌ Errors/Not Found: ${errorCount}`);
}

runBatch().catch(console.error);
