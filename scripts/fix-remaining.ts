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
  // 1. Remove "test user's Business"
  const { data: testBiz } = await sb.from("businesses").select("id").ilike("name", "%test user%").maybeSingle();
  if (testBiz) {
    // Clean up dependencies
    const { data: staffIds } = await sb.from("staff").select("id").eq("business_id", testBiz.id);
    const ids = (staffIds ?? []).map(s => s.id);
    if (ids.length) {
      await sb.from("staff_services").delete().in("staff_id", ids);
      await sb.from("staff_schedules").delete().in("staff_id", ids);
      await sb.from("schedule_exceptions").delete().in("staff_id", ids);
    }
    await sb.from("reviews").delete().eq("business_id", testBiz.id);
    await sb.from("bookings").delete().eq("business_id", testBiz.id);
    await sb.from("staff").delete().eq("business_id", testBiz.id);
    await sb.from("services").delete().eq("business_id", testBiz.id);
    await sb.from("business_hours").delete().eq("business_id", testBiz.id);
    await sb.from("subscriptions").delete().eq("business_id", testBiz.id);
    await sb.from("favorites").delete().eq("business_id", testBiz.id);
    await sb.from("business_contacts").delete().eq("business_id", testBiz.id);
    await sb.from("businesses").delete().eq("id", testBiz.id);
    console.log("Removed: test user's Business");
  }

  // 2. Fix Eddie's cover image (broken 404)
  // Verify new URL first
  const newCover = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&h=600&fit=crop";
  try {
    const res = await fetch(newCover, { method: "HEAD", redirect: "follow" });
    console.log(`Eddie's cover URL check: ${res.status}`);
  } catch (e) {
    console.log("Cover URL error:", e);
  }

  await sb.from("businesses").update({
    cover_url: newCover,
  }).ilike("name", "%Eddie%Cutz%");
  console.log("Fixed: Eddie's Cutz cover image");

  // 3. Fix the "unknown" category business (primary_category_id is null or invalid)
  const { data: unknownCatBiz } = await sb.from("businesses").select("id, name, primary_category_id");
  const { data: validCats } = await sb.from("service_categories").select("id");
  const validCatIds = new Set((validCats ?? []).map(c => c.id));

  for (const b of unknownCatBiz ?? []) {
    if (!b.primary_category_id || !validCatIds.has(b.primary_category_id)) {
      // Assign based on name/services
      const { data: hairCat } = await sb.from("service_categories").select("id").eq("slug", "hair-barber").single();
      if (hairCat) {
        await sb.from("businesses").update({ primary_category_id: hairCat.id }).eq("id", b.id);
        console.log(`Fixed category for: ${b.name}`);
      }
    }
  }

  // 4. Fix staff display names that look like "Owner Kinky"
  const { data: badNames } = await sb.from("staff").select("id, display_name, business_id")
    .ilike("display_name", "Owner %");

  const nameMap: Record<string, string> = {
    "Kinky Kurls Studio": "Amara Osei",
    "The Brow Bar": "Lilian Wambui",
    "Soles & Palms Spa": "Diana Mutua",
    "Aura Skin Clinic": "Dr. Nadia Otieno",
    "Pamper Me Mobile": "Joy Akinyi",
    "Silk & Scissors": "Ruth Kamau",
    "Nirvana Day Spa": "Serena Njoki",
    "Lash & Dash Beauty": "Cynthia Ndungu",
    "Body Sculpt Fitness": "Coach Mike Onyango",
    "Iron Temple Gym": "Coach Brian Kipchoge",
  };

  const titleMap: Record<string, string> = {
    "Kinky Kurls Studio": "Natural Hair Specialist",
    "The Brow Bar": "Brow Artist",
    "Soles & Palms Spa": "Senior Therapist",
    "Aura Skin Clinic": "Lead Aesthetician",
    "Pamper Me Mobile": "Mobile Beauty Expert",
    "Silk & Scissors": "Senior Stylist",
    "Nirvana Day Spa": "Spa Director",
    "Lash & Dash Beauty": "Lash Technician",
    "Body Sculpt Fitness": "Head Coach",
    "Iron Temple Gym": "Head Coach",
  };

  for (const s of badNames ?? []) {
    const { data: biz } = await sb.from("businesses").select("name").eq("id", s.business_id).single();
    if (biz && nameMap[biz.name]) {
      await sb.from("staff").update({
        display_name: nameMap[biz.name],
        title: titleMap[biz.name] ?? "Specialist",
      }).eq("id", s.id);
      console.log(`Fixed staff name: ${s.display_name} → ${nameMap[biz.name]}`);
    }
  }

  // 5. Full image validation
  console.log("\nValidating ALL business images...");
  const { data: allBiz } = await sb.from("businesses").select("id, name, cover_url, logo_url");
  let broken = 0;
  for (const b of allBiz ?? []) {
    for (const [field, url] of [["cover", b.cover_url], ["logo", b.logo_url]] as const) {
      if (!url) continue;
      try {
        const res = await fetch(url, { method: "HEAD", redirect: "follow" });
        if (res.status >= 400) {
          console.log(`  BROKEN ${field}: ${b.name} (${res.status})`);
          broken++;
        }
      } catch {
        console.log(`  ERROR ${field}: ${b.name}`);
        broken++;
      }
    }
  }
  console.log(`Image check done: ${broken} broken`);

  console.log("\nDone!");
}

main().catch(console.error);
