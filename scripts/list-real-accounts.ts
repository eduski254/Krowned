import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data: { users } } = await s.auth.admin.listUsers({ perPage: 200 });

  const real = users.filter((u) => {
    const email = u.email || "";
    if (email.endsWith("@krowned.app")) return false;
    if (email.includes("demo")) return false;
    if (email.includes("seed")) return false;
    if (email.includes("example.com")) return false;
    return true;
  });

  console.log("=== REAL EMAIL ACCOUNTS ===\n");

  for (const u of real) {
    const { data: profile } = await s
      .from("profiles")
      .select("full_name, platform_role")
      .eq("id", u.id)
      .single();
    const { data: biz } = await s
      .from("businesses")
      .select("name")
      .eq("owner_id", u.id);
    const bizNames = (biz ?? []).map((b) => b.name).join(", ");

    console.log(u.email);
    console.log("  Name:", profile?.full_name || "—");
    console.log("  Role:", profile?.platform_role || "client");
    console.log("  Provider:", u.app_metadata?.provider || "—");
    console.log("  Confirmed:", u.email_confirmed_at ? "Yes" : "No");
    console.log("  Created:", u.created_at?.slice(0, 10));
    if (bizNames) console.log("  Business:", bizNames);
    console.log();
  }

  console.log("Total real accounts:", real.length);
  console.log("Total test/seed accounts:", users.length - real.length);
}

main();
