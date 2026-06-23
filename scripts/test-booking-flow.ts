/**
 * End-to-end booking flow test against seeded data + live dev server.
 * Run: npx tsx scripts/test-booking-flow.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const BASE = "http://localhost:3000";

async function main() {
  console.log("\n=== Booking Flow End-to-End Test ===\n");

  // 1. Business
  const { data: biz } = await s
    .from("businesses")
    .select("id, name, timezone, charges_enabled")
    .eq("slug", "sarah-beauty-studio")
    .single();
  if (!biz) throw new Error("Sarah's Beauty Studio not found");
  console.log("1. Business:", biz.name, "| TZ:", biz.timezone, "| Charges:", biz.charges_enabled);

  // 2. Services
  const { data: services } = await s
    .from("services")
    .select("id, name, duration_minutes, price_amount, currency")
    .eq("business_id", biz.id)
    .eq("is_active", true)
    .order("name");
  console.log("\n2. Services:");
  services!.forEach((svc) =>
    console.log(`   - ${svc.name} (${svc.duration_minutes}min, $${(svc.price_amount / 100).toFixed(2)})`),
  );

  // 3. Staff
  const { data: staff } = await s
    .from("staff")
    .select("id, display_name")
    .eq("business_id", biz.id)
    .eq("status", "active");
  console.log("\n3. Staff:");
  staff!.forEach((st) => console.log(`   - ${st.display_name} (${st.id})`));

  // 4. Find a test date (weekday, 14+ days out to avoid exceptions)
  const now = new Date();
  const testDate = new Date(now.getTime() + 14 * 24 * 60 * 60_000);
  while (testDate.getDay() === 0 || testDate.getDay() === 6) {
    testDate.setDate(testDate.getDate() + 1);
  }
  const dateStr = testDate.toISOString().split("T")[0];
  const blowout = services!.find((svc) => svc.name === "Signature Blowout")!;

  console.log(`\n4. Availability for "${blowout.name}" on ${dateStr}`);
  const url = `${BASE}/api/availability?businessId=${biz.id}&serviceId=${blowout.id}&date=${dateStr}`;
  const res = await fetch(url);
  const avail = await res.json();
  console.log(`   Timezone: ${avail.timezone}`);
  console.log(`   Slots: ${avail.slots.length}`);
  if (avail.slots.length > 0) {
    console.log(`   Times: ${avail.slots.map((sl: { localTime: string }) => sl.localTime).join(", ")}`);
    console.log(`   Staff: ${avail.slots[0].staffName}`);
  }

  // 5. Specific staff
  const david = staff![0];
  console.log(`\n5. Specific staff (${david.display_name})`);
  const res2 = await fetch(`${url}&staffId=${david.id}`);
  const avail2 = await res2.json();
  console.log(`   Slots: ${avail2.slots.length}`);
  const allDavid = avail2.slots.every((sl: { staffId: string }) => sl.staffId === david.id);
  console.log(`   All assigned to ${david.display_name}: ${allDavid ? "PASS" : "FAIL"}`);

  // 6. Sunday (closed)
  const sunday = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
  while (sunday.getDay() !== 0) sunday.setDate(sunday.getDate() + 1);
  const sundayStr = sunday.toISOString().split("T")[0];
  const res3 = await fetch(`${BASE}/api/availability?businessId=${biz.id}&serviceId=${blowout.id}&date=${sundayStr}`);
  const avail3 = await res3.json();
  console.log(`\n6. Sunday (${sundayStr}): slots = ${avail3.slots.length} ${avail3.slots.length === 0 ? "PASS" : "FAIL"}`);

  // 7. Full booking lifecycle
  if (avail.slots.length > 0) {
    const slot = avail.slots[0];
    console.log(`\n7. Booking lifecycle — slot ${slot.localTime} on ${dateStr}`);

    // Find test client
    let client: { id: string } | undefined;
    for (let pg = 1; !client; pg++) {
      const { data: page } = await s.auth.admin.listUsers({ page: pg, perPage: 1000 });
      if (!page?.users?.length) break;
      client = page.users.find((u) => u.email === "client@zawaditest.com");
    }
    if (!client) throw new Error("Test client not found");

    const endTime = new Date(new Date(slot.start).getTime() + blowout.duration_minutes * 60_000);

    // a) Hold slot
    const { data: bookingId, error: holdErr } = await s.rpc("reserve_booking_slot", {
      p_client_id: client.id,
      p_business_id: biz.id,
      p_service_id: blowout.id,
      p_staff_id: slot.staffId,
      p_staff_chosen: false,
      p_source: "direct_link",
      p_starts_at: slot.start,
      p_ends_at: endTime.toISOString(),
      p_payment_method: "pay_at_store",
      p_service_amount: blowout.price_amount,
      p_platform_fee: Math.round(blowout.price_amount * 0.05),
      p_currency: blowout.currency,
      p_client_note: "Test booking from flow test",
      p_hold_minutes: 10,
    });
    if (holdErr) throw new Error(`Hold failed: ${holdErr.message}`);
    console.log(`   a) Hold created: ${bookingId}`);

    // b) Check status
    const { data: held } = await s.from("bookings").select("status, hold_expires_at").eq("id", bookingId).single();
    console.log(`   b) Status: ${held!.status} | Expires: ${new Date(held!.hold_expires_at!).toLocaleTimeString()}`);
    console.log(`      ${held!.status === "pending_hold" ? "PASS" : "FAIL"}: correct hold status`);

    // c) Slot removed from availability
    const res4 = await fetch(url);
    const avail4 = await res4.json();
    const slotGone = !avail4.slots.some((sl: { start: string }) => sl.start === slot.start);
    console.log(`   c) Slot removed from availability: ${slotGone ? "PASS" : "FAIL"}`);

    // d) Double-book blocked
    const { error: doubleErr } = await s.rpc("reserve_booking_slot", {
      p_client_id: client.id,
      p_business_id: biz.id,
      p_service_id: blowout.id,
      p_staff_id: slot.staffId,
      p_staff_chosen: false,
      p_source: "direct_link",
      p_starts_at: slot.start,
      p_ends_at: endTime.toISOString(),
      p_payment_method: "pay_at_store",
      p_service_amount: blowout.price_amount,
      p_platform_fee: Math.round(blowout.price_amount * 0.05),
      p_currency: blowout.currency,
      p_client_note: null,
      p_hold_minutes: 10,
    });
    const blocked = doubleErr?.message?.includes("SLOT_TAKEN");
    console.log(`   d) Double-book blocked: ${blocked ? "PASS" : "FAIL"}`);

    // e) Confirm booking
    await s.from("bookings").update({ status: "confirmed", hold_expires_at: null }).eq("id", bookingId);
    const { data: confirmed } = await s.from("bookings").select("status").eq("id", bookingId).single();
    console.log(`   e) Confirm (pending_hold -> confirmed): ${confirmed!.status === "confirmed" ? "PASS" : "FAIL"}`);

    // f) Cleanup
    await s.from("bookings").delete().eq("id", bookingId);
    console.log(`   f) Cleaned up test booking`);

    // g) Slot restored
    const res5 = await fetch(url);
    const avail5 = await res5.json();
    const slotBack = avail5.slots.some((sl: { start: string }) => sl.start === slot.start);
    console.log(`   g) Slot restored after cleanup: ${slotBack ? "PASS" : "FAIL"}`);
  }

  // 8. Free plan
  const { data: freeBiz } = await s.from("businesses").select("id").eq("slug", "polished-nails").single();
  if (freeBiz) {
    const { data: freeSvc } = await s
      .from("services")
      .select("id")
      .eq("business_id", freeBiz.id)
      .eq("is_active", true)
      .limit(1);
    if (freeSvc?.[0]) {
      const res6 = await fetch(
        `${BASE}/api/availability?businessId=${freeBiz.id}&serviceId=${freeSvc[0].id}&date=${dateStr}`,
      );
      const avail6 = await res6.json();
      console.log(`\n8. Free plan (Polished Nails): slots = ${avail6.slots.length} ${avail6.slots.length === 0 ? "PASS" : "FAIL"}`);
    }
  }

  // 9. Booking page HTTP check
  console.log("\n9. Page renders:");
  const pages = [
    { url: "/book/test-booking-token-sarah", expect: "Book at" },
    { url: "/book/blt-polished-nails", expect: "Booking not available" },
    { url: "/book/blt-crown-cuts", expect: "Book at" },
  ];
  for (const pg of pages) {
    const r = await fetch(`${BASE}${pg.url}`);
    const html = await r.text();
    const found = html.includes(pg.expect);
    console.log(`   ${found ? "PASS" : "FAIL"} ${pg.url} -> "${pg.expect}" (${r.status})`);
  }

  console.log("\n=== All tests complete ===\n");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
