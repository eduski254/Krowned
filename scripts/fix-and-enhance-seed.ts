import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Seeded random for reproducibility
let seed = 99;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  console.log("=== FIX & ENHANCE SEED DATA ===\n");

  // Load reference data
  const { data: plans } = await sb.from("plans").select("id, tier");
  const planMap = Object.fromEntries((plans ?? []).map(p => [p.tier, p.id]));
  const { data: categories } = await sb.from("service_categories").select("id, slug, name");

  // ── STEP 1: Fix category names ──
  console.log("1. Fixing category names...");
  await sb.from("service_categories").update({ name: "Fitness & Wellness", slug: "fitness-wellness" }).eq("slug", "fitness-wellnesss");
  await sb.from("service_categories").update({ name: "Makeup & Glam" }).eq("slug", "makeup-glam");
  // Remove junk category
  const { data: newCat } = await sb.from("service_categories").select("id").eq("slug", "new-category").maybeSingle();
  if (newCat) {
    // Check if any services use it
    const { count } = await sb.from("services").select("id", { count: "exact", head: true }).eq("category_id", newCat.id);
    if (count === 0) {
      // Check businesses
      const { count: bizCount } = await sb.from("businesses").select("id", { count: "exact", head: true }).eq("primary_category_id", newCat.id);
      if (bizCount === 0) {
        await sb.from("service_categories").delete().eq("id", newCat.id);
        console.log("  Removed 'New Category'");
      } else {
        console.log("  'New Category' still in use by businesses, skipped");
      }
    }
  }
  console.log("  Fixed: Fitness & Wellness, Makeup & Glam");

  // Refresh categories
  const { data: cats } = await sb.from("service_categories").select("id, slug, name");
  const catBySlug = Object.fromEntries((cats ?? []).map(c => [c.slug, c]));

  // ── STEP 2: Clean up junk businesses ──
  console.log("\n2. Cleaning up junk/test businesses...");
  const junkSlugs = ["test-user-s-business"];
  for (const slug of junkSlugs) {
    const { data: junk } = await sb.from("businesses").select("id, name").eq("slug", slug).maybeSingle();
    if (junk) {
      // Delete dependent data first
      await sb.from("bookings").delete().eq("business_id", junk.id);
      await sb.from("staff_services").delete().in("staff_id",
        (await sb.from("staff").select("id").eq("business_id", junk.id)).data?.map(s => s.id) ?? []);
      await sb.from("staff_schedules").delete().in("staff_id",
        (await sb.from("staff").select("id").eq("business_id", junk.id)).data?.map(s => s.id) ?? []);
      await sb.from("staff").delete().eq("business_id", junk.id);
      await sb.from("services").delete().eq("business_id", junk.id);
      await sb.from("business_hours").delete().eq("business_id", junk.id);
      await sb.from("subscriptions").delete().eq("business_id", junk.id);
      await sb.from("favorites").delete().eq("business_id", junk.id);
      await sb.from("business_contacts").delete().eq("business_id", junk.id);
      await sb.from("businesses").delete().eq("id", junk.id);
      console.log(`  Removed: ${junk.name}`);
    }
  }

  // Fix Edwin Business — make it a real business
  const { data: edwinBiz } = await sb.from("businesses").select("id, owner_id").ilike("name", "%Edwin Business%").maybeSingle();
  if (edwinBiz) {
    const hairCat = catBySlug["hair-barber"];
    await sb.from("businesses").update({
      name: "Eddie's Cutz & Styles",
      slug: "eddies-cutz-styles",
      description: "Premium barbershop offering modern cuts, beard trims, and grooming in the heart of Nairobi. Walk-ins welcome.",
      phone: "+254 712 334 455",
      email: "hello@eddiescutz.test",
      address: "45 Moi Avenue",
      city: "Nairobi",
      country: "KE",
      latitude: -1.284,
      longitude: 36.823,
      primary_category_id: hairCat?.id,
      cover_url: "https://images.unsplash.com/photo-1503951914875-452d3838bb3b?w=1200&h=600&fit=crop",
      logo_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&h=200&fit=crop",
      gallery: JSON.stringify([
        "https://images.unsplash.com/photo-1585747860019-7228fcb0c124?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800&h=600&fit=crop",
      ]),
      verification_status: "verified",
      is_published: true,
      plan_id: planMap["starter"],
      subscription_status: "active",
      default_payment_option: "both",
      commission_rate: 0.05,
      booking_link_token: "blt-eddies-cutz",
      onboarding_completed_at: new Date().toISOString(),
    }).eq("id", edwinBiz.id);

    // Add business hours
    await sb.from("business_hours").delete().eq("business_id", edwinBiz.id);
    await sb.from("business_hours").insert([1, 2, 3, 4, 5, 6].map(d => ({
      business_id: edwinBiz.id, day_of_week: d, open_time: "08:00:00", close_time: "19:00:00",
    })));

    // Add services
    await sb.from("services").delete().eq("business_id", edwinBiz.id);
    const edwinServices = [
      { name: "Men's Haircut", price_amount: 1500, duration_minutes: 30 },
      { name: "Beard Trim & Shape", price_amount: 800, duration_minutes: 20 },
      { name: "Fade & Design", price_amount: 2500, duration_minutes: 45 },
      { name: "Hot Towel Shave", price_amount: 1200, duration_minutes: 30 },
    ];
    const { data: insertedSvcs } = await sb.from("services").insert(
      edwinServices.map(s => ({
        business_id: edwinBiz.id,
        category_id: hairCat!.id,
        name: s.name,
        price_amount: s.price_amount,
        currency: "USD",
        duration_minutes: s.duration_minutes,
        payment_option: "both" as const,
        is_active: true,
      }))
    ).select("id");

    // Add staff (owner as staff)
    await sb.from("staff_services").delete().in("staff_id",
      (await sb.from("staff").select("id").eq("business_id", edwinBiz.id)).data?.map(s => s.id) ?? []);
    await sb.from("staff_schedules").delete().in("staff_id",
      (await sb.from("staff").select("id").eq("business_id", edwinBiz.id)).data?.map(s => s.id) ?? []);
    await sb.from("staff").delete().eq("business_id", edwinBiz.id);
    const { data: edwinStaff } = await sb.from("staff").insert({
      business_id: edwinBiz.id, user_id: edwinBiz.owner_id,
      display_name: "Eddie", title: "Master Barber", status: "active",
    }).select("id").single();

    if (edwinStaff && insertedSvcs) {
      await sb.from("staff_services").insert(insertedSvcs.map(s => ({
        staff_id: edwinStaff.id, service_id: s.id,
      })));
      await sb.from("staff_schedules").insert([1, 2, 3, 4, 5, 6].map(d => ({
        staff_id: edwinStaff.id, day_of_week: d, start_time: "08:00:00", end_time: "19:00:00",
      })));
    }

    // Add subscription
    await sb.from("subscriptions").upsert({
      business_id: edwinBiz.id, plan_id: planMap["starter"],
      status: "active", seat_count: 1,
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: "business_id" });

    console.log("  Fixed: Edwin Business → Eddie's Cutz & Styles");
  }

  // ── STEP 3: Fix staff without service capabilities or schedules ──
  console.log("\n3. Fixing staff with no capabilities/schedules...");
  const { data: allStaff } = await sb.from("staff").select("id, business_id, display_name, status").eq("status", "active");
  const { data: allSS } = await sb.from("staff_services").select("staff_id");
  const { data: allSched } = await sb.from("staff_schedules").select("staff_id");
  const ssSet = new Set((allSS ?? []).map(s => s.staff_id));
  const schedSet = new Set((allSched ?? []).map(s => s.staff_id));

  for (const staff of allStaff ?? []) {
    const needsServices = !ssSet.has(staff.id);
    const needsSchedule = !schedSet.has(staff.id);

    if (needsServices || needsSchedule) {
      // Get this business's services
      const { data: bizServices } = await sb.from("services")
        .select("id").eq("business_id", staff.business_id).eq("is_active", true);

      if (needsServices && bizServices && bizServices.length > 0) {
        await sb.from("staff_services").insert(
          bizServices.map(s => ({ staff_id: staff.id, service_id: s.id }))
        );
      }

      if (needsSchedule) {
        await sb.from("staff_schedules").insert(
          [1, 2, 3, 4, 5, 6].map(d => ({
            staff_id: staff.id, day_of_week: d,
            start_time: "09:00:00", end_time: "18:00:00",
          }))
        );
      }

      if (needsServices || needsSchedule) {
        console.log(`  Fixed: ${staff.display_name} (services=${needsServices}, schedule=${needsSchedule})`);
      }
    }
  }

  // ── STEP 4: Fix verification + missing data ──
  console.log("\n4. Fixing verification and missing data...");

  // Verify pending businesses (for investor demo, all should look real)
  await sb.from("businesses").update({ verification_status: "verified", is_published: true })
    .in("verification_status", ["pending", "suspended"]);
  console.log("  All businesses now verified & published");

  // Fix missing lat/lng
  const geoFixes: Record<string, { lat: number; lng: number }> = {
    "GlamOnTheGo": { lat: 51.507, lng: -0.128 },
    "Pamper Me Mobile": { lat: -1.292, lng: 36.821 },
    "Mobile Beauty KE": { lat: 6.524, lng: 3.379 },
  };
  for (const [name, geo] of Object.entries(geoFixes)) {
    await sb.from("businesses").update({ latitude: geo.lat, longitude: geo.lng }).ilike("name", `%${name}%`);
  }
  console.log("  Fixed missing lat/lng");

  // ── STEP 5: Generate bookings for businesses with zero ──
  console.log("\n5. Generating bookings for empty businesses...");
  const { data: allBiz } = await sb.from("businesses").select("id, name, plan_id, subscription_status, commission_rate");
  const { data: allBookings } = await sb.from("bookings").select("business_id");
  const bookingsByBiz = new Set((allBookings ?? []).map(b => b.business_id));

  // Get all clients
  const { data: clientProfiles } = await sb.from("profiles").select("id").eq("platform_role", "user");
  const clientIds = (clientProfiles ?? []).map(p => p.id);

  // Filter to clients who are not business owners
  const { data: ownerIds } = await sb.from("businesses").select("owner_id");
  const ownerSet = new Set((ownerIds ?? []).map(o => o.owner_id));
  const pureClients = clientIds.filter(id => !ownerSet.has(id));

  let totalBookingsCreated = 0;
  let totalReviewsCreated = 0;

  for (const biz of allBiz ?? []) {
    const plan = (plans ?? []).find(p => p.id === biz.plan_id);
    const isBookable = plan && ["starter", "pro", "enterprise"].includes(plan.tier)
      && ["active", "trialing"].includes(biz.subscription_status ?? "");

    if (!isBookable) continue;
    if (bookingsByBiz.has(biz.id)) continue; // Already has bookings

    // Get staff & services for this business
    const { data: bizStaff } = await sb.from("staff").select("id").eq("business_id", biz.id).eq("status", "active");
    const { data: bizServices } = await sb.from("services").select("id, price_amount, currency, duration_minutes").eq("business_id", biz.id).eq("is_active", true);

    if (!bizStaff?.length || !bizServices?.length) continue;

    // Generate 8-15 bookings
    const numBookings = 8 + Math.floor(rand() * 8);
    const bookingsToInsert: any[] = [];
    const now = Date.now();

    for (let i = 0; i < numBookings; i++) {
      const service = pick(bizServices);
      const staffMember = pick(bizStaff);
      const client = pick(pureClients);

      // Mix of past and future
      const isPast = rand() < 0.6;
      const daysOffset = isPast
        ? -Math.floor(rand() * 60 + 1) // 1-60 days ago
        : Math.floor(rand() * 30 + 1); // 1-30 days ahead

      const hour = 9 + Math.floor(rand() * 8); // 9am-4pm
      const minute = rand() < 0.5 ? 0 : 30;
      const startDate = new Date(now + daysOffset * 86400000);
      startDate.setHours(hour, minute, 0, 0);
      const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

      // Status distribution
      let status: string;
      if (isPast) {
        const r = rand();
        if (r < 0.55) status = "completed";
        else if (r < 0.75) status = "confirmed";
        else if (r < 0.88) status = "cancelled";
        else status = "no_show";
      } else {
        status = rand() < 0.85 ? "confirmed" : "pending";
      }

      const paymentMethod = rand() < 0.4 ? "prepay" : "pay_at_store";
      const source = rand() < 0.5 ? "marketplace" : "direct_link";
      const platformFee = Math.round(service.price_amount * (biz.commission_rate as number));

      bookingsToInsert.push({
        client_id: client,
        business_id: biz.id,
        service_id: service.id,
        staff_id: staffMember.id,
        staff_chosen_by_client: rand() < 0.4,
        source,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status,
        payment_method: paymentMethod,
        service_amount: service.price_amount,
        tip_amount: rand() < 0.3 ? Math.floor(rand() * 500 + 100) : 0,
        platform_fee_amount: platformFee,
        currency: service.currency,
      });
    }

    const { data: createdBookings, error: bkErr } = await sb.from("bookings").insert(bookingsToInsert).select("id, status, client_id, business_id, service_id, staff_id, service_amount, currency");
    if (bkErr) {
      console.log(`  Error creating bookings for ${biz.name}: ${bkErr.message}`);
      continue;
    }

    totalBookingsCreated += createdBookings?.length ?? 0;

    // Create payments for prepay bookings
    const prepayBookings = (createdBookings ?? []).filter((_, i) => bookingsToInsert[i].payment_method === "prepay" && bookingsToInsert[i].status !== "cancelled");
    if (prepayBookings.length > 0) {
      await sb.from("payments").insert(prepayBookings.map((b, i) => ({
        booking_id: b.id,
        amount: b.service_amount + (bookingsToInsert[bookingsToInsert.findIndex(bi => bi.client_id === b.client_id && bi.service_id === b.service_id)]?.tip_amount ?? 0),
        tip_amount: 0,
        application_fee_amount: Math.round(b.service_amount * 0.05),
        currency: b.currency,
        status: "succeeded",
        stripe_payment_intent_id: `pi_demo_${b.id.slice(0, 8)}`,
      })));
    }

    // Create reviews for completed bookings
    const completedBookings = (createdBookings ?? []).filter((_, i) => bookingsToInsert[i].status === "completed");
    const reviewableBookings = completedBookings.filter(() => rand() < 0.75);
    const comments = [
      "Amazing experience! Will definitely come back.",
      "Great service, very professional team.",
      "Loved the attention to detail. Highly recommend!",
      "Good service but had to wait a bit.",
      "Absolutely fantastic! Best in Nairobi.",
      "Professional and friendly. The space is beautiful.",
      "Really happy with the results. Thank you!",
      "Decent service, nothing extraordinary.",
      "Outstanding work! Exceeded my expectations.",
      "Very skilled professionals. Clean and welcoming space.",
      "My go-to spot now. Consistent quality every time.",
      "Wonderful experience from start to finish.",
      "Friendly staff and great atmosphere.",
      "Top-notch service. Worth every shilling.",
      "Impressed by the quality and professionalism.",
    ];

    for (const b of reviewableBookings) {
      const r = rand();
      const rating = r < 0.35 ? 5 : r < 0.65 ? 4 : r < 0.82 ? 3 : r < 0.93 ? 2 : 1;
      const { error: revErr } = await sb.from("reviews").insert({
        booking_id: b.id,
        client_id: b.client_id,
        business_id: b.business_id,
        staff_id: b.staff_id,
        rating,
        comment: pick(comments),
        status: "published",
      });
      if (!revErr) totalReviewsCreated++;
    }

    console.log(`  ${biz.name}: ${createdBookings?.length} bookings, ${reviewableBookings.length} reviews`);
  }
  console.log(`  Total: ${totalBookingsCreated} bookings, ${totalReviewsCreated} reviews created`);

  // ── STEP 6: Add more future bookings for active businesses ──
  console.log("\n6. Adding more future bookings to active businesses...");
  const { data: activeBiz } = await sb.from("businesses").select("id, name, commission_rate, plan_id, subscription_status");
  let extraBookings = 0;

  for (const biz of activeBiz ?? []) {
    const plan = (plans ?? []).find(p => p.id === biz.plan_id);
    const isBookable = plan && ["starter", "pro", "enterprise"].includes(plan.tier)
      && ["active", "trialing"].includes(biz.subscription_status ?? "");
    if (!isBookable) continue;

    // Count existing future bookings
    const { count: futureCount } = await sb.from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", biz.id)
      .eq("status", "confirmed")
      .gt("starts_at", new Date().toISOString());

    if ((futureCount ?? 0) >= 4) continue; // Already has enough

    const { data: bizStaff } = await sb.from("staff").select("id").eq("business_id", biz.id).eq("status", "active");
    const { data: bizServices } = await sb.from("services").select("id, price_amount, currency, duration_minutes").eq("business_id", biz.id).eq("is_active", true);
    if (!bizStaff?.length || !bizServices?.length) continue;

    const needed = 4 - (futureCount ?? 0);
    const newBookings: any[] = [];

    for (let i = 0; i < needed; i++) {
      const service = pick(bizServices);
      const staffMember = pick(bizStaff);
      const client = pick(pureClients);
      const daysAhead = Math.floor(rand() * 14 + 1);
      const hour = 9 + Math.floor(rand() * 8);
      const minute = rand() < 0.5 ? 0 : 30;
      const startDate = new Date(Date.now() + daysAhead * 86400000);
      startDate.setHours(hour, minute, 0, 0);
      const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

      newBookings.push({
        client_id: client,
        business_id: biz.id,
        service_id: service.id,
        staff_id: staffMember.id,
        staff_chosen_by_client: rand() < 0.4,
        source: rand() < 0.5 ? "marketplace" : "direct_link",
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: "confirmed",
        payment_method: rand() < 0.3 ? "prepay" : "pay_at_store",
        service_amount: service.price_amount,
        tip_amount: 0,
        platform_fee_amount: Math.round(service.price_amount * (biz.commission_rate as number)),
        currency: service.currency,
      });
    }

    const { data: created } = await sb.from("bookings").insert(newBookings).select("id");
    extraBookings += created?.length ?? 0;
  }
  console.log(`  Added ${extraBookings} future bookings`);

  // ── STEP 7: Add review responses from owners ──
  console.log("\n7. Adding owner review responses...");
  const { data: unrepliedReviews } = await sb.from("reviews")
    .select("id, business_id, rating, comment")
    .eq("status", "published");

  const { data: existingResponses } = await sb.from("review_responses").select("review_id");
  const respondedSet = new Set((existingResponses ?? []).map(r => r.review_id));
  const unreplied = (unrepliedReviews ?? []).filter(r => !respondedSet.has(r.id));

  const responseTemplates = {
    positive: [
      "Thank you so much for your kind words! We're thrilled you had a great experience.",
      "We really appreciate your review! Looking forward to seeing you again soon.",
      "Thank you! Your satisfaction is our top priority. See you next time!",
      "What a wonderful review — thank you! Our team works hard to deliver the best.",
      "So glad you enjoyed it! We can't wait to welcome you back.",
    ],
    negative: [
      "We're sorry to hear about your experience. We'd love the chance to make it right — please reach out to us directly.",
      "Thank you for your honest feedback. We're working on improving and hope to serve you better next time.",
      "We appreciate you bringing this to our attention. We've addressed this with our team.",
    ],
  };

  let responsesAdded = 0;
  for (const review of unreplied) {
    if (rand() < 0.45) continue; // Only respond to ~55%

    const { data: biz } = await sb.from("businesses").select("owner_id").eq("id", review.business_id).single();
    if (!biz) continue;

    const isPositive = review.rating >= 4;
    const body = pick(isPositive ? responseTemplates.positive : responseTemplates.negative);

    const { error } = await sb.from("review_responses").insert({
      review_id: review.id,
      responder_id: biz.owner_id,
      body,
    });
    if (!error) responsesAdded++;
  }
  console.log(`  Added ${responsesAdded} review responses`);

  // ── STEP 8: Add more favorites ──
  console.log("\n8. Adding favorites...");
  const { data: verifiedBiz } = await sb.from("businesses").select("id")
    .eq("verification_status", "verified").eq("is_published", true);
  const bizIds = (verifiedBiz ?? []).map(b => b.id);

  let favsAdded = 0;
  for (const clientId of pickN(pureClients, 30)) {
    const { data: existing } = await sb.from("favorites").select("business_id").eq("client_id", clientId);
    const existingSet = new Set((existing ?? []).map(f => f.business_id));
    const toFav = pickN(bizIds.filter(id => !existingSet.has(id)), Math.floor(rand() * 4 + 1));
    if (toFav.length > 0) {
      const { error } = await sb.from("favorites").insert(toFav.map(bid => ({ client_id: clientId, business_id: bid })));
      if (!error) favsAdded += toFav.length;
    }
  }
  console.log(`  Added ${favsAdded} favorites`);

  // ── STEP 9: Improve business descriptions ──
  console.log("\n9. Improving business descriptions...");
  const descriptions: Record<string, string> = {
    "Body Sculpt Fitness": "Transform your body at Nairobi's premier boutique fitness studio. Personalized training programs, state-of-the-art equipment, and expert coaches dedicated to your wellness journey.",
    "Iron Temple Gym": "Serious training facility in Kisumu with championship-level equipment and experienced coaches. From strength training to HIIT, we help you push your limits.",
    "FitLife Studio": "Your neighbourhood fitness hub in Nakuru. Group classes, personal training, and a welcoming community that makes every workout count.",
    "Pulse Fitness": "High-energy fitness studio offering cutting-edge workouts, from boxing to spin. Our certified trainers bring out the best in every client.",
    "Vitality Hub": "A holistic wellness centre combining fitness, nutrition, and mindfulness. Discover your strongest, healthiest self with our expert guidance.",
    "Tranquil Touch": "Escape the city buzz at Kilimani's most serene spa. Signature massages, aromatherapy, and body treatments designed to restore your inner peace.",
    "Polished Nails": "Mombasa's nail art destination. From classic French tips to intricate designs, our nail technicians create wearable art with premium products.",
    "GlamOnTheGo": "Professional beauty services delivered to your doorstep in London. Bridal packages, event styling, and everyday glam — wherever you are.",
    "Mobile Beauty KE": "Lagos's first on-demand beauty service. Book a makeup artist, hairstylist, or nail tech to come to you. Perfect for events and busy professionals.",
    "Flawless by Design": "Award-worthy makeup artistry in Lagos. Specializing in bridal looks, editorial styling, and everyday beauty with luxury products.",
    "Kinky Kurls Studio": "Celebrating natural hair in all its glory. Expert care for locs, twists, braids, and curls. Your crown, our passion.",
    "Silk & Scissors": "Mombasa's go-to salon for precision cuts, silk press, and colour. We bring out the best in every hair type with gentle, nourishing techniques.",
  };

  for (const [name, desc] of Object.entries(descriptions)) {
    const { error } = await sb.from("businesses").update({ description: desc }).eq("name", name);
    if (!error) console.log(`  Updated: ${name}`);
  }

  // ── STEP 10: Add business contacts for demo ──
  console.log("\n10. Adding sample business contacts...");
  const { data: topBiz } = await sb.from("businesses").select("id, name")
    .eq("verification_status", "verified").limit(5);

  const sampleContacts = [
    { name: "Grace Wanjiku", phone: "+254 722 445 566", email: "grace.w@example.com" },
    { name: "James Mwangi", phone: "+254 733 112 233", email: "james.m@example.com" },
    { name: "Fatima Hassan", phone: "+254 711 998 877" },
    { name: "Peter Ochieng", phone: "+254 700 223 344", email: "peter.o@example.com" },
    { name: "Alice Njeri", email: "alice.njeri@example.com" },
  ];

  for (const biz of topBiz ?? []) {
    for (const contact of pickN(sampleContacts, 2 + Math.floor(rand() * 2))) {
      await sb.from("business_contacts").upsert({
        business_id: biz.id,
        name: contact.name,
        phone: contact.phone ?? null,
        email: contact.email ?? null,
      }, { onConflict: "id", ignoreDuplicates: true }).select("id");
    }
  }
  console.log(`  Added contacts for ${(topBiz ?? []).length} businesses`);

  console.log("\n=== DONE ===");
}

main().catch(console.error);
