/**
 * Zawadi — Dev-only seed script for test accounts + data
 *
 * Creates 4 test users (one per role) with enough data to exercise
 * every dashboard. Idempotent: safe to re-run.
 *
 * Run:  npx tsx scripts/seed-test-data.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * in .env.local (or exported).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// ── Load env ────────────────────────────────────────────────────────
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

// ── Test accounts ───────────────────────────────────────────────────
const TEST_PASSWORD = "Test1234!";
const ACCOUNTS = {
  admin:  { email: "admin@zawaditest.com",  full_name: "Zawadi Admin" },
  owner:  { email: "owner@zawaditest.com",  full_name: "Sarah Kimani" },
  staff:  { email: "staff@zawaditest.com",  full_name: "David Oloo" },
  client: { email: "client@zawaditest.com", full_name: "Amina Njeri" },
} as const;

// ── Helpers ─────────────────────────────────────────────────────────
async function upsertUser(email: string, full_name: string) {
  // Try to find existing user by email (paginate to find all users)
  let found: { id: string; email?: string } | undefined;
  for (let page = 1; page <= 20; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    const match = data?.users?.find((u) => u.email === email);
    if (match) { found = match; break; }
    if (!data?.users || data.users.length < 100) break;
  }

  if (found) {
    console.log(`  ✓ User ${email} already exists (${found.id})`);
    // Ensure profile name is correct
    await supabase
      .from("profiles")
      .update({ full_name })
      .eq("id", found.id);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error) throw new Error(`Failed to create ${email}: ${error.message}`);
  console.log(`  + Created ${email} (${data.user.id})`);

  // The profile trigger may have created the row; ensure full_name is set
  await supabase
    .from("profiles")
    .upsert({ id: data.user.id, full_name }, { onConflict: "id" });

  return data.user.id;
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

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱 Seeding Zawadi test data...\n");

  // 1. Create users
  console.log("1. Creating test users...");
  const adminId  = await upsertUser(ACCOUNTS.admin.email, ACCOUNTS.admin.full_name);
  const ownerId  = await upsertUser(ACCOUNTS.owner.email, ACCOUNTS.owner.full_name);
  const staffId  = await upsertUser(ACCOUNTS.staff.email, ACCOUNTS.staff.full_name);
  const clientId = await upsertUser(ACCOUNTS.client.email, ACCOUNTS.client.full_name);

  // 2. Set super admin
  console.log("\n2. Setting super admin role...");
  await supabase
    .from("profiles")
    .update({ platform_role: "super_admin" })
    .eq("id", adminId);
  console.log("  ✓ admin@zawaditest.com → platform_role = super_admin");

  // 3. Get the Pro plan
  console.log("\n3. Fetching plans + categories...");
  const { data: proPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("tier", "pro")
    .single();
  if (!proPlan) throw new Error("Pro plan not found — run migrations first");

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, slug")
    .order("sort_order");
  if (!categories || categories.length === 0) throw new Error("No categories — run migrations first");

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  console.log(`  ✓ Pro plan: ${proPlan.id}`);
  console.log(`  ✓ ${categories.length} categories found`);

  // 4. Create or update business
  console.log("\n4. Creating business...");
  const businessSlug = "sarah-beauty-studio";
  const bookingToken = "test-booking-token-sarah";

  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .maybeSingle();

  let businessId: string;

  const businessData = {
    owner_id: ownerId,
    name: "Sarah's Beauty Studio",
    slug: businessSlug,
    description: "Full-service beauty studio specializing in hair, nails, and skincare. Book your transformation today!",
    primary_category_id: catMap["hair-barber"],
    phone: "+1 555-0100",
    email: "hello@sarahbeauty.test",
    address: "123 Glamour Avenue",
    city: "Nairobi",
    country: "KE",
    latitude: -1.2921,
    longitude: 36.8219,
    default_payment_option: "both" as const,
    commission_rate: 0.05,
    verification_status: "verified" as const,
    charges_enabled: true,
    payouts_enabled: true,
    plan_id: proPlan.id,
    subscription_status: "active" as const,
    trial_ends_at: null,
    booking_link_token: bookingToken,
    is_published: true,
    is_featured: true,
    featured_until: futureDate(90, 0),
    amenities: JSON.stringify(["WiFi", "Parking", "Refreshments", "Wheelchair Accessible"]),
  };

  if (existingBiz) {
    await supabase.from("businesses").update(businessData).eq("id", existingBiz.id);
    businessId = existingBiz.id;
    console.log(`  ✓ Updated existing business (${businessId})`);
  } else {
    const { data: newBiz, error } = await supabase
      .from("businesses")
      .insert(businessData)
      .select("id")
      .single();
    if (error) throw new Error(`Business insert failed: ${error.message}`);
    businessId = newBiz.id;
    console.log(`  + Created business (${businessId})`);
  }

  // 5. Business hours (Mon-Sat 9-18, Sun closed)
  console.log("\n5. Setting business hours...");
  await supabase.from("business_hours").delete().eq("business_id", businessId);
  const hours = [1, 2, 3, 4, 5, 6].map((day) => ({
    business_id: businessId,
    day_of_week: day,
    open_time: "09:00:00",
    close_time: "18:00:00",
  }));
  // Sunday closed = no row
  await supabase.from("business_hours").insert(hours);
  console.log("  ✓ Mon-Sat 09:00-18:00, Sun closed");

  // 6. Subscription
  console.log("\n6. Creating subscription...");
  await supabase.from("subscriptions").delete().eq("business_id", businessId);
  await supabase.from("subscriptions").insert({
    business_id: businessId,
    plan_id: proPlan.id,
    status: "active",
    seat_count: 1,
    current_period_end: futureDate(30, 0),
    cancel_at_period_end: false,
  });
  console.log("  ✓ Active Premium subscription");

  // 7. Clean slate for business-scoped data (correct FK order)
  console.log("\n7. Cleaning existing test data for business...");
  // Delete in reverse FK order to avoid constraint violations
  const { data: existingStaff } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId);
  const existingStaffIds = existingStaff?.map((s) => s.id) ?? [];

  if (existingStaffIds.length > 0) {
    // Clean staff-dependent data
    await supabase.from("schedule_exceptions").delete().in("staff_id", existingStaffIds);
    await supabase.from("staff_schedules").delete().in("staff_id", existingStaffIds);
    await supabase.from("staff_services").delete().in("staff_id", existingStaffIds);
  }

  // Clean booking-dependent data
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("business_id", businessId);
  const existingBookingIds = existingBookings?.map((b) => b.id) ?? [];

  if (existingBookingIds.length > 0) {
    await supabase.from("reviews").delete().in("booking_id", existingBookingIds);
    await supabase.from("payments").delete().in("booking_id", existingBookingIds);
    await supabase.from("bookings").delete().eq("business_id", businessId);
  }
  // Also clean client bookings that reference this business
  await supabase.from("bookings").delete().eq("client_id", clientId);

  if (existingStaffIds.length > 0) {
    await supabase.from("staff").delete().eq("business_id", businessId);
  }
  await supabase.from("services").delete().eq("business_id", businessId);
  await supabase.from("favorites").delete().eq("business_id", businessId);
  console.log("  ✓ Cleaned existing test data");

  // 8. Services (4 across different categories)
  console.log("\n8. Creating services...");

  const servicesData = [
    {
      business_id: businessId,
      category_id: catMap["hair-barber"],
      name: "Signature Blowout",
      description: "Wash, blow-dry, and style for any hair type. Includes scalp massage.",
      price_amount: 4500,
      currency: "USD",
      duration_minutes: 60,
      payment_option: "both" as const,
      is_active: true,
    },
    {
      business_id: businessId,
      category_id: catMap["hair-barber"],
      name: "Braids & Cornrows",
      description: "Custom braided styles — cornrows, box braids, twists. Consult on arrival.",
      price_amount: 8000,
      currency: "USD",
      duration_minutes: 120,
      payment_option: "prepay" as const,
      is_active: true,
    },
    {
      business_id: businessId,
      category_id: catMap["nails-beauty"],
      name: "Gel Manicure",
      description: "Long-lasting gel polish with cuticle care and hand massage.",
      price_amount: 3500,
      currency: "USD",
      duration_minutes: 45,
      payment_option: "both" as const,
      is_active: true,
    },
    {
      business_id: businessId,
      category_id: catMap["skincare-aesthetics"],
      name: "Hydra Facial",
      description: "Deep-cleansing facial with hydration infusion. Great for all skin types.",
      price_amount: 12000,
      currency: "USD",
      duration_minutes: 75,
      payment_option: "prepay" as const,
      is_active: true,
    },
  ];

  const { data: services, error: svcErr } = await supabase
    .from("services")
    .insert(servicesData)
    .select("id, name");
  if (svcErr) throw new Error(`Services insert failed: ${svcErr.message}`);
  console.log(`  ✓ ${services.length} services created`);

  // 9. Staff member
  console.log("\n9. Creating staff member...");

  const { data: staffRow, error: staffErr } = await supabase
    .from("staff")
    .insert({
      business_id: businessId,
      user_id: staffId,
      invited_email: ACCOUNTS.staff.email,
      display_name: ACCOUNTS.staff.full_name,
      title: "Senior Hair Stylist",
      bio: "10+ years of experience in all hair types. Specializing in braids and blowouts.",
      status: "active",
    })
    .select("id")
    .single();
  if (staffErr) throw new Error(`Staff insert failed: ${staffErr.message}`);
  console.log(`  ✓ Staff: ${ACCOUNTS.staff.full_name} (${staffRow.id})`);

  // 10. Staff-service capability mapping (2 services)
  console.log("\n10. Mapping staff to services...");
  const blowout = services.find((s) => s.name === "Signature Blowout")!;
  const braids = services.find((s) => s.name === "Braids & Cornrows")!;
  await supabase.from("staff_services").insert([
    { staff_id: staffRow.id, service_id: blowout.id },
    { staff_id: staffRow.id, service_id: braids.id },
  ]);
  console.log(`  ✓ Mapped to: Signature Blowout, Braids & Cornrows`);

  // 11. Staff weekly schedule (Mon-Fri 9-17)
  console.log("\n11. Setting staff schedule...");
  const staffSchedule = [1, 2, 3, 4, 5].map((day) => ({
    staff_id: staffRow.id,
    day_of_week: day,
    start_time: "09:00:00",
    end_time: "17:00:00",
  }));
  await supabase.from("staff_schedules").insert(staffSchedule);
  console.log("  ✓ Mon-Fri 09:00-17:00");

  // 12. Schedule exception (vacation next week)
  console.log("\n12. Adding schedule exception...");
  await supabase.from("schedule_exceptions").insert({
    staff_id: staffRow.id,
    starts_at: futureDate(7, 0),
    ends_at: futureDate(9, 23),
    reason: "Personal vacation",
    is_available: false,
  });
  console.log("  ✓ Vacation block in 7-9 days");

  // 13. Client bookings (1 past completed, 1 upcoming confirmed)
  console.log("\n13. Creating bookings...");

  const pastBooking = {
    client_id: clientId,
    business_id: businessId,
    service_id: blowout.id,
    staff_id: staffRow.id,
    staff_chosen_by_client: true,
    source: "marketplace" as const,
    starts_at: pastDate(5, 10),
    ends_at: pastDate(5, 11),
    status: "completed" as const,
    payment_method: "prepay" as const,
    service_amount: 4500,
    tip_amount: 500,
    platform_fee_amount: 225, // 4500 * 0.05
    currency: "USD",
    client_note: "First visit — loved it!",
  };

  const upcomingBooking = {
    client_id: clientId,
    business_id: businessId,
    service_id: braids.id,
    staff_id: staffRow.id,
    staff_chosen_by_client: false,
    source: "direct_link" as const,
    starts_at: futureDate(3, 14),
    ends_at: futureDate(3, 16),
    status: "confirmed" as const,
    payment_method: "prepay" as const,
    service_amount: 8000,
    tip_amount: 0,
    platform_fee_amount: 400, // 8000 * 0.05
    currency: "USD",
  };

  const { data: bookings, error: bookErr } = await supabase
    .from("bookings")
    .insert([pastBooking, upcomingBooking])
    .select("id, status");
  if (bookErr) throw new Error(`Bookings insert failed: ${bookErr.message}`);
  console.log(`  ✓ ${bookings.length} bookings (1 completed, 1 upcoming)`);

  // 14. Payment for the past booking
  console.log("\n14. Creating payment record...");
  const completedBookingId = bookings.find((b) => b.status === "completed")!.id;
  await supabase.from("payments").insert({
    booking_id: completedBookingId,
    stripe_payment_intent_id: "pi_test_seed_blowout_001",
    amount: 5000, // service (4500) + tip (500)
    tip_amount: 500,
    application_fee_amount: 225,
    currency: "USD",
    status: "succeeded",
  });
  console.log("  ✓ Payment: $50.00 (incl. $5.00 tip)");

  // 15. Review on the completed booking
  console.log("\n15. Creating review...");
  await supabase.from("reviews").insert({
    booking_id: completedBookingId,
    client_id: clientId,
    business_id: businessId,
    staff_id: staffRow.id,
    rating: 5,
    comment: "Amazing blowout! David really knows his craft. The studio is beautiful and welcoming. Will definitely be back.",
    status: "published",
  });
  console.log("  ✓ 5-star review published");

  // 16. Favorite
  console.log("\n16. Adding favorite...");
  await supabase
    .from("favorites")
    .upsert(
      { client_id: clientId, business_id: businessId },
      { onConflict: "client_id,business_id" },
    );
  console.log("  ✓ Client favorited the business");

  // ── Summary ───────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(68));
  console.log("  ZAWADI TEST ACCOUNTS — ready for development");
  console.log("=".repeat(68));
  console.log("");
  console.log("  Role            Email                      Password");
  console.log("  ──────────────  ─────────────────────────  ──────────");
  console.log("  Super Admin     admin@zawaditest.com       Test1234!");
  console.log("  Business Owner  owner@zawaditest.com       Test1234!");
  console.log("  Staff           staff@zawaditest.com       Test1234!");
  console.log("  Client          client@zawaditest.com      Test1234!");
  console.log("");
  console.log("  Business: Sarah's Beauty Studio (/b/sarah-beauty-studio)");
  console.log("  Booking link:   /book/test-booking-token-sarah");
  console.log("");
  console.log("  Data seeded:");
  console.log("    - 4 services (Hair x2, Nails x1, Skincare x1)");
  console.log("    - 1 staff member mapped to 2 services, Mon-Fri schedule");
  console.log("    - 1 schedule exception (vacation)");
  console.log("    - 2 bookings (1 past + completed, 1 upcoming + confirmed)");
  console.log("    - 1 payment ($50 incl $5 tip), 1 review (5 stars)");
  console.log("    - 1 favorite");
  console.log("    - Business hours Mon-Sat 9-18, Pro plan, verified");
  console.log("");
  console.log("=".repeat(68));
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
