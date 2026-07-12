/**
 * Seed 50 sample business listings for Krowned.
 * Run: npx tsx scripts/seed-listings.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Real categories from DB
const CATEGORIES = {
  braids: "b1b73e49-ef67-45eb-8dfe-d616525aa8b2",
  locs: "5e7cd0e1-1904-4e6e-aded-f10e71bf5ac0",
  natural: "f9a0910e-d64b-444c-9f26-8e51b5c9807b",
  weaves: "67bd7f2c-ac06-4589-80d6-a9825828ae96",
  barber: "be9c9f58-c06a-4f88-91d2-a4a9a2aa99a6",
  color: "d2956422-0124-42ca-b73e-009ad635aec2",
};

const PLANS = {
  free: "30e18365-22d1-4416-ac9d-b71c2aa38680",
  starter: "1eae0762-26cb-4936-82c4-df76b70a49e5",
  pro: "9d0a9d42-7a63-45ee-99da-febfaf6b11c5",
  enterprise: "3ac967df-8e54-43a0-9662-6f73b3f13dc7",
};

// DMV area cities
const cities = [
  "Washington", "Silver Spring", "Bethesda", "College Park", "Bowie",
  "Columbia", "Baltimore", "Alexandria", "Arlington", "Hyattsville",
  "Laurel", "Rockville", "Gaithersburg", "Annapolis", "Germantown",
  "Takoma Park", "Greenbelt", "Fairfax", "Reston", "Woodbridge",
];

const states: Record<string, string> = {
  Washington: "DC", "Silver Spring": "MD", Bethesda: "MD", "College Park": "MD",
  Bowie: "MD", Columbia: "MD", Baltimore: "MD", Alexandria: "VA",
  Arlington: "VA", Hyattsville: "MD", Laurel: "MD", Rockville: "MD",
  Gaithersburg: "MD", Annapolis: "MD", Germantown: "MD", "Takoma Park": "MD",
  Greenbelt: "MD", Fairfax: "VA", Reston: "VA", Woodbridge: "VA",
};

// Approximate coordinates for each city
const coords: Record<string, [number, number]> = {
  Washington: [38.9072, -77.0369], "Silver Spring": [38.9907, -77.0261],
  Bethesda: [38.9847, -77.0947], "College Park": [38.9807, -76.9369],
  Bowie: [38.9428, -76.7302], Columbia: [39.2037, -76.8610],
  Baltimore: [39.2904, -76.6122], Alexandria: [38.8048, -77.0469],
  Arlington: [38.8816, -77.0910], Hyattsville: [38.9557, -76.9455],
  Laurel: [39.0993, -76.8483], Rockville: [39.0840, -77.1528],
  Gaithersburg: [39.1434, -77.2014], Annapolis: [38.9784, -76.4922],
  Germantown: [39.1732, -77.2717], "Takoma Park": [38.9779, -77.0075],
  Greenbelt: [38.9955, -76.8827], Fairfax: [38.8462, -77.3064],
  Reston: [38.9687, -77.3411], Woodbridge: [38.6582, -77.2497],
};

const firstNames = [
  "Keisha", "Aisha", "Aaliyah", "Destiny", "Jasmine", "Nia", "Imani",
  "Zuri", "Amara", "Sade", "Tiana", "Maya", "Deja", "Bianca", "Nadia",
  "Khadijah", "Layla", "Simone", "Danielle", "Crystal", "Jordan", "Malik",
  "Jamal", "DeAndre", "Kwame", "Terrence", "Xavier", "Marcus", "Andre", "Darius",
];

const lastNames = [
  "Johnson", "Williams", "Brown", "Davis", "Jackson", "Thomas", "Harris",
  "Robinson", "Walker", "Lewis", "Thompson", "Washington", "Carter", "Mitchell",
  "Anderson", "Bell", "Richardson", "Green", "Adams", "Campbell",
];

const businessPrefixes = [
  "Crown", "Royal", "Queen", "King", "Divine", "Golden", "Natural",
  "Luxe", "Blessed", "Radiant", "Majestic", "Elite", "Pure", "Regal",
  "Heritage", "Empress", "Dynasty", "Noir", "Onyx", "Velvet",
];

const businessSuffixes = [
  "Braids", "Beauty", "Hair Studio", "Locs", "Naturals", "Styles",
  "Hair Lounge", "Salon", "Barber Studio", "Hair Lab", "Mane Studio",
  "Tress Lounge", "Curl Bar", "Braid Bar", "Studio", "Hair House",
];

const descriptions = [
  "Specializing in protective styles that keep your hair healthy and thriving. Walk-ins welcome, appointments preferred.",
  "A premium salon experience dedicated to textured hair. Our trained professionals treat every client like royalty.",
  "Your go-to destination for natural hair care, braids, and loc maintenance in the DMV area.",
  "Where art meets hair. We specialize in custom braids, locs, and creative styles for all textures.",
  "Luxury hair care in a relaxing environment. We use only the highest quality products and techniques.",
  "A community-centered salon that celebrates Black hair in all its forms. From TWAs to waist-length locs.",
  "Expert braiders with 10+ years of experience. Known for knotless braids, feed-in cornrows, and goddess locs.",
  "Full-service natural hair salon offering twist-outs, silk presses, color, and protective styling.",
  "Mobile braiding service — we come to you! Serving the entire DMV metro area.",
  "Modern barbershop meets natural hair salon. Fades, tapers, locs, and braids all under one roof.",
];

// Service templates by category
const serviceTemplates: Record<string, { name: string; price: number; duration: number }[]> = {
  braids: [
    { name: "Knotless Braids (Small)", price: 28000, duration: 360 },
    { name: "Knotless Braids (Medium)", price: 22000, duration: 300 },
    { name: "Knotless Braids (Large)", price: 18000, duration: 240 },
    { name: "Feed-in Cornrows", price: 12000, duration: 120 },
    { name: "Box Braids", price: 20000, duration: 300 },
    { name: "Fulani Braids", price: 18000, duration: 240 },
    { name: "Goddess Braids", price: 15000, duration: 180 },
    { name: "Passion Twists", price: 20000, duration: 300 },
    { name: "Bohemian Braids", price: 25000, duration: 330 },
    { name: "Tribal Braids", price: 16000, duration: 180 },
  ],
  locs: [
    { name: "Loc Retwist", price: 8000, duration: 90 },
    { name: "Loc Start (Comb Coils)", price: 15000, duration: 180 },
    { name: "Loc Start (Two-Strand)", price: 15000, duration: 180 },
    { name: "Faux Locs (Hip Length)", price: 30000, duration: 420 },
    { name: "Faux Locs (Mid-Back)", price: 25000, duration: 360 },
    { name: "Butterfly Locs", price: 22000, duration: 300 },
    { name: "Loc Repair (per loc)", price: 2000, duration: 15 },
    { name: "Loc Detox & Deep Clean", price: 12000, duration: 120 },
    { name: "Loc Coloring", price: 18000, duration: 180 },
    { name: "Soft Locs", price: 24000, duration: 330 },
  ],
  natural: [
    { name: "Silk Press", price: 8500, duration: 90 },
    { name: "Wash & Go", price: 6500, duration: 60 },
    { name: "Twist-Out Set", price: 7500, duration: 75 },
    { name: "Deep Conditioning Treatment", price: 5000, duration: 45 },
    { name: "Natural Hair Trim & Shape", price: 4500, duration: 30 },
    { name: "Rod Set", price: 7000, duration: 90 },
    { name: "Flexi-Rod Set", price: 7500, duration: 90 },
    { name: "Bantu Knot-Out", price: 6500, duration: 60 },
    { name: "Blow-Out & Flat Iron", price: 9000, duration: 90 },
    { name: "Protein Treatment", price: 5500, duration: 45 },
  ],
  weaves: [
    { name: "Sew-In (Full)", price: 20000, duration: 180 },
    { name: "Sew-In (Partial)", price: 15000, duration: 120 },
    { name: "Quick Weave", price: 10000, duration: 90 },
    { name: "Frontal Install", price: 25000, duration: 180 },
    { name: "Closure Install", price: 20000, duration: 150 },
    { name: "Wig Install (Custom)", price: 15000, duration: 90 },
    { name: "Wig Construction", price: 30000, duration: 300 },
    { name: "Tape-In Extensions", price: 22000, duration: 120 },
    { name: "Clip-In Custom Cut", price: 8000, duration: 60 },
    { name: "Weave Takedown & Wash", price: 6000, duration: 60 },
  ],
  barber: [
    { name: "Fade (Low/Mid/High)", price: 3500, duration: 30 },
    { name: "Taper", price: 3000, duration: 30 },
    { name: "Lineup & Edge-Up", price: 2000, duration: 15 },
    { name: "Beard Trim & Shape", price: 2500, duration: 20 },
    { name: "Hot Towel Shave", price: 3500, duration: 30 },
    { name: "Kids Cut (12 & under)", price: 2500, duration: 25 },
    { name: "Design / Hair Art", price: 5000, duration: 45 },
    { name: "Loc Taper", price: 4000, duration: 35 },
    { name: "Full Cut & Style", price: 4500, duration: 40 },
    { name: "Buzz Cut", price: 2000, duration: 15 },
  ],
  color: [
    { name: "Full Color (Single Process)", price: 12000, duration: 120 },
    { name: "Highlights / Balayage", price: 18000, duration: 180 },
    { name: "Color Correction", price: 25000, duration: 240 },
    { name: "Vivid / Fashion Color", price: 20000, duration: 180 },
    { name: "Root Touch-Up", price: 8000, duration: 90 },
    { name: "Gloss / Toner", price: 6000, duration: 45 },
    { name: "Bleach & Tone", price: 15000, duration: 150 },
    { name: "Color Melt", price: 16000, duration: 150 },
    { name: "Rinse / Semi-Permanent", price: 7000, duration: 60 },
    { name: "Grey Blending", price: 10000, duration: 90 },
  ],
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}

function generatePhone(): string {
  const area = randomPick(["202", "301", "240", "703", "571"]);
  return `+1${area}${randomInt(200, 999)}${randomInt(1000, 9999)}`;
}

function generateAddress(city: string): string {
  const num = randomInt(100, 9999);
  const streets = [
    "Georgia Ave", "Connecticut Ave", "Wisconsin Ave", "Columbia Rd",
    "U St NW", "H St NE", "Martin Luther King Jr Blvd", "Rhode Island Ave",
    "Pennsylvania Ave", "New Hampshire Ave", "Colesville Rd", "University Blvd",
    "Piney Branch Rd", "Flower Ave", "Eastern Ave", "Annapolis Rd",
  ];
  return `${num} ${randomPick(streets)}`;
}

// BusinessData type inferred from insert object

async function main() {
  console.log("Seeding 50 business listings...\n");

  // Get superadmin ID
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin")
    .single();

  if (!adminProfile) {
    console.error("No super_admin found");
    process.exit(1);
  }

  // Create 50 fake owner accounts
  const ownerIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const firstName = randomPick(firstNames);
    const lastName = randomPick(lastNames);
    const email = `demo.owner${i + 1}@krowned.app`;

    const { data: user, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: "DemoPass123!",
      email_confirm: true,
      user_metadata: { full_name: `${firstName} ${lastName}`, account_type: "professional" },
    });

    if (authErr) {
      // May already exist
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((u) => u.email === email);
      if (found) {
        ownerIds.push(found.id);
      } else {
        console.error(`  Failed to create user ${email}:`, authErr.message);
        ownerIds.push(adminProfile.id);
      }
    } else {
      ownerIds.push(user.user!.id);
      // Ensure profile exists
      await supabase.from("profiles").upsert({
        id: user.user!.id,
        full_name: `${firstName} ${lastName}`,
      });
    }
  }

  console.log(`Created ${ownerIds.length} owner accounts.\n`);

  const catKeys = Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[];
  const planTiers: string[] = ["starter", "pro", "enterprise"];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < 50; i++) {
    const catKey = catKeys[i % catKeys.length];
    const catId = CATEGORIES[catKey];
    const planTier = randomPick(planTiers) as keyof typeof PLANS;
    const planId = PLANS[planTier];
    const city = cities[i % cities.length];
    const [lat, lng] = coords[city];

    // Generate unique name
    let name = `${randomPick(businessPrefixes)} ${randomPick(businessSuffixes)}`;
    let slug = slugify(name);
    let attempts = 0;
    while (usedSlugs.has(slug) && attempts < 10) {
      name = `${randomPick(businessPrefixes)} ${randomPick(businessSuffixes)}`;
      slug = slugify(name);
      attempts++;
    }
    if (usedSlugs.has(slug)) slug += `-${i}`;
    usedSlugs.add(slug);

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

    const business = {
      name,
      slug,
      primary_category_id: catId,
      plan_id: planId,
      subscription_status: "active",
      city: `${city}, ${states[city]}`,
      country: "US",
      address: generateAddress(city),
      latitude: lat + (Math.random() - 0.5) * 0.02,
      longitude: lng + (Math.random() - 0.5) * 0.02,
      description: randomPick(descriptions),
      phone: generatePhone(),
      is_published: true,
      verification_status: "verified" as const,
      timezone: "America/New_York",
      commission_rate: 0.1,
      owner_id: ownerIds[i],
      booking_link_token: token,
    };

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .insert(business)
      .select("id")
      .single();

    if (bizErr) {
      console.error(`  FAILED [${i + 1}] ${name}: ${bizErr.message}`);
      continue;
    }

    const bizId = biz.id;

    // Add staff (the owner as staff)
    const { data: staff } = await supabase
      .from("staff")
      .insert({
        business_id: bizId,
        user_id: ownerIds[i],
        display_name: (await supabase.from("profiles").select("full_name").eq("id", ownerIds[i]).single()).data?.full_name ?? "Stylist",
        status: "active",
      })
      .select("id")
      .single();

    // Add 3-5 services
    const templates = serviceTemplates[catKey];
    const numServices = randomInt(3, 5);
    const selectedServices = [...templates].sort(() => Math.random() - 0.5).slice(0, numServices);

    for (const svc of selectedServices) {
      const { data: service } = await supabase
        .from("services")
        .insert({
          business_id: bizId,
          name: svc.name,
          price_amount: svc.price + randomInt(-2000, 2000),
          currency: "usd",
          duration_minutes: svc.duration,
          is_active: true,
          payment_option: randomPick(["prepay", "pay_at_store", "both"]),
          category_id: catId,
        })
        .select("id")
        .single();

      // Link staff to service
      if (staff && service) {
        await supabase.from("staff_services").insert({
          staff_id: staff.id,
          service_id: service.id,
        });
      }
    }

    // Add business hours (Mon-Sat, closed Sunday)
    const openTime = randomPick(["08:00", "09:00", "10:00"]);
    const closeTime = randomPick(["18:00", "19:00", "20:00"]);
    const hourRows = [];
    for (let day = 1; day <= 6; day++) {
      hourRows.push({
        business_id: bizId,
        day_of_week: day,
        open_time: openTime,
        close_time: closeTime,
      });
    }
    await supabase.from("business_hours").insert(hourRows);

    console.log(`  [${i + 1}/50] ${name} (${catKey}, ${planTier}, ${city})`);
  }

  console.log("\nDone! 50 businesses seeded.");
}

main();
