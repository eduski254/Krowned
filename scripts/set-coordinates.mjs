import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Approximate coordinates for DMV cities/areas with small random offsets for visual spread
const CITY_COORDS = {
  'Ashburn': { lat: 39.0438, lng: -77.4874 },
  'Sterling': { lat: 39.0062, lng: -77.4286 },
  'Herndon': { lat: 38.9696, lng: -77.3861 },
  'Manassas': { lat: 38.7509, lng: -77.4753 },
  'Leesburg': { lat: 39.1157, lng: -77.5636 },
  'Washington': { lat: 38.9072, lng: -77.0369 },
  'Silver Spring': { lat: 38.9907, lng: -77.0261 },
  'Cottage City': { lat: 38.9382, lng: -76.9483 },
  'Lanham': { lat: 38.9690, lng: -76.8614 },
  'Alexandria': { lat: 38.8048, lng: -77.0469 },
  'Falls Church': { lat: 38.8823, lng: -77.1711 },
  'Springfield': { lat: 38.7893, lng: -77.1872 },
};

const { data: businesses } = await sb
  .from('businesses')
  .select('id, name, address, city')
  .is('latitude', null);

console.log(`Setting coordinates for ${businesses.length} businesses\n`);

let updated = 0;

for (const biz of businesses) {
  // Try to match city from the address or city field
  let coords = null;
  const city = biz.city || '';

  for (const [name, c] of Object.entries(CITY_COORDS)) {
    if (city.includes(name) || (biz.address && biz.address.includes(name))) {
      coords = c;
      break;
    }
  }

  if (!coords) {
    // Default to DC center
    coords = CITY_COORDS['Washington'];
    console.log(`  DEFAULT ${biz.name} (city: ${city}) → DC center`);
  }

  // Add small random offset so pins don't stack (±0.005 degrees ≈ ±500m)
  const lat = coords.lat + (Math.random() - 0.5) * 0.01;
  const lng = coords.lng + (Math.random() - 0.5) * 0.01;

  await sb
    .from('businesses')
    .update({ latitude: lat, longitude: lng })
    .eq('id', biz.id);

  updated++;
  console.log(`  [${updated}/${businesses.length}] ${biz.name} → ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
}

console.log(`\nDone! Updated ${updated} businesses.`);
