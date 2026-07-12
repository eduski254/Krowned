/**
 * Fix seeded businesses that are missing services and staff.
 * Run: npx tsx scripts/fix-seed-services.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CATEGORIES: Record<string, string> = {
  braids: "b1b73e49-ef67-45eb-8dfe-d616525aa8b2",
  locs: "5e7cd0e1-1904-4e6e-aded-f10e71bf5ac0",
  natural: "f9a0910e-d64b-444c-9f26-8e51b5c9807b",
  weaves: "67bd7f2c-ac06-4589-80d6-a9825828ae96",
  barber: "be9c9f58-c06a-4f88-91d2-a4a9a2aa99a6",
  color: "d2956422-0124-42ca-b73e-009ad635aec2",
};

const CAT_ID_TO_KEY: Record<string, string> = {};
for (const [k, v] of Object.entries(CATEGORIES)) CAT_ID_TO_KEY[v] = k;

const serviceTemplates: Record<string, { name: string; price: number; duration: number }[]> = {
  braids: [
    { name: "Knotless Braids (Small)", price: 28000, duration: 360 },
    { name: "Knotless Braids (Medium)", price: 22000, duration: 300 },
    { name: "Feed-in Cornrows", price: 12000, duration: 120 },
    { name: "Box Braids", price: 20000, duration: 300 },
    { name: "Passion Twists", price: 20000, duration: 300 },
  ],
  locs: [
    { name: "Loc Retwist", price: 8000, duration: 90 },
    { name: "Faux Locs (Mid-Back)", price: 25000, duration: 360 },
    { name: "Butterfly Locs", price: 22000, duration: 300 },
    { name: "Loc Detox & Deep Clean", price: 12000, duration: 120 },
    { name: "Soft Locs", price: 24000, duration: 330 },
  ],
  natural: [
    { name: "Silk Press", price: 8500, duration: 90 },
    { name: "Wash & Go", price: 6500, duration: 60 },
    { name: "Twist-Out Set", price: 7500, duration: 75 },
    { name: "Deep Conditioning Treatment", price: 5000, duration: 45 },
    { name: "Rod Set", price: 7000, duration: 90 },
  ],
  weaves: [
    { name: "Sew-In (Full)", price: 20000, duration: 180 },
    { name: "Quick Weave", price: 10000, duration: 90 },
    { name: "Frontal Install", price: 25000, duration: 180 },
    { name: "Wig Install (Custom)", price: 15000, duration: 90 },
    { name: "Tape-In Extensions", price: 22000, duration: 120 },
  ],
  barber: [
    { name: "Fade (Low/Mid/High)", price: 3500, duration: 30 },
    { name: "Taper", price: 3000, duration: 30 },
    { name: "Beard Trim & Shape", price: 2500, duration: 20 },
    { name: "Kids Cut (12 & under)", price: 2500, duration: 25 },
    { name: "Full Cut & Style", price: 4500, duration: 40 },
  ],
  color: [
    { name: "Full Color (Single Process)", price: 12000, duration: 120 },
    { name: "Highlights / Balayage", price: 18000, duration: 180 },
    { name: "Root Touch-Up", price: 8000, duration: 90 },
    { name: "Gloss / Toner", price: 6000, duration: 45 },
    { name: "Rinse / Semi-Permanent", price: 7000, duration: 60 },
  ],
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const { data: businesses } = await s
    .from("businesses")
    .select("id, name, owner_id, primary_category_id")
    .order("created_at");

  let fixed = 0;
  for (const biz of businesses ?? []) {
    // Skip if already has services
    const { count } = await s
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", biz.id);
    if ((count ?? 0) > 0) continue;

    const catKey = CAT_ID_TO_KEY[biz.primary_category_id ?? ""] ?? "braids";
    const templates = serviceTemplates[catKey] ?? serviceTemplates.braids;
    const catId = biz.primary_category_id ?? CATEGORIES.braids;

    // Add staff (owner) if missing
    const { data: existingStaff } = await s
      .from("staff")
      .select("id")
      .eq("business_id", biz.id);

    let staffId: string | undefined;
    if (!existingStaff?.length) {
      const { data: profile } = await s
        .from("profiles")
        .select("full_name")
        .eq("id", biz.owner_id)
        .single();
      const { data: newStaff } = await s
        .from("staff")
        .insert({
          business_id: biz.id,
          user_id: biz.owner_id,
          display_name: profile?.full_name ?? "Stylist",
          status: "active",
        })
        .select("id")
        .single();
      staffId = newStaff?.id;
    } else {
      staffId = existingStaff[0].id;
    }

    // Add 3-4 services
    const numSvcs = randomInt(3, 4);
    const selected = [...templates].sort(() => Math.random() - 0.5).slice(0, numSvcs);
    const svcRows = selected.map((t) => ({
      business_id: biz.id,
      name: t.name,
      price_amount: t.price + randomInt(-1000, 1000),
      currency: "usd",
      duration_minutes: t.duration,
      is_active: true,
      payment_option: randomPick(["prepay", "pay_at_store", "both"]),
      category_id: catId,
    }));

    const { data: svcs, error: svcErr } = await s
      .from("services")
      .insert(svcRows)
      .select("id");
    if (svcErr) {
      console.error("  FAIL:", biz.name, svcErr.message);
      continue;
    }

    // Link staff to services
    if (staffId && svcs) {
      const links = svcs.map((svc) => ({
        staff_id: staffId!,
        service_id: svc.id,
      }));
      await s.from("staff_services").insert(links);
    }

    fixed++;
    if (fixed % 10 === 0) console.log(`  Fixed ${fixed} businesses...`);
  }

  console.log(`\nDone! Fixed ${fixed} businesses with services + staff.`);

  // Verify
  const { count: svcCount } = await s
    .from("services")
    .select("id", { count: "exact", head: true });
  const { count: staffCount } = await s
    .from("staff")
    .select("id", { count: "exact", head: true });
  console.log("Total services:", svcCount);
  console.log("Total staff:", staffCount);
}

main();
