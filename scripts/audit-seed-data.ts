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
  console.log("=== ZAWADI SEED DATA AUDIT ===\n");

  // 1. Plans
  const { data: plans } = await sb.from("plans").select("*").order("per_seat_price");
  console.log("PLANS:");
  for (const p of plans ?? []) {
    console.log(`  ${p.tier} (${p.name}) - $${(p.per_seat_price / 100).toFixed(2)}/seat | active=${p.is_active}`);
  }

  // 2. Categories
  const { data: cats } = await sb.from("service_categories").select("*").order("sort_order");
  console.log("\nCATEGORIES:");
  for (const c of cats ?? []) {
    console.log(`  ${c.sort_order}. ${c.name} (${c.slug}) icon=${c.icon}`);
  }

  // 3. Businesses
  const { data: businesses } = await sb.from("businesses").select("id, name, slug, city, country, verification_status, is_published, plan_id, subscription_status, cover_url, logo_url, gallery, description, phone, email, address, latitude, longitude, primary_category_id, commission_rate, booking_link_token, is_featured, onboarding_completed_at");
  console.log(`\nBUSINESSES: ${businesses?.length ?? 0}`);

  const issues: string[] = [];
  let bookableCount = 0;
  let withCover = 0;
  let withLogo = 0;
  let withGallery = 0;
  let withDesc = 0;
  let verified = 0;
  let published = 0;

  const catMap = new Map((cats ?? []).map(c => [c.id, c.name]));
  const planMap = new Map((plans ?? []).map(p => [p.id, p]));

  for (const b of businesses ?? []) {
    const plan = planMap.get(b.plan_id);
    const isBookable = plan && ["starter", "pro", "enterprise"].includes(plan.tier) && ["active", "trialing"].includes(b.subscription_status ?? "");

    if (isBookable) bookableCount++;
    if (b.cover_url) withCover++;
    if (b.logo_url) withLogo++;
    if (b.description && b.description.length > 10) withDesc++;
    if (b.verification_status === "verified") verified++;
    if (b.is_published) published++;

    let gallery: string[] = [];
    try { gallery = typeof b.gallery === "string" ? JSON.parse(b.gallery) : b.gallery ?? []; } catch {}
    if (gallery.length > 0) withGallery++;

    // Check issues
    if (!b.cover_url) issues.push(`${b.name}: missing cover image`);
    if (!b.logo_url) issues.push(`${b.name}: missing logo`);
    if (!b.description || b.description.length < 20) issues.push(`${b.name}: missing/short description`);
    if (!b.phone) issues.push(`${b.name}: missing phone`);
    if (!b.email) issues.push(`${b.name}: missing email`);
    if (!b.address) issues.push(`${b.name}: missing address`);
    if (!b.city) issues.push(`${b.name}: missing city`);
    if (!b.latitude || !b.longitude) issues.push(`${b.name}: missing lat/lng`);
    if (!b.booking_link_token) issues.push(`${b.name}: missing booking_link_token`);
    if (!b.onboarding_completed_at) issues.push(`${b.name}: onboarding not complete`);
    if (gallery.length === 0) issues.push(`${b.name}: empty gallery`);
    if (b.verification_status !== "verified") issues.push(`${b.name}: not verified (${b.verification_status})`);
    if (!b.is_published) issues.push(`${b.name}: not published`);
  }

  console.log(`  Verified: ${verified} | Published: ${published} | Bookable: ${bookableCount}`);
  console.log(`  With cover: ${withCover} | With logo: ${withLogo} | With gallery: ${withGallery} | With desc: ${withDesc}`);

  // Tier breakdown
  const tierCount: Record<string, number> = {};
  for (const b of businesses ?? []) {
    const plan = planMap.get(b.plan_id);
    const key = `${plan?.tier ?? "unknown"} (${b.subscription_status ?? "none"})`;
    tierCount[key] = (tierCount[key] ?? 0) + 1;
  }
  console.log("  Tier breakdown:", JSON.stringify(tierCount));

  // Category breakdown
  const catCount: Record<string, number> = {};
  for (const b of businesses ?? []) {
    const catName = catMap.get(b.primary_category_id) ?? "unknown";
    catCount[catName] = (catCount[catName] ?? 0) + 1;
  }
  console.log("  Category breakdown:", JSON.stringify(catCount));

  // 4. Services
  const { data: services, count: svcCount } = await sb.from("services").select("id, business_id, name, price_amount, is_active", { count: "exact" });
  console.log(`\nSERVICES: ${svcCount}`);
  const activeServices = (services ?? []).filter(s => s.is_active);
  console.log(`  Active: ${activeServices.length}`);

  // Services per business
  const svcPerBiz: Record<string, number> = {};
  for (const s of activeServices) { svcPerBiz[s.business_id] = (svcPerBiz[s.business_id] ?? 0) + 1; }
  const noServices = (businesses ?? []).filter(b => !svcPerBiz[b.id]);
  if (noServices.length > 0) {
    for (const b of noServices) issues.push(`${b.name}: NO active services`);
  }

  // 5. Staff
  const { data: staff, count: staffCount } = await sb.from("staff").select("id, business_id, display_name, status, user_id", { count: "exact" });
  console.log(`\nSTAFF: ${staffCount}`);
  const activeStaff = (staff ?? []).filter(s => s.status === "active");
  console.log(`  Active: ${activeStaff.length}`);

  // Staff per business
  const staffPerBiz: Record<string, number> = {};
  for (const s of activeStaff) { staffPerBiz[s.business_id] = (staffPerBiz[s.business_id] ?? 0) + 1; }
  const noStaff = (businesses ?? []).filter(b => {
    const plan = planMap.get(b.plan_id);
    const bookable = plan && ["starter", "pro", "enterprise"].includes(plan.tier) && ["active", "trialing"].includes(b.subscription_status ?? "");
    return bookable && !staffPerBiz[b.id];
  });
  if (noStaff.length > 0) {
    for (const b of noStaff) issues.push(`${b.name}: bookable but NO active staff`);
  }

  // 6. Staff services mapping
  const { data: staffServices, count: ssCount } = await sb.from("staff_services").select("staff_id, service_id", { count: "exact" });
  console.log(`\nSTAFF_SERVICES mappings: ${ssCount}`);
  const staffWithServices = new Set((staffServices ?? []).map(ss => ss.staff_id));
  const staffNoServices = activeStaff.filter(s => !staffWithServices.has(s.id));
  if (staffNoServices.length > 0) {
    for (const s of staffNoServices) {
      const biz = (businesses ?? []).find(b => b.id === s.business_id);
      issues.push(`Staff ${s.display_name} (${biz?.name}): no service capabilities mapped`);
    }
  }

  // 7. Staff schedules
  const { data: schedules, count: schedCount } = await sb.from("staff_schedules").select("staff_id", { count: "exact" });
  console.log(`STAFF_SCHEDULES: ${schedCount}`);
  const staffWithSchedules = new Set((schedules ?? []).map(s => s.staff_id));
  const staffNoSchedules = activeStaff.filter(s => !staffWithSchedules.has(s.id));
  if (staffNoSchedules.length > 0) {
    for (const s of staffNoSchedules) {
      const biz = (businesses ?? []).find(b => b.id === s.business_id);
      issues.push(`Staff ${s.display_name} (${biz?.name}): no schedule set`);
    }
  }

  // 8. Business hours
  const { data: hours, count: hoursCount } = await sb.from("business_hours").select("business_id", { count: "exact" });
  console.log(`BUSINESS_HOURS: ${hoursCount}`);
  const bizWithHours = new Set((hours ?? []).map(h => h.business_id));
  const noHours = (businesses ?? []).filter(b => !bizWithHours.has(b.id));
  if (noHours.length > 0) {
    for (const b of noHours) issues.push(`${b.name}: NO business hours set`);
  }

  // 9. Bookings
  const { data: bookings, count: bookingCount } = await sb.from("bookings").select("id, status, source, starts_at, business_id", { count: "exact" });
  console.log(`\nBOOKINGS: ${bookingCount}`);
  const statusBreakdown: Record<string, number> = {};
  const sourceBreakdown: Record<string, number> = {};
  let futureBookings = 0;
  let pastBookings = 0;
  const now = new Date();
  for (const b of bookings ?? []) {
    statusBreakdown[b.status] = (statusBreakdown[b.status] ?? 0) + 1;
    sourceBreakdown[b.source] = (sourceBreakdown[b.source] ?? 0) + 1;
    if (new Date(b.starts_at) > now) futureBookings++;
    else pastBookings++;
  }
  console.log(`  Status: ${JSON.stringify(statusBreakdown)}`);
  console.log(`  Source: ${JSON.stringify(sourceBreakdown)}`);
  console.log(`  Future: ${futureBookings} | Past: ${pastBookings}`);

  // Bookings per business
  const bookingsPerBiz: Record<string, number> = {};
  for (const b of bookings ?? []) { bookingsPerBiz[b.business_id] = (bookingsPerBiz[b.business_id] ?? 0) + 1; }
  const noBookings = (businesses ?? []).filter(b => {
    const plan = planMap.get(b.plan_id);
    const bookable = plan && ["starter", "pro", "enterprise"].includes(plan.tier) && ["active", "trialing"].includes(b.subscription_status ?? "");
    return bookable && !bookingsPerBiz[b.id];
  });
  if (noBookings.length > 0) {
    for (const b of noBookings) issues.push(`${b.name}: bookable but has ZERO bookings`);
  }

  // 10. Reviews
  const { count: reviewCount } = await sb.from("reviews").select("id", { count: "exact", head: true });
  console.log(`\nREVIEWS: ${reviewCount}`);

  // 11. Review responses
  const { count: responseCount } = await sb.from("review_responses").select("id", { count: "exact", head: true });
  console.log(`REVIEW_RESPONSES: ${responseCount}`);

  // 12. Payments
  const { count: paymentCount } = await sb.from("payments").select("id", { count: "exact", head: true });
  console.log(`PAYMENTS: ${paymentCount}`);

  // 13. Favorites
  const { count: favCount } = await sb.from("favorites").select("client_id", { count: "exact", head: true });
  console.log(`FAVORITES: ${favCount}`);

  // 14. Subscriptions
  const { data: subs, count: subCount } = await sb.from("subscriptions").select("id, status, business_id", { count: "exact" });
  console.log(`SUBSCRIPTIONS: ${subCount}`);
  const subStatusBreakdown: Record<string, number> = {};
  for (const s of subs ?? []) { subStatusBreakdown[s.status] = (subStatusBreakdown[s.status] ?? 0) + 1; }
  console.log(`  Status: ${JSON.stringify(subStatusBreakdown)}`);

  // 15. Business contacts
  const { count: contactCount } = await sb.from("business_contacts").select("id", { count: "exact", head: true });
  console.log(`BUSINESS_CONTACTS: ${contactCount}`);

  // 16. Users
  let totalUsers = 0;
  for (let page = 1; page <= 10; page++) {
    const { data: { users } } = await sb.auth.admin.listUsers({ page, perPage: 100 });
    totalUsers += users.length;
    if (users.length < 100) break;
  }
  console.log(`\nTOTAL USERS: ${totalUsers}`);

  // 17. Profiles
  const { count: profileCount } = await sb.from("profiles").select("id", { count: "exact", head: true });
  console.log(`PROFILES: ${profileCount}`);

  // 18. Image validation (sample)
  console.log("\nIMAGE CHECK (sample of 10)...");
  const sampleBiz = (businesses ?? []).slice(0, 10);
  let brokenImages = 0;
  for (const b of sampleBiz) {
    if (b.cover_url) {
      try {
        const res = await fetch(b.cover_url, { method: "HEAD", redirect: "follow" });
        if (res.status >= 400) { issues.push(`${b.name}: broken cover image (${res.status})`); brokenImages++; }
      } catch { brokenImages++; }
    }
  }
  console.log(`  Broken images in sample: ${brokenImages}`);

  // ISSUES SUMMARY
  console.log(`\n${"=".repeat(50)}`);
  console.log(`ISSUES FOUND: ${issues.length}`);
  console.log(`${"=".repeat(50)}`);
  for (const issue of issues) {
    console.log(`  ! ${issue}`);
  }

  // Print each business name, tier, status for overview
  console.log(`\n${"=".repeat(50)}`);
  console.log("BUSINESS OVERVIEW:");
  console.log(`${"=".repeat(50)}`);
  for (const b of (businesses ?? []).sort((a, b) => a.name.localeCompare(b.name))) {
    const plan = planMap.get(b.plan_id);
    const cat = catMap.get(b.primary_category_id);
    const svcN = svcPerBiz[b.id] ?? 0;
    const staffN = staffPerBiz[b.id] ?? 0;
    const bookN = bookingsPerBiz[b.id] ?? 0;
    const hasHours = bizWithHours.has(b.id);
    console.log(`  ${b.name} | ${cat} | ${plan?.tier}/${b.subscription_status ?? "-"} | ${b.verification_status} | svcs=${svcN} staff=${staffN} bookings=${bookN} hours=${hasHours} | ${b.city ?? "?"}`);
  }
}

main().catch(console.error);
