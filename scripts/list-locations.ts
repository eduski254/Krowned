import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data } = await sb.from("businesses").select("id, name, city, country, latitude, longitude").order("name");
  const nonKe = (data ?? []).filter(b => b.country !== "KE");
  console.log(`Total: ${data?.length}, Non-Kenya: ${nonKe.length}\n`);
  for (const b of data ?? []) {
    const flag = b.country !== "KE" ? " <<<" : "";
    console.log(`${b.name} | ${b.city}, ${b.country} | ${b.latitude}, ${b.longitude}${flag}`);
  }
}
main();
