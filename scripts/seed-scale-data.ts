/**
 * Zawadi — Scale seed script for realistic dev/demo data
 *
 * Creates 20 businesses, ~50 clients, ~200 bookings, reviews, favorites.
 * Keeps the 4 named test accounts from seed-test-data.ts intact.
 * Idempotent: safe to re-run (FK-ordered cleanup + upsert).
 *
 * Run:  npx tsx scripts/seed-scale-data.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * in .env.local (or exported).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Test1234!";

// ── Deterministic seeded random (for reproducibility) ──────────────
let _seed = 42;
function seededRandom() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => seededRandom() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randInt(min: number, max: number) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// ── Data pools ─────────────────────────────────────────────────────
const CITIES = [
  { city: "Nairobi", country: "KE", lat: -1.2921, lng: 36.8219 },
  { city: "Westlands", country: "KE", lat: -1.2673, lng: 36.8110 },
  { city: "Karen", country: "KE", lat: -1.3197, lng: 36.7116 },
  { city: "Kilimani", country: "KE", lat: -1.2891, lng: 36.7850 },
  { city: "Mombasa", country: "KE", lat: -4.0435, lng: 39.6682 },
  { city: "Kisumu", country: "KE", lat: -0.1022, lng: 34.7617 },
  { city: "Nakuru", country: "KE", lat: -0.3031, lng: 36.0800 },
  { city: "New York", country: "US", lat: 40.7128, lng: -74.006 },
  { city: "London", country: "GB", lat: 51.5074, lng: -0.1278 },
  { city: "Lagos", country: "NG", lat: 6.5244, lng: 3.3792 },
];

const FIRST_NAMES = [
  "Wanjiku", "Otieno", "Fatima", "Kwame", "Amara", "Jabari", "Zuri",
  "Kofi", "Aisha", "Tendai", "Nia", "Baraka", "Imani", "Chidi", "Lena",
  "Malaika", "Sefu", "Esther", "Hassan", "Grace", "Peter", "Joy",
  "Brian", "Mercy", "Kevin", "Lucy", "James", "Cynthia", "Moses", "Diana",
  "Samuel", "Winnie", "Dennis", "Gladys", "Victor", "Rose", "Patrick",
  "Faith", "Thomas", "Naomi", "George", "Ruth", "Vincent", "Beatrice",
  "Martin", "Angela", "Chris", "Alice", "Eric", "Dorothy",
];

const LAST_NAMES = [
  "Wanjiru", "Odhiambo", "Kamau", "Mwangi", "Njoroge", "Kipchoge",
  "Abubakar", "Nyambura", "Ouma", "Mutua", "Kariuki", "Atieno",
  "Ochieng", "Wambui", "Kimani", "Achola", "Maina", "Nyakundi",
  "Rotich", "Wafula", "Chebet", "Kibet", "Nzisa", "Onyango",
  "Mugo", "Were", "Abdi", "Gitau", "Njuguna", "Karanja",
];

const ADDRESSES = [
  "45 Kenyatta Avenue", "12 Moi Avenue", "78 Uhuru Highway",
  "23 Kimathi Street", "56 Tom Mboya Street", "89 Ngong Road",
  "34 Argwings Kodhek", "67 Ring Road Parklands", "101 Westlands Road",
  "15 Langata Road", "42 Valley Road", "88 Thika Road",
  "21 Forest Road", "55 Waiyaki Way", "73 Riverside Drive",
  "9 Lavington Green", "31 Dennis Pritt Road", "64 Lenana Road",
  "47 James Gichuru Road", "82 Limuru Road",
];

const AMENITIES_POOL = [
  "WiFi", "Parking", "Refreshments", "Wheelchair Accessible",
  "Air Conditioning", "Music", "Private Rooms", "Kids Area",
  "Loyalty Program", "Online Payment", "Walk-ins Welcome",
];

// Category → business names + services
interface BizTemplate {
  category: string;
  names: string[];
  services: { name: string; price: number; duration: number }[];
}

const BIZ_TEMPLATES: BizTemplate[] = [
  {
    category: "hair-barber",
    names: ["Crown Cuts", "Braids & Beyond", "Mane Attraction", "Shear Elegance"],
    services: [
      { name: "Men's Haircut", price: 2500, duration: 30 },
      { name: "Women's Blowout", price: 4500, duration: 60 },
      { name: "Box Braids", price: 8000, duration: 150 },
      { name: "Cornrows", price: 5000, duration: 90 },
      { name: "Hair Coloring", price: 7000, duration: 120 },
      { name: "Silk Press", price: 6000, duration: 75 },
      { name: "Dreadlock Maintenance", price: 3500, duration: 60 },
    ],
  },
  {
    category: "nails-beauty",
    names: ["Polished Nails", "Glam Tips Studio", "Nail Artistry"],
    services: [
      { name: "Gel Manicure", price: 3500, duration: 45 },
      { name: "Acrylic Full Set", price: 5500, duration: 90 },
      { name: "Pedicure Deluxe", price: 4000, duration: 60 },
      { name: "Nail Art Design", price: 2000, duration: 30 },
      { name: "Gel Pedicure", price: 4500, duration: 60 },
    ],
  },
  {
    category: "makeup-glam",
    names: ["Glam Squad Studio", "Beat Face Beauty", "Flawless by Design"],
    services: [
      { name: "Bridal Makeup", price: 15000, duration: 120 },
      { name: "Evening Glam", price: 8000, duration: 90 },
      { name: "Natural Day Look", price: 4500, duration: 60 },
      { name: "Lash Extensions", price: 6000, duration: 75 },
      { name: "Makeup Lesson", price: 5000, duration: 60 },
    ],
  },
  {
    category: "skincare-aesthetics",
    names: ["Glow Clinic", "Skin Lab Nairobi", "Radiance Aesthetics"],
    services: [
      { name: "Hydra Facial", price: 12000, duration: 75 },
      { name: "Chemical Peel", price: 8000, duration: 45 },
      { name: "Microdermabrasion", price: 10000, duration: 60 },
      { name: "LED Light Therapy", price: 6000, duration: 30 },
      { name: "Acne Treatment", price: 7000, duration: 60 },
    ],
  },
  {
    category: "spa-massage",
    names: ["Serenity Spa", "Tranquil Touch", "Zen Haven Spa"],
    services: [
      { name: "Swedish Massage", price: 6000, duration: 60 },
      { name: "Deep Tissue Massage", price: 8000, duration: 90 },
      { name: "Hot Stone Therapy", price: 9000, duration: 75 },
      { name: "Aromatherapy Session", price: 7000, duration: 60 },
      { name: "Couples Massage", price: 14000, duration: 90 },
    ],
  },
  {
    category: "fitness-wellness",
    names: ["Vitality Hub", "FitLife Studio", "Pulse Fitness"],
    services: [
      { name: "Personal Training", price: 5000, duration: 60 },
      { name: "Yoga Class", price: 2000, duration: 60 },
      { name: "Pilates Session", price: 3500, duration: 45 },
      { name: "HIIT Bootcamp", price: 1500, duration: 45 },
      { name: "Nutrition Consultation", price: 4000, duration: 30 },
    ],
  },
  {
    category: "at-home-mobile",
    names: ["GlamOnTheGo", "Mobile Beauty KE", "Doorstep Glam"],
    services: [
      { name: "Home Blowout", price: 5500, duration: 60 },
      { name: "Mobile Manicure", price: 4000, duration: 45 },
      { name: "Home Facial", price: 8000, duration: 60 },
      { name: "Event Makeup (On-site)", price: 10000, duration: 90 },
      { name: "Mobile Massage", price: 7500, duration: 60 },
    ],
  },
];

// Staff titles per category
const STAFF_TITLES: Record<string, string[]> = {
  "hair-barber": ["Hair Stylist", "Barber", "Braiding Specialist", "Colorist"],
  "nails-beauty": ["Nail Technician", "Nail Artist", "Manicurist"],
  "makeup-glam": ["Makeup Artist", "Lash Technician", "Beauty Specialist"],
  "skincare-aesthetics": ["Aesthetician", "Skin Therapist", "Dermal Technician"],
  "spa-massage": ["Massage Therapist", "Spa Therapist", "Wellness Practitioner"],
  "fitness-wellness": ["Personal Trainer", "Yoga Instructor", "Fitness Coach"],
  "at-home-mobile": ["Mobile Stylist", "Mobile Technician", "Freelance Artist"],
};

const REVIEW_COMMENTS = {
  5: [
    "Absolutely amazing experience! Will definitely be back.",
    "Best service I've ever had. Highly recommend!",
    "Incredible attention to detail. Love the results!",
    "Professional, friendly, and talented. 10/10!",
    "Exceeded my expectations. The staff is wonderful.",
    "Perfect! Exactly what I wanted. So happy!",
  ],
  4: [
    "Great service overall. Minor wait but worth it.",
    "Really good experience. Would come again.",
    "Very professional. Slight scheduling hiccup but all good.",
    "Lovely place, skilled staff. Parking was tricky.",
    "Good value for money. Clean and welcoming.",
  ],
  3: [
    "Decent service. Nothing special but got the job done.",
    "Average experience. The result was okay.",
    "It was fine. Expected a bit more for the price.",
    "Okay service. Staff was nice but rushed.",
  ],
  2: [
    "Not great. Had to wait way too long.",
    "Disappointed with the result. Expected better quality.",
    "Below average. Wouldn't return at this price point.",
  ],
  1: [
    "Very poor experience. Would not recommend.",
    "Terrible service. Staff was rude and unprofessional.",
  ],
};

const REVIEW_RESPONSES = [
  "Thank you so much for your kind words! We look forward to seeing you again.",
  "We appreciate your feedback! We're always working to improve.",
  "Thanks for visiting us! Sorry about the wait — we're working on better scheduling.",
  "We're glad you enjoyed your experience! See you next time.",
  "Thank you for the honest review. We'll take your feedback to heart.",
];

const CLIENT_NOTES = [
  "First time visiting, excited!",
  "Please use hypoallergenic products.",
  "Running a bit late, will be there in 10 min.",
  "I have a reference photo to show.",
  "Same as last time please!",
  "",
  "",
  "",
];

// ── Helpers ─────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function futureDate(daysFromNow: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function pastDate(daysAgo: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Cache of all users to avoid repeated listUsers calls
let _userCache: { id: string; email?: string }[] | null = null;

async function getAllUsers() {
  if (_userCache) return _userCache;
  const all: { id: string; email?: string }[] = [];
  let page = 1;
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users?.length) break;
    all.push(...data.users.map((u) => ({ id: u.id, email: u.email })));
    if (data.users.length < 1000) break;
    page++;
  }
  _userCache = all;
  return all;
}

async function upsertUser(email: string, full_name: string): Promise<string> {
  const users = await getAllUsers();
  const found = users.find((u) => u.email === email);

  if (found) {
    await supabase.from("profiles").update({ full_name }).eq("id", found.id);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`);

  await supabase
    .from("profiles")
    .upsert({ id: data.user.id, full_name }, { onConflict: "id" });

  // Add to cache
  _userCache?.push({ id: data.user.id, email });
  return data.user.id;
}

// ── Business definitions ────────────────────────────────────────────
interface BusinessDef {
  ownerName: string;
  ownerEmail: string;
  bizName: string;
  template: BizTemplate;
  cityInfo: typeof CITIES[number];
  planTier: "free" | "premium";
  subscriptionStatus: "active" | "trialing" | "canceled" | null;
  verificationStatus: "verified" | "pending" | "suspended";
  isPublished: boolean;
  isFeatured: boolean;
  staffCount: number; // 1-3
  serviceCount: number; // 2-5
}

function generateBusinessDefs(): BusinessDef[] {
  const defs: BusinessDef[] = [];
  let nameIdx = 0;

  // Distribute businesses across categories:
  // hair-barber: 4, nails-beauty: 3, makeup-glam: 3, skincare: 2, spa: 3, fitness: 3, mobile: 2 = 20
  const categoryDistribution = [
    { cat: "hair-barber", count: 4 },
    { cat: "nails-beauty", count: 3 },
    { cat: "makeup-glam", count: 3 },
    { cat: "skincare-aesthetics", count: 2 },
    { cat: "spa-massage", count: 3 },
    { cat: "fitness-wellness", count: 3 },
    { cat: "at-home-mobile", count: 2 },
  ];

  for (const { cat, count } of categoryDistribution) {
    const template = BIZ_TEMPLATES.find((t) => t.category === cat)!;

    for (let i = 0; i < count; i++) {
      const bizNameBase = template.names[i % template.names.length];
      const cityInfo = CITIES[nameIdx % CITIES.length];
      const suffix = i >= template.names.length ? ` ${cityInfo.city}` : "";
      const bizName = bizNameBase + suffix;

      const ownerFirst = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
      const ownerLast = LAST_NAMES[nameIdx % LAST_NAMES.length];

      // Plan mix: ~12 premium, ~6 free, ~2 trialing
      let planTier: "free" | "premium" = "premium";
      let subscriptionStatus: "active" | "trialing" | "canceled" | null = "active";
      if (nameIdx === 4 || nameIdx === 9 || nameIdx === 13 || nameIdx === 16 || nameIdx === 18 || nameIdx === 19) {
        planTier = "free";
        subscriptionStatus = null;
      } else if (nameIdx === 2 || nameIdx === 7) {
        subscriptionStatus = "trialing";
      }

      // Verification: ~14 verified, ~4 pending, 1 suspended, 1 pending+unpublished
      let verificationStatus: "verified" | "pending" | "suspended" = "verified";
      let isPublished = true;
      if (nameIdx === 11 || nameIdx === 14 || nameIdx === 17) {
        verificationStatus = "pending";
      } else if (nameIdx === 15) {
        verificationStatus = "suspended";
        isPublished = false;
      }

      // Featured: only verified + premium
      const isFeatured =
        verificationStatus === "verified" &&
        planTier === "premium" &&
        (nameIdx < 5 || nameIdx === 8 || nameIdx === 10);

      defs.push({
        ownerName: `${ownerFirst} ${ownerLast}`,
        ownerEmail: `owner${nameIdx + 1}@zawaditest.com`,
        bizName,
        template,
        cityInfo,
        planTier,
        subscriptionStatus,
        verificationStatus,
        isPublished,
        isFeatured,
        staffCount: 1 + (nameIdx % 3), // 1-3
        serviceCount: 2 + (nameIdx % 4), // 2-5
      });

      nameIdx++;
    }
  }

  return defs;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱 Seeding Zawadi scale data (20 businesses, ~50 clients)...\n");

  // Fetch plans + categories
  const { data: plans } = await supabase.from("plans").select("id, tier");
  if (!plans || plans.length < 2) throw new Error("Plans not found — run migrations first");
  const premiumPlanId = plans.find((p) => p.tier === "premium")!.id;
  const freePlanId = plans.find((p) => p.tier === "free")!.id;

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, slug");
  if (!categories?.length) throw new Error("No categories — run migrations first");
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // Generate business definitions
  const bizDefs = generateBusinessDefs();

  // ── Create client users (50) ──────────────────────────────────────
  console.log("1. Creating ~50 client users...");
  const clientIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const first = FIRST_NAMES[(i + 10) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i + 5) % LAST_NAMES.length];
    const email = `client${i + 1}@zawaditest.com`;
    const id = await upsertUser(email, `${first} ${last}`);
    clientIds.push(id);
  }
  console.log(`  ✓ ${clientIds.length} client users ready`);

  // ── Create owner + staff users ────────────────────────────────────
  console.log("\n2. Creating owner + staff users...");
  const ownerIds: string[] = [];
  const allStaffUserIds: string[] = [];

  for (const def of bizDefs) {
    const ownerId = await upsertUser(def.ownerEmail, def.ownerName);
    ownerIds.push(ownerId);

    for (let s = 0; s < def.staffCount; s++) {
      const sIdx = ownerIds.length * 3 + s;
      const first = FIRST_NAMES[(sIdx + 20) % FIRST_NAMES.length];
      const last = LAST_NAMES[(sIdx + 10) % LAST_NAMES.length];
      const email = `staff${ownerIds.length}_${s + 1}@zawaditest.com`;
      const id = await upsertUser(email, `${first} ${last}`);
      allStaffUserIds.push(id);
    }
  }
  console.log(`  ✓ ${ownerIds.length} owners, ${allStaffUserIds.length} staff users ready`);

  // ── Clean existing scale data ─────────────────────────────────────
  console.log("\n3. Cleaning existing scale business data...");

  // Find all scale businesses by slug pattern
  const scaleSlugs = bizDefs.map((d) => slugify(d.bizName));
  const { data: existingBizzes } = await supabase
    .from("businesses")
    .select("id")
    .in("slug", scaleSlugs);

  const existingBizIds = existingBizzes?.map((b) => b.id) ?? [];

  if (existingBizIds.length > 0) {
    // Get staff IDs for these businesses
    const { data: existStaff } = await supabase
      .from("staff")
      .select("id")
      .in("business_id", existingBizIds);
    const existStaffIds = existStaff?.map((s) => s.id) ?? [];

    if (existStaffIds.length > 0) {
      await supabase.from("schedule_exceptions").delete().in("staff_id", existStaffIds);
      await supabase.from("staff_schedules").delete().in("staff_id", existStaffIds);
      await supabase.from("staff_services").delete().in("staff_id", existStaffIds);
    }

    // Get booking IDs for these businesses
    const { data: existBookings } = await supabase
      .from("bookings")
      .select("id")
      .in("business_id", existingBizIds);
    const existBookingIds = existBookings?.map((b) => b.id) ?? [];

    if (existBookingIds.length > 0) {
      await supabase.from("review_responses").delete().in(
        "review_id",
        (await supabase.from("reviews").select("id").in("booking_id", existBookingIds))
          .data?.map((r) => r.id) ?? [],
      );
      await supabase.from("reviews").delete().in("booking_id", existBookingIds);
      await supabase.from("payments").delete().in("booking_id", existBookingIds);
    }
    await supabase.from("bookings").delete().in("business_id", existingBizIds);

    if (existStaffIds.length > 0) {
      await supabase.from("staff").delete().in("business_id", existingBizIds);
    }
    await supabase.from("services").delete().in("business_id", existingBizIds);
    await supabase.from("favorites").delete().in("business_id", existingBizIds);
    await supabase.from("subscriptions").delete().in("business_id", existingBizIds);
    await supabase.from("business_hours").delete().in("business_id", existingBizIds);
    await supabase.from("businesses").delete().in("id", existingBizIds);
  }
  console.log(`  ✓ Cleaned ${existingBizIds.length} existing scale businesses`);

  // Also clean any bookings by scale clients for the original seed business
  // (these would be new bookings we create below)
  await supabase.from("bookings").delete().in("client_id", clientIds);

  // ── Create businesses ─────────────────────────────────────────────
  console.log("\n4. Creating 20 businesses...");

  const createdBusinesses: {
    id: string;
    def: BusinessDef;
    serviceIds: string[];
    staffRowIds: string[];
  }[] = [];

  let staffUserOffset = 0;

  for (let bi = 0; bi < bizDefs.length; bi++) {
    const def = bizDefs[bi];
    const ownerId = ownerIds[bi];
    const slug = slugify(def.bizName);
    const planId = def.planTier === "premium" ? premiumPlanId : freePlanId;

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        owner_id: ownerId,
        name: def.bizName,
        slug,
        description: `Welcome to ${def.bizName}! We offer top-quality ${def.template.category.replace("-", " & ")} services in ${def.cityInfo.city}.`,
        primary_category_id: catMap[def.template.category],
        phone: `+254 7${String(randInt(10000000, 99999999))}`,
        email: `hello@${slug}.test`,
        address: ADDRESSES[bi % ADDRESSES.length],
        city: def.cityInfo.city,
        country: def.cityInfo.country,
        latitude: def.cityInfo.lat + (seededRandom() - 0.5) * 0.05,
        longitude: def.cityInfo.lng + (seededRandom() - 0.5) * 0.05,
        default_payment_option: pick(["both", "prepay", "pay_at_store"]) as "both" | "prepay" | "pay_at_store",
        commission_rate: pick([0.05, 0.05, 0.05, 0.08, 0.10]),
        verification_status: def.verificationStatus,
        charges_enabled: def.planTier === "premium" && def.verificationStatus === "verified",
        payouts_enabled: def.planTier === "premium" && def.verificationStatus === "verified",
        plan_id: planId,
        subscription_status: def.subscriptionStatus ?? ("canceled" as const),
        trial_ends_at: def.subscriptionStatus === "trialing" ? futureDate(14, 0) : null,
        booking_link_token: `blt-${slug}`,
        is_published: def.isPublished,
        is_featured: def.isFeatured,
        featured_until: def.isFeatured ? futureDate(60, 0) : null,
        amenities: JSON.stringify(pickN(AMENITIES_POOL, randInt(2, 5))),
      })
      .select("id")
      .single();

    if (bizErr) throw new Error(`Business insert ${def.bizName}: ${bizErr.message}`);
    const businessId = biz.id;

    // Business hours (most Mon-Sat, some Mon-Fri, some 7 days)
    const pattern = bi % 3;
    const days = pattern === 0 ? [1, 2, 3, 4, 5, 6] : pattern === 1 ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
    const openHour = pick(["08:00:00", "09:00:00", "10:00:00"]);
    const closeHour = pick(["17:00:00", "18:00:00", "19:00:00", "20:00:00"]);
    await supabase.from("business_hours").insert(
      days.map((d) => ({
        business_id: businessId,
        day_of_week: d,
        open_time: openHour,
        close_time: closeHour,
      })),
    );

    // Subscription (Premium/trialing only)
    if (def.planTier === "premium" || def.subscriptionStatus === "trialing") {
      await supabase.from("subscriptions").insert({
        business_id: businessId,
        plan_id: premiumPlanId,
        status: def.subscriptionStatus ?? "active",
        seat_count: def.staffCount,
        current_period_end: futureDate(30, 0),
        trial_ends_at: def.subscriptionStatus === "trialing" ? futureDate(14, 0) : null,
        cancel_at_period_end: false,
      });
    }

    // Services
    const serviceDefs = pickN(def.template.services, def.serviceCount);
    const { data: svcRows, error: svcErr } = await supabase
      .from("services")
      .insert(
        serviceDefs.map((s) => ({
          business_id: businessId,
          category_id: catMap[def.template.category],
          name: s.name,
          description: `Professional ${s.name.toLowerCase()} service at ${def.bizName}.`,
          price_amount: s.price + randInt(-500, 500),
          currency: "USD",
          duration_minutes: s.duration,
          payment_option: pick(["both", "prepay", "both"]) as "both" | "prepay" | "pay_at_store",
          is_active: true,
        })),
      )
      .select("id");
    if (svcErr) throw new Error(`Services insert ${def.bizName}: ${svcErr.message}`);
    const serviceIds = svcRows.map((s) => s.id);

    // Staff
    const staffRowIds: string[] = [];
    for (let si = 0; si < def.staffCount; si++) {
      const staffUserId = allStaffUserIds[staffUserOffset + si];
      const staffEmail = `staff${bi + 1}_${si + 1}@zawaditest.com`;
      const users = await getAllUsers();
      const staffUser = users.find((u) => u.email === staffEmail);
      const titlePool = STAFF_TITLES[def.template.category] ?? ["Specialist"];

      const { data: staffRow, error: staffErr } = await supabase
        .from("staff")
        .insert({
          business_id: businessId,
          user_id: staffUserId,
          invited_email: staffEmail,
          display_name: staffUser
            ? (await supabase.from("profiles").select("full_name").eq("id", staffUserId).single()).data?.full_name ?? "Staff"
            : "Staff",
          title: titlePool[si % titlePool.length],
          bio: `Experienced ${titlePool[si % titlePool.length].toLowerCase()} at ${def.bizName}.`,
          status: "active",
        })
        .select("id")
        .single();
      if (staffErr) throw new Error(`Staff insert: ${staffErr.message}`);
      staffRowIds.push(staffRow.id);

      // Staff-service mapping (each staff can do 1-3 services)
      const capableServices = pickN(serviceIds, randInt(1, Math.min(3, serviceIds.length)));
      await supabase.from("staff_services").insert(
        capableServices.map((svcId) => ({
          staff_id: staffRow.id,
          service_id: svcId,
        })),
      );

      // Weekly schedule (Mon-Fri or Mon-Sat)
      const workDays = si === 0 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
      const startTime = pick(["08:00:00", "09:00:00", "10:00:00"]);
      const endTime = pick(["16:00:00", "17:00:00", "18:00:00"]);
      await supabase.from("staff_schedules").insert(
        workDays.map((d) => ({
          staff_id: staffRow.id,
          day_of_week: d,
          start_time: startTime,
          end_time: endTime,
        })),
      );

      // Some staff get schedule exceptions
      if (seededRandom() > 0.5) {
        await supabase.from("schedule_exceptions").insert({
          staff_id: staffRow.id,
          starts_at: futureDate(randInt(5, 14), 0),
          ends_at: futureDate(randInt(15, 20), 23),
          reason: pick(["Vacation", "Personal day", "Training", "Medical leave"]),
          is_available: false,
        });
      }
    }
    staffUserOffset += def.staffCount;

    createdBusinesses.push({ id: businessId, def, serviceIds, staffRowIds });

    const icon = def.isFeatured ? "⭐" : def.planTier === "premium" ? "💎" : "🆓";
    process.stdout.write(`  ${icon} ${def.bizName} (${def.cityInfo.city}, ${def.planTier}, ${def.verificationStatus})\n`);
  }

  // ── Bookings ──────────────────────────────────────────────────────
  console.log("\n5. Creating bookings...");

  const bookableBusinesses = createdBusinesses.filter(
    (b) =>
      b.def.planTier === "premium" &&
      b.def.verificationStatus === "verified" &&
      b.def.isPublished,
  );

  interface BookingRecord {
    id: string;
    businessIdx: number;
    staffRowId: string;
    clientId: string;
    status: string;
  }
  const allBookings: BookingRecord[] = [];
  let bookingCount = 0;

  for (const biz of bookableBusinesses) {
    // 8-15 bookings per bookable business
    const numBookings = randInt(8, 15);

    for (let bi = 0; bi < numBookings; bi++) {
      const clientId = pick(clientIds);
      const serviceId = pick(biz.serviceIds);
      const staffRowId = pick(biz.staffRowIds);
      const source = pick(["marketplace", "marketplace", "direct_link", "direct_link", "manual"]) as
        "marketplace" | "direct_link" | "manual";

      // Status distribution: ~40% completed, ~25% confirmed, ~15% pending, ~10% cancelled, ~10% no_show
      const statusRoll = seededRandom();
      let status: "completed" | "confirmed" | "pending" | "cancelled" | "no_show";
      let isPast: boolean;

      if (statusRoll < 0.4) {
        status = "completed";
        isPast = true;
      } else if (statusRoll < 0.65) {
        status = "confirmed";
        isPast = false;
      } else if (statusRoll < 0.8) {
        status = "pending";
        isPast = false;
      } else if (statusRoll < 0.9) {
        status = "cancelled";
        isPast = seededRandom() > 0.5;
      } else {
        status = "no_show";
        isPast = true;
      }

      const hour = randInt(9, 16);
      const daysOffset = isPast ? randInt(1, 60) : randInt(1, 30);
      const startsAt = isPast ? pastDate(daysOffset, hour) : futureDate(daysOffset, hour);

      // Look up the service price
      const { data: svc } = await supabase
        .from("services")
        .select("price_amount, duration_minutes")
        .eq("id", serviceId)
        .single();
      const serviceAmount = svc?.price_amount ?? 5000;
      const duration = svc?.duration_minutes ?? 60;

      const endsAtDate = new Date(startsAt);
      endsAtDate.setMinutes(endsAtDate.getMinutes() + duration);
      const endsAt = endsAtDate.toISOString();

      const tipAmount = status === "completed" && seededRandom() > 0.4
        ? randInt(2, 10) * 100
        : 0;
      const commissionRate = pick([0.05, 0.05, 0.08, 0.10]);
      const platformFee = Math.round(serviceAmount * commissionRate);

      const paymentMethod = pick(["prepay", "prepay", "pay_at_store"]) as "prepay" | "pay_at_store";

      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          client_id: clientId,
          business_id: biz.id,
          service_id: serviceId,
          staff_id: staffRowId,
          staff_chosen_by_client: seededRandom() > 0.5,
          source,
          starts_at: startsAt,
          ends_at: endsAt,
          status,
          payment_method: paymentMethod,
          service_amount: serviceAmount,
          tip_amount: tipAmount,
          platform_fee_amount: platformFee,
          currency: "USD",
          client_note: pick(CLIENT_NOTES) || null,
          cancelled_by: status === "cancelled" ? clientId : null,
          cancellation_reason: status === "cancelled" ? pick(["Schedule conflict", "Changed my mind", "Found another provider"]) : null,
        })
        .select("id")
        .single();

      if (bookErr) {
        // Duplicate slot or other constraint — skip
        continue;
      }
      bookingCount++;

      allBookings.push({
        id: booking.id,
        businessIdx: createdBusinesses.indexOf(biz),
        staffRowId,
        clientId,
        status,
      });

      // Payment for completed/confirmed prepay bookings
      if (paymentMethod === "prepay" && (status === "completed" || status === "confirmed")) {
        await supabase.from("payments").insert({
          booking_id: booking.id,
          stripe_payment_intent_id: `pi_test_scale_${booking.id.slice(0, 8)}`,
          amount: serviceAmount + tipAmount,
          tip_amount: tipAmount,
          application_fee_amount: platformFee,
          currency: "USD",
          status: status === "completed" ? "succeeded" : "processing",
        });
      }
    }
  }
  console.log(`  ✓ ${bookingCount} bookings created`);

  // ── Reviews (on completed bookings) ───────────────────────────────
  console.log("\n6. Creating reviews...");
  const completedBookings = allBookings.filter((b) => b.status === "completed");
  let reviewCount = 0;
  let responseCount = 0;

  for (const booking of completedBookings) {
    // ~80% of completed bookings get reviewed
    if (seededRandom() > 0.8) continue;

    // Rating distribution: weighted toward 4-5
    const ratingRoll = seededRandom();
    let rating: 1 | 2 | 3 | 4 | 5;
    if (ratingRoll < 0.35) rating = 5;
    else if (ratingRoll < 0.65) rating = 4;
    else if (ratingRoll < 0.82) rating = 3;
    else if (ratingRoll < 0.93) rating = 2;
    else rating = 1;

    const comments = REVIEW_COMMENTS[rating];
    const biz = createdBusinesses[booking.businessIdx];

    const { data: review, error: revErr } = await supabase
      .from("reviews")
      .insert({
        booking_id: booking.id,
        client_id: booking.clientId,
        business_id: biz.id,
        staff_id: booking.staffRowId,
        rating,
        comment: pick(comments),
        status: "published",
      })
      .select("id")
      .single();

    if (revErr) continue; // duplicate constraint
    reviewCount++;

    // ~40% of reviews get a response from the owner
    if (seededRandom() < 0.4) {
      const ownerId = ownerIds[booking.businessIdx];
      await supabase.from("review_responses").insert({
        review_id: review.id,
        responder_id: ownerId,
        body: pick(REVIEW_RESPONSES),
      });
      responseCount++;
    }
  }
  console.log(`  ✓ ${reviewCount} reviews, ${responseCount} responses`);

  // ── Favorites ─────────────────────────────────────────────────────
  console.log("\n7. Creating favorites...");
  let favCount = 0;
  const verifiedBizIds = createdBusinesses
    .filter((b) => b.def.verificationStatus === "verified" && b.def.isPublished)
    .map((b) => b.id);

  for (const clientId of clientIds) {
    // Each client favorites 1-4 businesses
    const favBizzes = pickN(verifiedBizIds, randInt(1, 4));
    for (const bizId of favBizzes) {
      await supabase
        .from("favorites")
        .upsert({ client_id: clientId, business_id: bizId }, { onConflict: "client_id,business_id" });
      favCount++;
    }
  }
  console.log(`  ✓ ${favCount} favorites`);

  // ── Summary ───────────────────────────────────────────────────────
  const premiumCount = bizDefs.filter((d) => d.planTier === "premium" && d.subscriptionStatus === "active").length;
  const trialCount = bizDefs.filter((d) => d.subscriptionStatus === "trialing").length;
  const freeCount = bizDefs.filter((d) => d.planTier === "free").length;
  const verifiedCount = bizDefs.filter((d) => d.verificationStatus === "verified").length;
  const pendingCount = bizDefs.filter((d) => d.verificationStatus === "pending").length;
  const suspendedCount = bizDefs.filter((d) => d.verificationStatus === "suspended").length;
  const featuredCount = bizDefs.filter((d) => d.isFeatured).length;

  console.log("\n" + "=".repeat(72));
  console.log("  ZAWADI SCALE SEED — Summary");
  console.log("=".repeat(72));
  console.log("");
  console.log("  Businesses:      20 total");
  console.log(`    Premium:       ${premiumCount} active, ${trialCount} trialing`);
  console.log(`    Free:          ${freeCount}`);
  console.log(`    Verified:      ${verifiedCount}  |  Pending: ${pendingCount}  |  Suspended: ${suspendedCount}`);
  console.log(`    Featured:      ${featuredCount}`);
  console.log(`  Clients:         ${clientIds.length}`);
  console.log(`  Staff users:     ${allStaffUserIds.length}`);
  console.log(`  Bookings:        ${bookingCount}`);
  console.log(`  Reviews:         ${reviewCount} (${responseCount} with owner responses)`);
  console.log(`  Favorites:       ${favCount}`);
  console.log("");
  console.log("  RECOMMENDED TEST ACCOUNTS (all use password: Test1234!)");
  console.log("  ─".repeat(36));
  console.log("");
  console.log("  1. client1@zawaditest.com");
  console.log("     → Client with bookings + favorites across multiple businesses");
  console.log("");
  console.log("  2. owner1@zawaditest.com");
  console.log("     → Owner of Crown Cuts (Premium, verified, featured, hair-barber)");
  console.log("");
  console.log("  3. owner5@zawaditest.com");
  console.log("     → Owner of a Free-tier business (Glam Tips Studio) — sees gated UI");
  console.log("");
  console.log("  4. owner3@zawaditest.com");
  console.log("     → Owner of a trialing business (Mane Attraction) — full features, trial countdown");
  console.log("");
  console.log("  5. staff1_1@zawaditest.com");
  console.log("     → Staff at Crown Cuts — schedule, appointments, earnings views");
  console.log("");
  console.log("  6. admin@zawaditest.com");
  console.log("     → Super Admin — sees all 20 businesses, users, disputes");
  console.log("");
  console.log("  (The original 4 named accounts still work: admin/owner/staff/client @zawaditest.com)");
  console.log("");
  console.log("=".repeat(72));
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Scale seed failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
