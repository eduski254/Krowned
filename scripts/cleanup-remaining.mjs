import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const KEEP_USER_ID = '1538c561-a0fb-4a30-bc6d-1e75fd00a0c7';

// Find remaining old businesses (not the 50 we just seeded, not Edwin's)
const { data: remaining } = await sb.from('businesses').select('id, name, owner_id, claimed');
const oldBiz = remaining.filter(b => b.claimed !== false && b.owner_id !== KEEP_USER_ID);
console.log(`Old businesses still remaining: ${oldBiz.length}`);
for (const b of oldBiz) console.log(`  ${b.name} — ${b.id}`);

if (oldBiz.length > 0) {
  const oldIds = oldBiz.map(b => b.id);

  // Clear leads referencing these businesses
  const { error: leadsErr } = await sb.from('leads').update({ converted_business_id: null }).in('converted_business_id', oldIds);
  if (leadsErr) console.log('  leads update error:', leadsErr.message);
  else console.log('  leads: cleared FK references');

  // Now delete the businesses
  const { error: bizErr } = await sb.from('businesses').delete().in('id', oldIds);
  if (bizErr) console.log('  businesses delete error:', bizErr.message);
  else console.log(`  businesses: deleted ${oldIds.length}`);

  // Delete remaining fake profiles
  const ownerIds = [...new Set(oldBiz.map(b => b.owner_id))];
  const { error: profErr } = await sb.from('profiles').delete().in('id', ownerIds);
  if (profErr) console.log('  profiles delete error:', profErr.message);
  else console.log(`  profiles: deleted ${ownerIds.length}`);

  for (const uid of ownerIds) {
    await sb.auth.admin.deleteUser(uid);
  }
  console.log('  auth.users: cleaned up');
}

// Also check Edwin Nchaga's own business (if any with claimed=true)
const { data: edwinBiz } = await sb.from('businesses').select('id, name, claimed').eq('owner_id', KEEP_USER_ID).eq('claimed', true);
console.log(`\nEdwin's claimed businesses: ${edwinBiz?.length ?? 0}`);
for (const b of edwinBiz || []) console.log(`  ${b.name}`);

// Final count
const { count } = await sb.from('businesses').select('id', { count: 'exact', head: true });
console.log(`\nTotal businesses now: ${count}`);
