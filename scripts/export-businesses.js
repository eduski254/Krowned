const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: businesses, error } = await sb
    .from("businesses")
    .select("id, name, slug, address, city, phone, email")
    .eq("claimed", false)
    .order("name", { ascending: true });

  if (error) { console.error(error); return; }

  // Output as CSV
  console.log("name,address,city,phone,business_email,slug");
  for (const b of businesses) {
    const name = `"${(b.name || '').replace(/"/g, '""')}"`;
    const addr = `"${(b.address || '').replace(/"/g, '""')}"`;
    const city = `"${(b.city || '').replace(/"/g, '""')}"`;
    const phone = `"${(b.phone || '').replace(/"/g, '""')}"`;
    const email = `"${(b.email || '').replace(/"/g, '""')}"`;
    const slug = b.slug || '';
    console.log(`${name},${addr},${city},${phone},${email},${slug}`);
  }
  console.error(`\nTotal unclaimed: ${businesses.length}`);
})();
