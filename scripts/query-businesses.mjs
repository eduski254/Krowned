import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: admins } = await sb.from('profiles').select('id, full_name, email, platform_role').eq('platform_role', 'super_admin');
console.log('=== SUPER ADMINS ===');
for (const a of admins || []) console.log(`  ${a.full_name} (${a.email}) — ${a.id}`);

const { data: demo } = await sb.from('profiles').select('id, full_name, email').ilike('email', '%demo%krowned%');
console.log('\n=== DEMO ACCOUNT ===');
for (const d of demo || []) console.log(`  ${d.full_name} (${d.email}) — ${d.id}`);

const adminIds = new Set([...(admins || []).map(a => a.id), ...(demo || []).map(d => d.id)]);

const { data: businesses } = await sb.from('businesses').select('id, name, slug, owner_id, city, is_published, verification_status, created_at');

const keep = businesses.filter(b => adminIds.has(b.owner_id));
const remove = businesses.filter(b => !adminIds.has(b.owner_id));

console.log(`\n=== KEEP (${keep.length}) ===`);
for (const b of keep) console.log(`  ${b.name} — city: ${b.city}, owner: ${b.owner_id}`);

console.log(`\n=== WILL DELETE (${remove.length}) ===`);
for (const b of remove) console.log(`  ${b.name} — city: ${b.city}, owner: ${b.owner_id}`);

const { data: plans } = await sb.from('plans').select('id, name, tier');
console.log('\n=== PLANS ===');
for (const p of plans || []) console.log(`  ${p.name} (${p.tier}) — ${p.id}`);
