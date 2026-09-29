const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: businesses, error } = await sb
    .from("businesses")
    .select("id, name, slug, owner_id, verification_status, is_published, plan_id, subscription_status, claimed, created_at, profiles!businesses_owner_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (error) { console.error("DB error:", error); return; }
  if (!businesses) { console.log("No businesses found"); return; }

  for (const b of businesses) {
    const { data: { user } } = await sb.auth.admin.getUserById(b.owner_id);
    console.log(JSON.stringify({
      business: b.name,
      owner: b.profiles?.full_name,
      email: user?.email,
      last_sign_in: user?.last_sign_in_at?.slice(0, 10) || "never",
      claimed: b.claimed,
      verification: b.verification_status,
      published: b.is_published,
      subscription: b.subscription_status,
      created: b.created_at?.slice(0, 10)
    }));
  }
  console.log("\nTotal:", businesses.length);
})();
