import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const KEEP_USER_ID = '1538c561-a0fb-4a30-bc6d-1e75fd00a0c7'; // Edwin Nchaga
const FREE_PLAN_ID = '30e18365-22d1-4416-ac9d-b71c2aa38680';
const IMAGES_DIR = join(process.cwd(), 'images', 'images');

const seed = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'dmv-braiding-seed.json'), 'utf-8'));

// ── STEP 1: Delete all businesses and related data ──

console.log('\n=== STEP 1: Cleaning up ===');

// Get all business IDs
const { data: allBiz } = await sb.from('businesses').select('id, owner_id');
const bizIds = allBiz.map(b => b.id);
const ownerIds = [...new Set(allBiz.map(b => b.owner_id))].filter(id => id !== KEEP_USER_ID);

console.log(`Deleting data for ${bizIds.length} businesses...`);

if (bizIds.length > 0) {
  // Delete in dependency order
  const tables = [
    'review_photos',
    'reviews',
    'messages',
    'conversation_participants',
    'conversations',
    'booking_reminders',
    'bookings',
    'staff_services',
    'staff_schedules',
    'schedule_exceptions',
    'staff',
    'services',
    'business_hours',
    'business_contacts',
    'favorites',
    'notification_preferences',
    'listing_claims',
  ];

  for (const table of tables) {
    const { error } = await sb.from(table).delete().in('business_id', bizIds);
    if (error && !error.message.includes('does not exist') && !error.message.includes('column')) {
      // Try without business_id for tables that reference differently
      console.log(`  ${table}: skipped (${error.message.slice(0, 60)})`);
    } else {
      console.log(`  ${table}: cleared`);
    }
  }

  // Delete conversations that reference these businesses
  const { error: convErr } = await sb.from('conversations').delete().in('business_id', bizIds);
  if (!convErr) console.log('  conversations (retry): cleared');

  // Delete notification_preferences by user_id for fake users
  if (ownerIds.length > 0) {
    await sb.from('notification_preferences').delete().in('user_id', ownerIds);
    console.log('  notification_preferences (by user): cleared');
  }

  // Delete businesses
  const { error: bizErr } = await sb.from('businesses').delete().in('id', bizIds);
  if (bizErr) {
    console.error('  ERROR deleting businesses:', bizErr.message);
  } else {
    console.log(`  businesses: deleted ${bizIds.length} rows`);
  }
}

// Delete fake profiles and auth users
console.log(`\nDeleting ${ownerIds.length} fake profiles...`);
if (ownerIds.length > 0) {
  // Delete profiles
  const { error: profErr } = await sb.from('profiles').delete().in('id', ownerIds);
  if (profErr) console.error('  ERROR deleting profiles:', profErr.message);
  else console.log('  profiles: deleted');

  // Delete auth users
  let authDeleted = 0;
  for (const uid of ownerIds) {
    const { error } = await sb.auth.admin.deleteUser(uid);
    if (!error) authDeleted++;
  }
  console.log(`  auth.users: deleted ${authDeleted}/${ownerIds.length}`);
}

// ── STEP 2: Seed 50 new businesses ──

console.log('\n=== STEP 2: Seeding 50 businesses ===');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function parseCity(address) {
  // Extract city from address like "44751 Brimfield Dr, Ashburn, VA 20147"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const city = parts[parts.length - 2];
    const stateZip = parts[parts.length - 1];
    const state = stateZip.split(' ')[0];
    return { city, state, country: 'US' };
  }
  if (parts.length === 2) {
    const stateZip = parts[1];
    const state = stateZip.split(' ')[0];
    return { city: parts[0], state, country: 'US' };
  }
  return { city: null, state: null, country: 'US' };
}

const businesses = seed.businesses;
let seeded = 0;
let imgUploaded = 0;

for (const biz of businesses) {
  const { city, country } = parseCity(biz.address);
  const slug = slugify(biz.name);

  // Check if slug exists already
  const { data: existing } = await sb.from('businesses').select('slug').eq('slug', slug);
  const finalSlug = existing && existing.length > 0 ? `${slug}-${biz.id}` : slug;

  // Upload cover image
  let coverUrl = null;
  try {
    const imgPath = join(IMAGES_DIR, biz.coverImage);
    const imgBuffer = readFileSync(imgPath);
    const storagePath = `covers/${finalSlug}.jpg`;

    const { error: uploadErr } = await sb.storage
      .from('business-images')
      .upload(storagePath, imgBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      console.log(`  IMG skip ${biz.coverImage}: ${uploadErr.message}`);
    } else {
      const { data: urlData } = sb.storage.from('business-images').getPublicUrl(storagePath);
      coverUrl = urlData.publicUrl;
      imgUploaded++;
    }
  } catch (e) {
    console.log(`  IMG error ${biz.coverImage}: ${e.message}`);
  }

  // Insert business
  const { error: insertErr } = await sb.from('businesses').insert({
    name: biz.name,
    slug: finalSlug,
    owner_id: KEEP_USER_ID,
    plan_id: FREE_PLAN_ID,
    address: biz.address,
    phone: biz.phone,
    email: null,
    city: city,
    country: country,
    cover_url: coverUrl,
    description: `${biz.name} is a hair braiding salon in the DMV area.`,
    is_published: true,
    verification_status: 'verified',
    claimed: false,
    timezone: 'America/New_York',
    social_links: biz.website ? { website: biz.website.startsWith('http') ? biz.website : `https://${biz.website}` } : null,
  });

  if (insertErr) {
    console.error(`  FAIL ${biz.name}: ${insertErr.message}`);
  } else {
    seeded++;
    process.stdout.write(`  Seeded ${seeded}/50\r`);
  }
}

console.log(`\n\nDone! Seeded ${seeded} businesses, uploaded ${imgUploaded} images.`);
