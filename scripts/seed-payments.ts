import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedPayments() {
  // Get bookings that don't already have payments
  const { data: bookings, error: bookingsErr } = await supabase
    .from("bookings")
    .select("id, service_amount, tip_amount, platform_fee_amount, currency, business_id, created_at")
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: true });

  if (bookingsErr) {
    console.error("Error fetching bookings:", bookingsErr);
    return;
  }

  if (!bookings || bookings.length === 0) {
    console.log("No bookings found. Creating synthetic payment data...");
    await seedSyntheticPayments();
    return;
  }

  // Check which bookings already have payments
  const { data: existingPayments } = await supabase
    .from("payments")
    .select("booking_id");

  const existingBookingIds = new Set(existingPayments?.map((p) => p.booking_id) ?? []);
  const newBookings = bookings.filter((b) => !existingBookingIds.has(b.id));

  if (newBookings.length === 0) {
    console.log("All bookings already have payments. Skipping.");
    return;
  }

  console.log(`Seeding ${newBookings.length} payments from existing bookings...`);

  const payments = newBookings.map((b) => ({
    booking_id: b.id,
    stripe_payment_intent_id: `pi_sample_${b.id.slice(0, 8)}`,
    amount: (b.service_amount ?? 0) + (b.tip_amount ?? 0),
    tip_amount: b.tip_amount ?? 0,
    application_fee_amount: b.platform_fee_amount ?? 0,
    currency: b.currency ?? "usd",
    status: "succeeded" as const,
  }));

  // Insert in batches of 50
  for (let i = 0; i < payments.length; i += 50) {
    const batch = payments.slice(i, i + 50);
    const { error } = await supabase.from("payments").insert(batch);
    if (error) {
      console.error(`Error inserting batch at index ${i}:`, error);
    } else {
      console.log(`  Inserted ${batch.length} payments (batch ${Math.floor(i / 50) + 1})`);
    }
  }

  console.log("Done! Seeded payments from existing bookings.");
}

async function seedSyntheticPayments() {
  // Get a few businesses to create synthetic data
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, commission_rate")
    .limit(5);

  if (!businesses || businesses.length === 0) {
    console.error("No businesses found.");
    return;
  }

  // Get services for these businesses
  const { data: services } = await supabase
    .from("services")
    .select("id, business_id, price_amount, currency")
    .in("business_id", businesses.map((b) => b.id))
    .limit(20);

  if (!services || services.length === 0) {
    console.error("No services found.");
    return;
  }

  // Get some client profiles
  const { data: clients } = await supabase
    .from("profiles")
    .select("id")
    .limit(10);

  if (!clients || clients.length === 0) {
    console.error("No clients found.");
    return;
  }

  // Get staff for each business
  const { data: staff } = await supabase
    .from("staff")
    .select("id, user_id, business_id")
    .in("business_id", businesses.map((b) => b.id));

  console.log("Creating synthetic bookings + payments across 6 months...");

  const now = new Date();
  const bookingsToInsert = [];
  const months = 6;

  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset--) {
    // More bookings in recent months (growth trend)
    const bookingsThisMonth = 8 + Math.floor(Math.random() * 6) + (months - monthOffset) * 2;

    for (let j = 0; j < bookingsThisMonth; j++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const biz = businesses.find((b) => b.id === service.business_id)!;
      const bizStaff = staff?.filter((s) => s.business_id === biz.id) ?? [];
      const assignedStaff = bizStaff.length > 0 ? bizStaff[Math.floor(Math.random() * bizStaff.length)] : null;

      const serviceAmount = service.price_amount;
      const hasTip = Math.random() > 0.5;
      const tipAmount = hasTip ? Math.floor(serviceAmount * (0.1 + Math.random() * 0.15)) : 0;
      const platformFee = Math.floor(serviceAmount * (biz.commission_rate ?? 0.1));

      const day = 1 + Math.floor(Math.random() * 28);
      const hour = 9 + Math.floor(Math.random() * 9); // 9am-5pm
      const bookingDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, day, hour, 0, 0);
      if (bookingDate > now) continue;

      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = hour + 1;
      const endTime = `${String(endHour).padStart(2, "0")}:00`;

      bookingsToInsert.push({
        business_id: biz.id,
        service_id: service.id,
        client_id: client.id,
        staff_id: assignedStaff?.id ?? null,
        booking_date: bookingDate.toISOString().split("T")[0],
        start_time: startTime,
        end_time: endTime,
        status: "completed",
        payment_method: "prepay",
        service_amount: serviceAmount,
        tip_amount: tipAmount,
        platform_fee_amount: platformFee,
        currency: service.currency ?? "kes",
        source: "marketplace",
        created_at: bookingDate.toISOString(),
      });
    }
  }

  console.log(`  Inserting ${bookingsToInsert.length} synthetic bookings...`);

  // Insert bookings in batches
  const insertedBookings = [];
  for (let i = 0; i < bookingsToInsert.length; i += 20) {
    const batch = bookingsToInsert.slice(i, i + 20);
    const { data, error } = await supabase.from("bookings").insert(batch).select("id, service_amount, tip_amount, platform_fee_amount, currency, created_at");
    if (error) {
      console.error(`  Error inserting bookings batch ${i}:`, error.message);
    } else if (data) {
      insertedBookings.push(...data);
    }
  }

  console.log(`  Inserted ${insertedBookings.length} bookings. Now creating payments...`);

  const paymentsToInsert = insertedBookings.map((b) => ({
    booking_id: b.id,
    stripe_payment_intent_id: `pi_sample_${b.id.slice(0, 8)}`,
    amount: (b.service_amount ?? 0) + (b.tip_amount ?? 0),
    tip_amount: b.tip_amount ?? 0,
    application_fee_amount: b.platform_fee_amount ?? 0,
    currency: b.currency ?? "kes",
    status: "succeeded",
    created_at: b.created_at,
  }));

  for (let i = 0; i < paymentsToInsert.length; i += 20) {
    const batch = paymentsToInsert.slice(i, i + 20);
    const { error } = await supabase.from("payments").insert(batch);
    if (error) {
      console.error(`  Error inserting payments batch ${i}:`, error.message);
    }
  }

  console.log(`Done! Seeded ${paymentsToInsert.length} payments across ${months} months.`);
}

seedPayments().catch(console.error);
