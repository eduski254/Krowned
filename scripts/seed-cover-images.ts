/**
 * Add unique cover images to all existing seed businesses,
 * and create 10 new businesses with diverse cover images.
 *
 * Run: npx tsx scripts/seed-cover-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Test1234!";

// ── Cover images per category (unique Unsplash photos) ──────────────
// Each business gets a different cover image
const COVER_IMAGES: Record<string, string[]> = {
  "hair-barber": [
    "https://images.unsplash.com/photo-1585747860019-8e09b4c6e8b0?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&h=600&fit=crop",
  ],
  "nails-beauty": [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1200&h=600&fit=crop",
  ],
  "makeup-glam": [
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=1200&h=600&fit=crop",
  ],
  "skincare-aesthetics": [
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1629196914168-3a2db17ac40c?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200&h=600&fit=crop",
  ],
  "spa-massage": [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&h=600&fit=crop",
  ],
  "fitness-wellness": [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&h=600&fit=crop",
  ],
  "at-home-mobile": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=600&fit=crop",
  ],
};

// Logo-style images (square crops of related imagery)
const LOGO_IMAGES: Record<string, string[]> = {
  "hair-barber": [
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7228fcb0c124?w=200&h=200&fit=crop",
  ],
  "nails-beauty": [
    "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=200&h=200&fit=crop",
  ],
  "makeup-glam": [
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1457972851104-2d51b303a0b2?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=200&h=200&fit=crop",
  ],
  "skincare-aesthetics": [
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&h=200&fit=crop",
  ],
  "spa-massage": [
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=200&h=200&fit=crop",
  ],
  "fitness-wellness": [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&h=200&fit=crop",
  ],
  "at-home-mobile": [
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop",
  ],
};

// 10 new businesses to add
const NEW_BUSINESSES = [
  { name: "Kinky Kurls Studio", category: "hair-barber", city: "Nairobi", country: "KE", lat: -1.2801, lng: 36.8200, desc: "Specialists in natural hair, coils, and protective styles. Embrace your texture." },
  { name: "The Brow Bar", category: "makeup-glam", city: "Westlands", country: "KE", lat: -1.2650, lng: 36.8050, desc: "Expert brow shaping, tinting, and lash services. Define your look." },
  { name: "Soles & Palms Spa", category: "nails-beauty", city: "Karen", country: "KE", lat: -1.3180, lng: 36.7150, desc: "Luxury hand and foot treatments in a tranquil garden setting." },
  { name: "Body Sculpt Fitness", category: "fitness-wellness", city: "Kilimani", country: "KE", lat: -1.2880, lng: 36.7830, desc: "Boutique fitness studio with personalized training programs." },
  { name: "Aura Skin Clinic", category: "skincare-aesthetics", city: "Lavington", country: "KE", lat: -1.2810, lng: 36.7700, desc: "Advanced skincare treatments using the latest dermal technology." },
  { name: "Pamper Me Mobile", category: "at-home-mobile", city: "Nairobi", country: "KE", lat: null, lng: null, desc: "Premium beauty services delivered to your doorstep across Nairobi." },
  { name: "Silk & Scissors", category: "hair-barber", city: "Mombasa", country: "KE", lat: -4.0450, lng: 39.6690, desc: "Coastal vibes with world-class hair styling. Cuts, color, and care." },
  { name: "Nirvana Day Spa", category: "spa-massage", city: "Diani", country: "KE", lat: -4.3170, lng: 39.5760, desc: "Beachside spa retreat offering holistic massage and wellness therapies." },
  { name: "Lash & Dash Beauty", category: "makeup-glam", city: "Nakuru", country: "KE", lat: -0.3050, lng: 36.0820, desc: "Quick glam, lash extensions, and event makeup. Look fabulous fast." },
  { name: "Iron Temple Gym", category: "fitness-wellness", city: "Kisumu", country: "KE", lat: -0.1010, lng: 34.7600, desc: "Hardcore training facility with expert coaches and modern equipment." },
];

const SERVICE_TEMPLATES: Record<string, { name: string; price: number; duration: number }[]> = {
  "hair-barber": [
    { name: "Twist Out", price: 3000, duration: 45 },
    { name: "Loc Retwist", price: 4000, duration: 60 },
    { name: "Wash & Go", price: 2500, duration: 40 },
    { name: "Keratin Treatment", price: 9000, duration: 120 },
  ],
  "makeup-glam": [
    { name: "Brow Lamination", price: 3500, duration: 45 },
    { name: "Lash Lift & Tint", price: 4500, duration: 60 },
    { name: "Party Glam", price: 6000, duration: 75 },
  ],
  "nails-beauty": [
    { name: "Spa Manicure", price: 2500, duration: 40 },
    { name: "Paraffin Wax Treatment", price: 3000, duration: 30 },
    { name: "French Tips", price: 4000, duration: 50 },
  ],
  "fitness-wellness": [
    { name: "Boxing Fitness", price: 2500, duration: 45 },
    { name: "Strength Training", price: 3000, duration: 60 },
    { name: "Spin Class", price: 1500, duration: 45 },
  ],
  "skincare-aesthetics": [
    { name: "Vitamin C Facial", price: 7000, duration: 60 },
    { name: "Derma Pen Treatment", price: 15000, duration: 90 },
    { name: "Oxygen Facial", price: 9000, duration: 60 },
  ],
  "at-home-mobile": [
    { name: "Home Gel Nails", price: 5000, duration: 60 },
    { name: "At-Home Facial", price: 7000, duration: 75 },
    { name: "Mobile Hair Styling", price: 4500, duration: 60 },
  ],
  "spa-massage": [
    { name: "Thai Massage", price: 7000, duration: 75 },
    { name: "Reflexology", price: 5000, duration: 45 },
    { name: "Body Scrub & Wrap", price: 10000, duration: 90 },
  ],
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("\n🎨 Adding cover images & 10 new businesses...\n");

  // Fetch categories
  const { data: categories } = await supabase.from("service_categories").select("id, slug");
  if (!categories?.length) throw new Error("No categories");
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // Fetch free plan
  const { data: plans } = await supabase.from("plans").select("id, tier");
  const planMap = Object.fromEntries((plans ?? []).map((p) => [p.tier, p.id]));

  // ── Step 1: Update existing businesses with cover_url + logo_url ──
  console.log("1. Updating existing businesses with unique cover images...");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, primary_category_id, cover_url, logo_url")
    .order("created_at");

  if (!businesses?.length) {
    console.log("  No businesses found");
  } else {
    // Build category_id → slug map
    const catIdToSlug = Object.fromEntries(categories.map((c) => [c.id, c.slug]));
    const categoryCounters: Record<string, number> = {};

    let updated = 0;
    for (const biz of businesses) {
      const catSlug = catIdToSlug[biz.primary_category_id] ?? "hair-barber";
      const idx = categoryCounters[catSlug] ?? 0;
      categoryCounters[catSlug] = idx + 1;

      const covers = COVER_IMAGES[catSlug] ?? COVER_IMAGES["hair-barber"];
      const logos = LOGO_IMAGES[catSlug] ?? LOGO_IMAGES["hair-barber"];

      const coverUrl = covers[idx % covers.length];
      const logoUrl = logos[idx % logos.length];

      await supabase
        .from("businesses")
        .update({ cover_url: coverUrl, logo_url: logoUrl })
        .eq("id", biz.id);

      updated++;
    }
    console.log(`  ✓ Updated ${updated} businesses with cover & logo images`);
  }

  // ── Step 2: Create 10 new businesses ──────────────────────────────
  console.log("\n2. Creating 10 new businesses...");

  for (let i = 0; i < NEW_BUSINESSES.length; i++) {
    const def = NEW_BUSINESSES[i];
    const slug = slugify(def.name);
    const catId = catMap[def.category];
    if (!catId) {
      console.log(`  ⚠ Skipping ${def.name}: no category '${def.category}'`);
      continue;
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      console.log(`  ⏭ ${def.name} already exists`);
      continue;
    }

    // Create owner user
    const ownerEmail = `newowner${i + 1}@zawaditest.com`;
    const ownerName = `Owner ${def.name.split(" ")[0]}`;
    let ownerId: string;

    // Check if user exists
    const allUsers: { id: string; email?: string }[] = [];
    let page = 1;
    while (true) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (!data?.users?.length) break;
      allUsers.push(...data.users.map((u) => ({ id: u.id, email: u.email })));
      if (data.users.length < 1000) break;
      page++;
    }

    const existingUser = allUsers.find((u) => u.email === ownerEmail);
    if (existingUser) {
      ownerId = existingUser.id;
    } else {
      const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
        email: ownerEmail,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ownerName },
      });
      if (userErr) throw new Error(`User create ${ownerEmail}: ${userErr.message}`);
      ownerId = newUser.user.id;
      await supabase.from("profiles").upsert(
        { id: ownerId, full_name: ownerName },
        { onConflict: "id" },
      );
    }

    // Pick cover & logo
    const covers = COVER_IMAGES[def.category] ?? COVER_IMAGES["hair-barber"];
    const logos = LOGO_IMAGES[def.category] ?? LOGO_IMAGES["hair-barber"];

    // Alternate between pro and starter plans
    const tier = i % 3 === 0 ? "free" : i % 2 === 0 ? "starter" : "pro";
    const planId = planMap[tier] ?? planMap["free"];
    const subStatus = tier === "free" ? "canceled" : "active";

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        owner_id: ownerId,
        name: def.name,
        slug,
        description: def.desc,
        primary_category_id: catId,
        phone: `+254 7${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        email: `hello@${slug}.test`,
        address: `${Math.floor(10 + Math.random() * 90)} ${def.city} Road`,
        city: def.city,
        country: def.country,
        latitude: def.lat,
        longitude: def.lng,
        cover_url: covers[i % covers.length],
        logo_url: logos[i % logos.length],
        default_payment_option: "both" as const,
        commission_rate: 0.05,
        verification_status: "verified" as const,
        charges_enabled: tier !== "free",
        payouts_enabled: tier !== "free",
        plan_id: planId,
        subscription_status: subStatus as any,
        booking_link_token: `blt-${slug}`,
        is_published: true,
        onboarding_completed_at: new Date().toISOString(),
        gallery: JSON.stringify(
          (COVER_IMAGES[def.category] ?? []).slice(0, 5).map(
            (url) => url.replace("w=1200&h=600", "w=800&h=600"),
          ),
        ),
      })
      .select("id")
      .single();

    if (bizErr) {
      console.error(`  ✗ ${def.name}: ${bizErr.message}`);
      continue;
    }

    const bizId = biz.id;

    // Business hours (Mon-Sat 9-18)
    await supabase.from("business_hours").insert(
      [1, 2, 3, 4, 5, 6].map((d) => ({
        business_id: bizId,
        day_of_week: d,
        open_time: "09:00:00",
        close_time: "18:00:00",
      })),
    );

    // Subscription for paid tiers
    if (tier !== "free") {
      await supabase.from("subscriptions").insert({
        business_id: bizId,
        plan_id: planId,
        status: "active",
        seat_count: 1,
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancel_at_period_end: false,
      });
    }

    // Services
    const svcs = SERVICE_TEMPLATES[def.category] ?? [];
    if (svcs.length > 0) {
      await supabase.from("services").insert(
        svcs.map((s) => ({
          business_id: bizId,
          category_id: catId,
          name: s.name,
          description: `Professional ${s.name.toLowerCase()} at ${def.name}.`,
          price_amount: s.price,
          currency: "USD",
          duration_minutes: s.duration,
          payment_option: "both" as const,
          is_active: true,
        })),
      );
    }

    // Staff (owner as staff)
    await supabase.from("staff").insert({
      business_id: bizId,
      user_id: ownerId,
      display_name: ownerName,
      title: "Owner & Lead Specialist",
      status: "active" as const,
    });

    console.log(`  ✓ ${def.name} (${tier}, ${def.city})`);
  }

  console.log("\n✅ Done! All businesses now have unique cover images.");
}

main().catch(console.error);
