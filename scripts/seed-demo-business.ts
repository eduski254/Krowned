/**
 * Seed a demo business with ~11 months of realistic data.
 * Run: npx tsx scripts/seed-demo-business.ts
 *
 * Creates:
 * - 1 owner auth account + profile
 * - 1 business ("Crown & Glory Braids" in Silver Spring, MD)
 * - Business hours (Tue–Sat)
 * - 3 staff members (owner is also a stylist)
 * - 8 services across categories
 * - Staff schedules + staff_services links
 * - ~300 bookings spanning Aug 2025 – Jul 2026
 * - ~80 reviews on completed bookings
 * - A handful of upcoming bookings
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Config ──────────────────────────────────────────────────────────────

const DEMO_EMAIL = "demo@krowned.app";
const DEMO_PASSWORD = "DemoKrowned2026!";
const BUSINESS_NAME = "Crown & Glory Braids";
const BUSINESS_SLUG = "crown-and-glory-braids";
const TZ = "America/New_York";

// ── Helpers ─────────────────────────────────────────────────────────────

function uuid() {
  return randomUUID();
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function setTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding demo business...\n");

  // 0. Clean up any prior demo run
  // Delete all demo auth users (owner + staff + clients)
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const demoUsers = allUsers?.filter((u) => u.email?.endsWith("@demo.krowned.app") || u.email === DEMO_EMAIL) ?? [];
  if (demoUsers.length > 0) {
    console.log(`  Cleaning up ${demoUsers.length} demo auth users...`);
    for (const u of demoUsers) {
      // Delete profile first (FK), then auth user
      await supabase.from("profiles").delete().eq("id", u.id);
      await supabase.auth.admin.deleteUser(u.id);
    }
  }
  const existingAuth = allUsers?.find((u) => u.email === DEMO_EMAIL);

  if (existingAuth) {
    console.log("Cleaning up previous demo data...");
    const userId = existingAuth.id;

    const { data: existingBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (existingBiz) {
      const bizId = existingBiz.id;
      // Collect IDs before deleting
      const { data: staffRows } = await supabase.from("staff").select("id, user_id").eq("business_id", bizId);
      const staffIds = staffRows?.map((s: { id: string }) => s.id) ?? [];
      const staffUserIds = staffRows?.map((s: { user_id: string }) => s.user_id).filter((id) => id !== userId) ?? [];

      const { data: bookingRows } = await supabase.from("bookings").select("id, client_id").eq("business_id", bizId);
      const bookingIds = bookingRows?.map((b: { id: string }) => b.id) ?? [];
      const clientIdsToDelete = [...new Set(
        (bookingRows ?? []).map((b: { client_id: string | null }) => b.client_id).filter((id): id is string => !!id && id !== userId),
      )];

      // Delete in FK order
      const { data: reviewRows } = await supabase.from("reviews").select("id").eq("business_id", bizId);
      const reviewIds = reviewRows?.map((r: { id: string }) => r.id) ?? [];
      if (reviewIds.length) await supabase.from("review_responses").delete().in("review_id", reviewIds);
      await supabase.from("reviews").delete().eq("business_id", bizId);
      if (bookingIds.length) await supabase.from("payments").delete().in("booking_id", bookingIds);
      await supabase.from("bookings").delete().eq("business_id", bizId);
      if (staffIds.length) {
        await supabase.from("staff_services").delete().in("staff_id", staffIds);
        await supabase.from("staff_schedules").delete().in("staff_id", staffIds);
        await supabase.from("schedule_exceptions").delete().in("staff_id", staffIds);
      }
      await supabase.from("staff").delete().eq("business_id", bizId);
      await supabase.from("services").delete().eq("business_id", bizId);
      await supabase.from("business_hours").delete().eq("business_id", bizId);
      await supabase.from("business_contacts").delete().eq("business_id", bizId);
      await supabase.from("favorites").delete().eq("business_id", bizId);
      await supabase.from("businesses").delete().eq("id", bizId);

      // Delete staff profiles + auth users
      for (const suid of staffUserIds) {
        await supabase.from("profiles").delete().eq("id", suid);
        await supabase.auth.admin.deleteUser(suid);
      }
      // Delete demo client profiles + auth users
      for (const cId of clientIdsToDelete) {
        await supabase.from("profiles").delete().eq("id", cId);
        await supabase.auth.admin.deleteUser(cId);
      }
    }

    // Delete owner profile and auth user
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    console.log("  Previous demo data removed.\n");
  }

  // 1. Get plan IDs and category IDs
  const { data: plans } = await supabase.from("plans").select("id, tier");
  const proPlan = plans?.find((p) => p.tier === "pro");
  if (!proPlan) throw new Error("Pro plan not found in DB");

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, slug");
  const catMap = Object.fromEntries(
    (categories ?? []).map((c) => [c.slug, c.id]),
  );
  console.log("  Plans & categories loaded.");

  // 2. Create owner auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Keisha Mitchell", account_type: "professional" },
  });
  if (authErr) throw authErr;
  const ownerId = authData.user.id;
  console.log(`  Owner created: ${ownerId}`);

  // 3. Create profile (no email column — email is on auth.users)
  await supabase.from("profiles").upsert({
    id: ownerId,
    full_name: "Keisha Mitchell",
    phone: "+12025551234",
    avatar_url: null,
    platform_role: "user",
  });

  // 4. Create business
  const businessId = uuid();
  await supabase.from("businesses").insert({
    id: businessId,
    owner_id: ownerId,
    name: BUSINESS_NAME,
    slug: BUSINESS_SLUG,
    description:
      "DMV's go-to destination for knotless braids, locs, and protective styles. " +
      "Keisha and her team specialize in textured hair — natural, relaxed, or transitioning. " +
      "Clean studio, on-time appointments, and styles that last. Walk-ins welcome on Saturdays.",
    address: "8455 Colesville Rd, Suite 200",
    city: "Silver Spring",
    country: "US",
    phone: "+12025551234",
    email: DEMO_EMAIL,
    timezone: TZ,
    latitude: 38.9946,
    longitude: -77.0272,
    plan_id: proPlan.id,
    subscription_status: "active",
    verification_status: "verified",
    is_published: true,
    commission_rate: 0.1,
    primary_category_id: catMap["braids-protective"] ?? null,
    onboarding_completed_at: new Date("2025-08-01").toISOString(),
    default_payment_option: "pay_at_store",
    cover_url: null,
    logo_url: null,
    social_links: {
      instagram: "https://instagram.com/crownandglorybraids",
    },
    amenities: ["WiFi", "Parking", "Beverages", "Phone Chargers"],
  });
  console.log(`  Business created: ${BUSINESS_NAME}`);

  // 5. Business hours (Tue–Sat, closed Sun–Mon)
  const DAYS = [
    { day: 0, open: false }, // Sun
    { day: 1, open: false }, // Mon
    { day: 2, open: true, start: "09:00", end: "19:00" }, // Tue
    { day: 3, open: true, start: "09:00", end: "19:00" }, // Wed
    { day: 4, open: true, start: "09:00", end: "19:00" }, // Thu
    { day: 5, open: true, start: "09:00", end: "19:00" }, // Fri
    { day: 6, open: true, start: "08:00", end: "17:00" }, // Sat
  ];

  const { error: hoursErr } = await supabase.from("business_hours").insert(
    DAYS.map((d) => ({
      business_id: businessId,
      day_of_week: d.day,
      open_time: d.open ? d.start : null,
      close_time: d.open ? d.end : null,
    })),
  );
  if (hoursErr) console.error("  Hours error:", hoursErr.message);
  console.log("  Business hours set (Tue–Sat).");

  // 6. Staff (owner + 2 more)
  const staffData = [
    {
      id: uuid(),
      userId: ownerId,
      name: "Keisha M.",
      title: "Owner / Lead Braider",
      bio: "15+ years in protective styling. Knotless braids are my specialty — clean parts, lightweight tension, styles that last 6–8 weeks.",
    },
    {
      id: uuid(),
      userId: null, // staff-only, no auth account
      name: "Aisha T.",
      title: "Loc Technician",
      bio: "Freeform and traditional locs, retwists, interlocks, and loc repairs. 8 years of experience.",
    },
    {
      id: uuid(),
      userId: null,
      name: "Maya J.",
      title: "Stylist",
      bio: "Silk presses, twist-outs, and natural hair care. Certified in DevaCurl and heat-damage repair.",
    },
  ];

  for (const s of staffData) {
    // If staff has no auth account, create an auth user + profile
    let profileId = s.userId;
    if (!profileId) {
      const staffEmail = `${s.name.toLowerCase().replace(/[^a-z]/g, "")}@demo.krowned.app`;
      const { data: staffAuth, error: staffAuthErr } = await supabase.auth.admin.createUser({
        email: staffEmail,
        password: "DemoStaff2026!",
        email_confirm: true,
        user_metadata: { full_name: s.name, account_type: "professional" },
      });
      if (staffAuthErr) { console.error(`  Staff auth error (${s.name}):`, staffAuthErr.message); continue; }
      profileId = staffAuth.user.id;
    }

    await supabase.from("staff").insert({
      id: s.id,
      business_id: businessId,
      user_id: profileId,
      display_name: s.name,
      title: s.title,
      bio: s.bio,
      status: "active",
    });
  }
  console.log(`  ${staffData.length} staff members created.`);

  // 7. Services
  const services = [
    {
      id: uuid(),
      name: "Knotless Braids (Small)",
      category: "braids-protective",
      duration: 480,
      price: 35000,
      desc: "Feed-in braids with no knot at the root. Small-size partings for a fuller, longer-lasting look. Includes wash & deep condition.",
    },
    {
      id: uuid(),
      name: "Knotless Braids (Medium)",
      category: "braids-protective",
      duration: 360,
      price: 25000,
      desc: "Medium knotless braids. Lightweight, natural-looking, and low-tension. Lasts 6–8 weeks with proper care.",
    },
    {
      id: uuid(),
      name: "Knotless Braids (Large / Jumbo)",
      category: "braids-protective",
      duration: 240,
      price: 18000,
      desc: "Jumbo knotless braids — quick install, bold look. Great for vacations or protective styling on a schedule.",
    },
    {
      id: uuid(),
      name: "Bohemian Knotless Braids",
      category: "braids-protective",
      duration: 420,
      price: 30000,
      desc: "Knotless braids with loose curly ends for a bohemian finish. Includes styling.",
    },
    {
      id: uuid(),
      name: "Loc Retwist",
      category: "locs",
      duration: 90,
      price: 8500,
      desc: "Traditional palm-roll or interlock retwist. Includes wash and style.",
    },
    {
      id: uuid(),
      name: "Starter Locs",
      category: "locs",
      duration: 180,
      price: 15000,
      desc: "Begin your loc journey. Consultation + installation with two-strand twist, comb coils, or interlocking method.",
    },
    {
      id: uuid(),
      name: "Silk Press",
      category: "natural-silk-press",
      duration: 120,
      price: 12000,
      desc: "Straighten natural hair with zero damage. Includes wash, deep condition, blow-dry, and flat-iron finish. Lasts 1–2 weeks.",
    },
    {
      id: uuid(),
      name: "Twist-Out / Wash & Style",
      category: "natural-silk-press",
      duration: 90,
      price: 7500,
      desc: "Wash, condition, and styled twist-out or braid-out on natural hair.",
    },
  ];

  const { error: svcErr } = await supabase.from("services").insert(
    services.map((s) => ({
      id: s.id,
      business_id: businessId,
      category_id: catMap[s.category],
      name: s.name,
      description: s.desc,
      duration_minutes: s.duration,
      price_amount: s.price,
      currency: "usd",
      is_active: true,
      payment_option: "both" as const,
    })),
  );
  if (svcErr) console.error("  Service insert error:", svcErr.message);
  else console.log(`  ${services.length} services created.`);

  // 8. Staff schedules (same as business hours for simplicity)
  const workDays = DAYS.filter((d) => d.open);
  for (const s of staffData) {
    await supabase.from("staff_schedules").insert(
      workDays.map((d) => ({
        staff_id: s.id,
        day_of_week: d.day,
        start_time: d.start!,
        end_time: d.end!,
      })),
    );
  }
  console.log("  Staff schedules created.");

  // 9. Staff-services links
  // Keisha: all braid services
  // Aisha: loc services + large braids
  // Maya: silk press, twist-out + medium braids
  const keishaServices = services.filter((s) => s.category === "braids-protective");
  const aishaServices = [
    ...services.filter((s) => s.category === "locs"),
    services.find((s) => s.name.includes("Large"))!,
  ];
  const mayaServices = [
    ...services.filter((s) => s.category === "natural-silk-press"),
    services.find((s) => s.name.includes("Medium"))!,
  ];

  const staffServiceLinks = [
    ...keishaServices.map((svc) => ({ staff_id: staffData[0].id, service_id: svc.id })),
    ...aishaServices.map((svc) => ({ staff_id: staffData[1].id, service_id: svc.id })),
    ...mayaServices.map((svc) => ({ staff_id: staffData[2].id, service_id: svc.id })),
  ];
  await supabase.from("staff_services").insert(staffServiceLinks);
  console.log("  Staff-service links created.");

  // 10. Generate fake client profiles for bookings
  const CLIENT_NAMES = [
    "Jasmine Carter", "Tiana Williams", "Nia Thompson", "Aaliyah Brown",
    "Destiny Jackson", "Imani Davis", "Zuri Harris", "Amara Wilson",
    "Kyla Moore", "Sierra Taylor", "Layla Anderson", "Nyla Thomas",
    "Asha Martinez", "Brielle Johnson", "Ciara Robinson", "Deja Clark",
    "Eden Lewis", "Fatima Walker", "Grace Hall", "Harmony Allen",
    "Ivy Young", "Jordan King", "Kayla Wright", "Luna Scott",
    "Myla Green", "Naomi Adams", "Olivia Baker", "Piper Nelson",
    "Quinn Hill", "Riley Campbell",
  ];

  const clientIds: string[] = [];
  for (const name of CLIENT_NAMES) {
    const email = `${name.toLowerCase().replace(/\s/g, ".")}@demo.krowned.app`;
    const { data: clientAuth, error: clientAuthErr } = await supabase.auth.admin.createUser({
      email,
      password: "DemoClient2026!",
      email_confirm: true,
      user_metadata: { full_name: name, account_type: "client" },
    });
    if (clientAuthErr) {
      console.error(`  Failed to create client ${name}:`, clientAuthErr.message);
      continue;
    }
    clientIds.push(clientAuth.user.id);
  }
  console.log(`  ${CLIENT_NAMES.length} client profiles created.`);

  // 11. Generate bookings (~300 over 11 months: Aug 2025 – Jul 2026)
  const START_DATE = new Date("2025-08-01");
  const TODAY = new Date("2026-07-15");
  const FUTURE_END = addDays(TODAY, 30);

  // Eligible staff per service for realistic assignment
  const serviceStaffMap: Record<string, typeof staffData> = {};
  for (const svc of keishaServices) serviceStaffMap[svc.id] = [staffData[0]];
  for (const svc of aishaServices) serviceStaffMap[svc.id] = [staffData[1]];
  for (const svc of mayaServices) serviceStaffMap[svc.id] = [staffData[2]];
  // Medium braids: both Keisha and Maya
  const mediumBraids = services.find((s) => s.name.includes("Medium"))!;
  serviceStaffMap[mediumBraids.id] = [staffData[0], staffData[2]];
  // Large braids: both Keisha and Aisha
  const largeBraids = services.find((s) => s.name.includes("Large"))!;
  serviceStaffMap[largeBraids.id] = [staffData[0], staffData[1]];

  interface BookingRow {
    id: string;
    business_id: string;
    client_id: string;
    service_id: string;
    staff_id: string;
    staff_chosen_by_client: boolean;
    source: string;
    starts_at: string;
    ends_at: string;
    status: string;
    payment_method: string;
    service_amount: number;
    tip_amount: number;
    platform_fee_amount: number;
    currency: string;
    client_note: string | null;
    created_at: string;
  }

  const bookings: BookingRow[] = [];
  const bookingHours = [9, 10, 11, 12, 13, 14, 15, 16]; // valid start hours

  // Track used slots to avoid overlaps per staff
  const usedSlots = new Map<string, Set<string>>(); // staffId -> Set<"YYYY-MM-DD HH">

  let currentDate = new Date(START_DATE);

  while (currentDate < FUTURE_END) {
    const dow = currentDate.getDay();
    // Skip Sun (0) and Mon (1)
    if (dow === 0 || dow === 1) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // 1–4 bookings per work day
    const numBookings = randomInt(1, 4);
    for (let i = 0; i < numBookings; i++) {
      const service = pick(services);
      const eligible = serviceStaffMap[service.id] ?? [pick(staffData)];
      const staff = pick(eligible);
      const hour = pick(bookingHours);

      // Check slot availability
      const slotKey = `${currentDate.toISOString().slice(0, 10)} ${hour}`;
      if (!usedSlots.has(staff.id)) usedSlots.set(staff.id, new Set());
      if (usedSlots.get(staff.id)!.has(slotKey)) continue;

      // Mark hours used based on service duration
      const hoursNeeded = Math.ceil(service.duration / 60);
      let conflict = false;
      for (let h = 0; h < hoursNeeded; h++) {
        const sk = `${currentDate.toISOString().slice(0, 10)} ${hour + h}`;
        if (usedSlots.get(staff.id)!.has(sk)) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;

      // On Sat, close at 17:00
      const closeHour = dow === 6 ? 17 : 19;
      if (hour + hoursNeeded > closeHour) continue;

      for (let h = 0; h < hoursNeeded; h++) {
        usedSlots.get(staff.id)!.add(`${currentDate.toISOString().slice(0, 10)} ${hour + h}`);
      }

      const startsAt = setTime(new Date(currentDate), hour, 0);
      const endsAt = new Date(startsAt.getTime() + service.duration * 60_000);

      const isPast = startsAt < TODAY;
      let status: string;
      if (isPast) {
        // 85% completed, 10% cancelled, 5% no-show
        const roll = Math.random();
        status = roll < 0.85 ? "completed" : roll < 0.95 ? "cancelled" : "no_show";
      } else {
        status = "confirmed";
      }

      const tipAmount = status === "completed" ? (Math.random() < 0.4 ? randomInt(500, 3000) : 0) : 0;
      const payMethod = Math.random() < 0.6 ? "pay_at_store" : "prepay";
      const source = Math.random() < 0.5 ? "marketplace" : Math.random() < 0.7 ? "direct_link" : "manual";

      const clientNotes = [
        null, null, null, null, // mostly no notes
        "Running a few minutes late, sorry!",
        "First time getting braids, a little nervous!",
        "Please use xpression hair",
        "I have a tender scalp, please be gentle",
        "Will bring my own hair",
        "Can I get beads on the ends?",
      ];

      const bookingId = uuid();
      const createdAt = new Date(startsAt.getTime() - randomInt(1, 14) * 24 * 60 * 60_000);

      bookings.push({
        id: bookingId,
        business_id: businessId,
        client_id: pick(clientIds),
        service_id: service.id,
        staff_id: staff.id,
        staff_chosen_by_client: Math.random() < 0.6,
        source,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status,
        payment_method: payMethod,
        service_amount: service.price,
        tip_amount: tipAmount,
        platform_fee_amount: Math.round(service.price * 0.1),
        currency: "usd",
        client_note: pick(clientNotes),
        created_at: createdAt.toISOString(),
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  // Insert bookings in batches
  const BATCH = 50;
  for (let i = 0; i < bookings.length; i += BATCH) {
    const batch = bookings.slice(i, i + BATCH);
    const { error } = await supabase.from("bookings").insert(batch);
    if (error) {
      console.error(`  Booking batch ${i} error:`, error.message);
    }
  }
  console.log(`  ${bookings.length} bookings created.`);

  // 12. Generate reviews on completed bookings (~60-70% of completed have reviews)
  const completed = bookings.filter((b) => b.status === "completed");
  const reviewable = completed.filter(() => Math.random() < 0.35);

  const REVIEW_COMMENTS_5 = [
    "Knotless came out perfect. Clean parts, lightweight, no tension at all. Will be back!",
    "Keisha is so talented. My braids lasted 8 weeks and still looked fresh.",
    "Best braiding experience I've had in the DMV. On time, professional, beautiful results.",
    "My silk press was FLAWLESS. My curls bounced right back after one wash.",
    "Aisha's retwist game is unmatched. My locs look so neat and healthy.",
    "Love this studio! The vibe is so relaxing and my braids always come out fire.",
    "10/10 recommend. Quick, clean, and exactly what I asked for.",
    "Finally found a braider who doesn't pull too tight. Thank you Keisha!",
    "My twist-out was gorgeous. Maya really knows natural hair.",
    "Drove an hour for this appointment and it was worth every mile.",
    "The bohemian knotless braids are everything! Got so many compliments.",
    "Starter locs came out perfect. Aisha explained the whole journey and I feel confident.",
  ];

  const REVIEW_COMMENTS_4 = [
    "Great braids, just took a little longer than expected. Still love the result!",
    "Really good work. Wish they had later evening hours though.",
    "Silk press was beautiful. Only took off a star because parking is tough.",
    "Locs look great! Appointment ran about 30 min over but quality was on point.",
    "Very skilled stylists. The wait area could use more seating.",
  ];

  const REVIEW_COMMENTS_3 = [
    "Decent work but the style didn't last as long as I hoped.",
    "Good braids, but I waited 20 min past my appointment time.",
    "Average experience. The braids were nice but nothing exceptional.",
  ];

  interface ReviewRow {
    id: string;
    booking_id: string;
    client_id: string;
    business_id: string;
    staff_id: string;
    rating: number;
    comment: string;
    status: string;
    created_at: string;
  }

  const reviews: ReviewRow[] = [];
  for (const booking of reviewable) {
    // Weighted rating distribution: 60% 5-star, 25% 4-star, 10% 3-star, 5% 2-star
    const roll = Math.random();
    let rating: number;
    let comment: string;
    if (roll < 0.60) {
      rating = 5;
      comment = pick(REVIEW_COMMENTS_5);
    } else if (roll < 0.85) {
      rating = 4;
      comment = pick(REVIEW_COMMENTS_4);
    } else if (roll < 0.95) {
      rating = 3;
      comment = pick(REVIEW_COMMENTS_3);
    } else {
      rating = 2;
      comment = "Not my best experience. The style was okay but I expected more for the price.";
    }

    reviews.push({
      id: uuid(),
      booking_id: booking.id,
      client_id: booking.client_id,
      business_id: businessId,
      staff_id: booking.staff_id,
      rating,
      comment,
      status: "published",
      created_at: new Date(
        new Date(booking.ends_at).getTime() + randomInt(1, 72) * 60 * 60_000,
      ).toISOString(),
    });
  }

  // Insert reviews in batches
  for (let i = 0; i < reviews.length; i += BATCH) {
    const batch = reviews.slice(i, i + BATCH);
    const { error } = await supabase.from("reviews").insert(batch);
    if (error) {
      console.error(`  Review batch ${i} error:`, error.message);
    }
  }
  console.log(`  ${reviews.length} reviews created.`);

  // 13. Add a few owner responses to reviews
  const topReviews = reviews.filter((r) => r.rating >= 4).slice(0, 15);
  const RESPONSES = [
    "Thank you so much! We love having you in the chair. See you next time! 💛",
    "Appreciate the love! Your braids looked amazing. 🙌",
    "Thank you! Keisha always puts her heart into every set. ✨",
    "So glad you loved it! Can't wait to see you again.",
    "Thank you for trusting us with your hair! 🥰",
    "You were such a great client! Hope to see you soon.",
    "We appreciate you! Your locs are coming along beautifully.",
  ];

  for (const review of topReviews) {
    await supabase.from("review_responses").insert({
      review_id: review.id,
      responder_id: ownerId,
      body: pick(RESPONSES),
    });
  }
  console.log(`  ${topReviews.length} review responses added.`);

  // Done — summary
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  console.log("\n========================================");
  console.log("  DEMO ACCOUNT READY");
  console.log("========================================");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Business: ${BUSINESS_NAME}`);
  console.log(`  Slug:     /b/${BUSINESS_SLUG}`);
  console.log("----------------------------------------");
  console.log(`  Bookings: ${bookings.length} total`);
  console.log(`    Completed:  ${completedCount}`);
  console.log(`    Upcoming:   ${confirmedCount}`);
  console.log(`    Cancelled:  ${cancelledCount}`);
  console.log(`    No-show:    ${bookings.filter((b) => b.status === "no_show").length}`);
  console.log(`  Reviews:  ${reviews.length} (avg ${avgRating}★)`);
  console.log(`  Staff:    ${staffData.length}`);
  console.log(`  Services: ${services.length}`);
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
