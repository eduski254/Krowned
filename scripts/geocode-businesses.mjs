import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const { data: businesses } = await sb
  .from('businesses')
  .select('id, name, address')
  .is('latitude', null)
  .not('address', 'is', null);

console.log(`Found ${businesses.length} businesses without coordinates\n`);

let success = 0;
let failed = 0;

for (const biz of businesses) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(biz.address)}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      await sb
        .from('businesses')
        .update({ latitude: lat, longitude: lng })
        .eq('id', biz.id);
      success++;
      process.stdout.write(`  [${success}/${businesses.length}] ${biz.name} → ${lat}, ${lng}\n`);
    } else {
      console.log(`  SKIP ${biz.name}: ${data.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ERROR ${biz.name}: ${e.message}`);
    failed++;
  }

  // Rate limit - 50 req/s is fine for Google Geocoding
  await new Promise(r => setTimeout(r, 100));
}

console.log(`\nDone! ${success} geocoded, ${failed} failed.`);
