import { createClient } from '@supabase/supabase-js';
import { RECORDS_TO_GEOCODE } from './data';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ElectoralDashboardTest/1.0' }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function runTest() {
  const testRecords = RECORDS_TO_GEOCODE.slice(0, 5);
  console.log(`🧪 Running test for first ${testRecords.length} records...`);
  
  for (const record of testRecords) {
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
    
    // Deduplicate
    const parts = new Set<string>();
    if (dir.length > 2) parts.add(dir);
    if (col.length > 2) parts.add(col);
    parts.add(clean(record.municipio));
    parts.add('Sonora'); // Force full state name for better results
    parts.add('Mexico');

    const query = Array.from(parts).join(', ');
    
    console.log(`📍 Geocoding [${record.nombre}]: "${query}"...`);
    const coords = await geocodeAddress(query);

    
    if (coords) {
      console.log(`   ✅ Found: ${coords.lat}, ${coords.lng}`);
      const { error } = await supabase.from('ciudadanos').update({
        lat: coords.lat, lng: coords.lng, geocode_status: 'test_batch', geocoded_at: new Date().toISOString()
      }).eq('id', record.id);
      if (error) console.error(`   ❌ DB Error:`, error.message);
      else console.log(`   🚀 DB Updated successfully.`);
    } else {
      console.log(`   ⚠️ Not found.`);
    }
    await delay(1500);
  }
}

runTest().catch(console.error);
