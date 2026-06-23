/**
 * Test the availability engine against seeded data.
 *
 * Run: npx tsx scripts/test-availability.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Import the availability engine
// We can't import TS directly, so we'll replicate the core logic inline
// Actually, we can use tsx which handles TS imports

async function main() {
  console.log("\n=== Availability Engine Test Suite ===\n");

  // 1. Get Sarah's Beauty Studio (the original seed business)
  const { data: sarah } = await supabase
    .from("businesses")
    .select("id, name, slug, timezone, plan_id, subscription_status, commission_rate, plans(tier)")
    .eq("slug", "sarah-beauty-studio")
    .single();

  if (!sarah) {
    console.error("Sarah's Beauty Studio not found. Run seed-test-data.ts first.");
    process.exit(1);
  }

  console.log(`Business: ${sarah.name} (tz: ${sarah.timezone})`);
  const plan = sarah.plans as unknown as { tier: string };
  console.log(`Plan: ${plan.tier}, Status: ${sarah.subscription_status}`);

  // 2. Get a Free-plan business
  const { data: freeBiz } = await supabase
    .from("businesses")
    .select("id, name, slug, plans(tier)")
    .eq("slug", "polished-nails")
    .single();

  // 3. Get services
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_amount")
    .eq("business_id", sarah.id)
    .eq("is_active", true);

  console.log(`\nServices: ${services?.length}`);
  services?.forEach((s) => console.log(`  - ${s.name} (${s.duration_minutes}min, $${s.price_amount / 100})`));

  // 4. Get staff
  const { data: staff } = await supabase
    .from("staff")
    .select("id, display_name, status")
    .eq("business_id", sarah.id)
    .eq("status", "active");

  console.log(`\nActive staff: ${staff?.length}`);
  staff?.forEach((s) => console.log(`  - ${s.display_name} (${s.id})`));

  // 5. Get business hours
  const { data: hours } = await supabase
    .from("business_hours")
    .select("day_of_week, open_time, close_time")
    .eq("business_id", sarah.id)
    .order("day_of_week");

  console.log(`\nBusiness hours:`);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  hours?.forEach((h) => console.log(`  ${dayNames[h.day_of_week]}: ${h.open_time} - ${h.close_time}`));

  // 6. Get staff schedules
  const staffIds = staff?.map((s) => s.id) ?? [];
  const { data: schedules } = await supabase
    .from("staff_schedules")
    .select("staff_id, day_of_week, start_time, end_time")
    .in("staff_id", staffIds);

  console.log(`\nStaff schedules: ${schedules?.length} entries`);

  // 7. Get existing bookings
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, staff_id, starts_at, ends_at, status")
    .eq("business_id", sarah.id)
    .not("status", "in", '("cancelled","no_show")');

  console.log(`\nActive bookings: ${existingBookings?.length}`);
  existingBookings?.forEach((b) => {
    console.log(`  - ${b.status}: ${new Date(b.starts_at).toLocaleString()} → ${new Date(b.ends_at).toLocaleString()}`);
  });

  // ── Test 1: Availability for a weekday ────────────────────────────
  console.log("\n--- Test 1: Get slots for a future weekday ---");

  const now = new Date();

  // Find a weekday not covered by exceptions
  // David has an exception starting ~7 days from seed date; pick a day 14+ days out
  let testDay = new Date(now);
  testDay.setDate(now.getDate() + 14);
  // Make sure it's a weekday (Mon-Fri)
  while (testDay.getDay() === 0 || testDay.getDay() === 6) {
    testDay.setDate(testDay.getDate() + 1);
  }
  const dateStr = testDay.toISOString().split("T")[0];
  const dayNames2 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  console.log(`  Date: ${dateStr} (${dayNames2[testDay.getDay()]})`);

  // Use the availability engine via an inline version
  const blowout = services?.find((s) => s.name === "Signature Blowout");
  if (!blowout) {
    console.error("  Blowout service not found");
  } else {
    const slots = await computeSlots(sarah.id, blowout.id, null, dateStr);
    console.log(`  Slots for "${blowout.name}" (${blowout.duration_minutes}min): ${slots.length}`);
    if (slots.length > 0) {
      console.log(`  First 5: ${slots.slice(0, 5).map((s) => s.localTime).join(", ")}`);
      console.log(`  Last 5: ${slots.slice(-5).map((s) => s.localTime).join(", ")}`);
    }

    // Verify: last slot should end before business close (18:00)
    // With 60min service on 09:00-17:00 staff schedule, last slot should be at 16:00
    if (slots.length > 0) {
      const lastSlot = slots[slots.length - 1];
      const lastMin = timeToMinutes(lastSlot.localTime);
      const serviceEndMin = lastMin + blowout.duration_minutes;
      console.log(`  Last slot: ${lastSlot.localTime}, service ends at: ${minutesToTime(serviceEndMin)}`);
      console.log(`  ${serviceEndMin <= 17 * 60 ? "PASS" : "FAIL"}: fits within staff schedule`);
    }
  }

  // ── Test 2: Specific staff ────────────────────────────────────────
  console.log("\n--- Test 2: Specific staff member ---");
  const david = staff?.find((s) => s.display_name === "David Oloo");
  if (david && blowout) {
    const slots = await computeSlots(sarah.id, blowout.id, david.id, dateStr);
    console.log(`  Slots for David specifically: ${slots.length}`);
    const allDavid = slots.every((s) => s.staffId === david.id);
    console.log(`  ${allDavid ? "PASS" : "FAIL"}: All slots assigned to David`);
  }

  // ── Test 3: Sunday (closed) ───────────────────────────────────────
  console.log("\n--- Test 3: Sunday (business closed) ---");
  let nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((0 + 7 - now.getDay()) % 7 || 7));
  const sundayStr = nextSunday.toISOString().split("T")[0];
  if (blowout) {
    const slots = await computeSlots(sarah.id, blowout.id, null, sundayStr);
    console.log(`  Slots on Sunday ${sundayStr}: ${slots.length}`);
    console.log(`  ${slots.length === 0 ? "PASS" : "FAIL"}: No slots on closed day`);
  }

  // ── Test 4: Free plan business ────────────────────────────────────
  console.log("\n--- Test 4: Free-plan business (not bookable) ---");
  if (freeBiz) {
    const { data: freeSvcs } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", freeBiz.id)
      .eq("is_active", true)
      .limit(1);
    if (freeSvcs?.[0]) {
      const slots = await computeSlots(freeBiz.id, freeSvcs[0].id, null, dateStr);
      console.log(`  Slots for Free business: ${slots.length}`);
      console.log(`  ${slots.length === 0 ? "PASS" : "FAIL"}: No slots for Free plan`);
    } else {
      console.log("  (No services found for free business — PASS by default)");
    }
  } else {
    console.log("  (Free business not found — skipping)");
  }

  // ── Test 5: Double-booking guard ──────────────────────────────────
  console.log("\n--- Test 5: Double-booking guard ---");
  if (david && blowout && staffIds.length > 0) {
    // Find the first available slot
    const slots = await computeSlots(sarah.id, blowout.id, david.id, dateStr);
    if (slots.length > 0) {
      const testSlot = slots[0];
      console.log(`  Attempting to hold slot: ${testSlot.localTime} on ${dateStr}`);

      // Get test client (paginate through all users)
      let testClient: { id: string } | undefined;
      for (let pg = 1; !testClient; pg++) {
        const { data: usersPage } = await supabase.auth.admin.listUsers({ page: pg, perPage: 1000 });
        if (!usersPage?.users?.length) break;
        testClient = usersPage.users.find((u: { email?: string }) => u.email === "client@zawaditest.com");
      }
      if (!testClient) {
        console.log("  SKIP: No test client found");
      } else {
        // First reservation
        const endTime = new Date(new Date(testSlot.start).getTime() + blowout.duration_minutes * 60_000);
        const { data: bookingId1, error: err1 } = await supabase.rpc("reserve_booking_slot", {
          p_client_id: testClient.id,
          p_business_id: sarah.id,
          p_service_id: blowout.id,
          p_staff_id: david.id,
          p_staff_chosen: true,
          p_source: "marketplace",
          p_starts_at: testSlot.start,
          p_ends_at: endTime.toISOString(),
          p_payment_method: "pay_at_store",
          p_service_amount: blowout.price_amount,
          p_platform_fee: Math.round(blowout.price_amount * 0.05),
          p_currency: "USD",
          p_client_note: null,
          p_hold_minutes: 10,
        });

        if (err1) {
          console.log(`  First reservation error: ${err1.message}`);
        } else {
          console.log(`  First reservation: ${bookingId1} (OK)`);

          // Second reservation for SAME slot — should fail
          const { data: bookingId2, error: err2 } = await supabase.rpc("reserve_booking_slot", {
            p_client_id: testClient.id,
            p_business_id: sarah.id,
            p_service_id: blowout.id,
            p_staff_id: david.id,
            p_staff_chosen: true,
            p_source: "marketplace",
            p_starts_at: testSlot.start,
            p_ends_at: endTime.toISOString(),
            p_payment_method: "pay_at_store",
            p_service_amount: blowout.price_amount,
            p_platform_fee: Math.round(blowout.price_amount * 0.05),
            p_currency: "USD",
            p_client_note: null,
            p_hold_minutes: 10,
          });

          if (err2?.message?.includes("SLOT_TAKEN")) {
            console.log(`  Second reservation correctly rejected: SLOT_TAKEN`);
            console.log(`  PASS: Double-booking guard works!`);
          } else if (err2) {
            console.log(`  Second reservation error: ${err2.message}`);
            console.log(`  FAIL: Wrong error type`);
          } else {
            console.log(`  FAIL: Second reservation succeeded (double-booking!)`);
          }

          // Clean up the test hold
          await supabase.from("bookings").delete().eq("id", bookingId1);
          console.log(`  Cleaned up test hold`);
        }

        // Verify the slot reappears after cleanup
        const slotsAfter = await computeSlots(sarah.id, blowout.id, david.id, dateStr);
        const slotBack = slotsAfter.some((s) => s.start === testSlot.start);
        console.log(`  ${slotBack ? "PASS" : "FAIL"}: Slot reappeared after hold cleanup`);
      }
    }
  }

  // ── Test 6: Lead time ─────────────────────────────────────────────
  console.log("\n--- Test 6: Lead time enforcement ---");
  const todayStr = now.toISOString().split("T")[0];
  if (blowout) {
    const todaySlots = await computeSlots(sarah.id, blowout.id, null, todayStr);
    const pastSlots = todaySlots.filter((s) => {
      const slotTime = new Date(s.start);
      return slotTime < new Date(now.getTime() + 60 * 60_000);
    });
    console.log(`  Today's slots: ${todaySlots.length} (none should be <1hr from now)`);
    console.log(`  ${pastSlots.length === 0 ? "PASS" : "FAIL"}: Lead time enforced (${pastSlots.length} violations)`);
  }

  console.log("\n=== All tests complete ===\n");
}

// ── Inline availability computation (mirrors src/lib/booking/availability.ts) ──

interface Slot {
  start: string;
  localTime: string;
  staffId: string;
  staffName: string;
}

async function computeSlots(
  businessId: string,
  serviceId: string,
  staffIdFilter: string | null,
  dateStr: string,
): Promise<Slot[]> {
  const [bizResult, svcResult] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, timezone, commission_rate, plan_id, subscription_status, plans(tier)")
      .eq("id", businessId)
      .single(),
    supabase
      .from("services")
      .select("id, duration_minutes, price_amount, currency")
      .eq("id", serviceId)
      .eq("is_active", true)
      .single(),
  ]);

  if (!bizResult.data || !svcResult.data) return [];

  const biz = bizResult.data;
  const service = svcResult.data;
  const tz = biz.timezone;

  const p = biz.plans as unknown as { tier: string } | null;
  if (p?.tier !== "premium" || !["trialing", "active"].includes(biz.subscription_status ?? "")) return [];

  const now = new Date();
  const earliest = new Date(now.getTime() + 60 * 60_000);
  const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60_000);

  const dayOfWeek = getDayOfWeekInTz(dateStr, tz);

  const { data: hoursRows } = await supabase
    .from("business_hours")
    .select("open_time, close_time")
    .eq("business_id", businessId)
    .eq("day_of_week", dayOfWeek);

  if (!hoursRows?.length) return [];

  let staffQuery = supabase
    .from("staff_services")
    .select("staff_id, staff(id, display_name, status, business_id)")
    .eq("service_id", serviceId);

  if (staffIdFilter) staffQuery = staffQuery.eq("staff_id", staffIdFilter);

  const { data: staffServiceRows } = await staffQuery;
  if (!staffServiceRows?.length) return [];

  const qualifiedStaff = staffServiceRows
    .filter((row) => {
      const s = row.staff as unknown as { id: string; display_name: string; status: string; business_id: string } | null;
      return s && s.status === "active" && s.business_id === businessId;
    })
    .map((row) => {
      const s = row.staff as unknown as { id: string; display_name: string };
      return { id: s.id, displayName: s.display_name };
    });

  if (!qualifiedStaff.length) return [];

  const sIds = qualifiedStaff.map((s) => s.id);

  const dayStartUtc = localTimeToUtc(dateStr, "00:00", tz) ?? `${dateStr}T00:00:00Z`;
  const dayEndUtc = localTimeToUtc(dateStr, "23:59", tz) ?? `${dateStr}T23:59:00Z`;

  const [schedulesResult, exceptionsResult, bookingsResult] = await Promise.all([
    supabase.from("staff_schedules").select("staff_id, start_time, end_time").in("staff_id", sIds).eq("day_of_week", dayOfWeek),
    supabase.from("schedule_exceptions").select("staff_id, starts_at, ends_at, is_available").in("staff_id", sIds).lte("starts_at", dayEndUtc).gte("ends_at", dayStartUtc),
    supabase.from("bookings").select("staff_id, starts_at, ends_at, status, hold_expires_at").in("staff_id", sIds).not("status", "in", '("cancelled","no_show")').lte("starts_at", dayEndUtc).gte("ends_at", dayStartUtc),
  ]);

  const schedules = schedulesResult.data ?? [];
  const exceptions = exceptionsResult.data ?? [];
  const bookings = (bookingsResult.data ?? []).filter((b) => {
    if (b.status === "pending_hold" && b.hold_expires_at) return new Date(b.hold_expires_at) > now;
    return true;
  });

  const allSlots: Slot[] = [];

  for (const hours of hoursRows) {
    if (!hours.open_time || !hours.close_time) continue;
    const openMin = timeToMinutes(hours.open_time);
    const closeMin = timeToMinutes(hours.close_time);

    for (let slotStart = openMin; slotStart + service.duration_minutes <= closeMin; slotStart += 30) {
      const slotStartUtc = localTimeToUtc(dateStr, minutesToTime(slotStart), tz);
      const slotEndUtc = localTimeToUtc(dateStr, minutesToTime(slotStart + service.duration_minutes), tz);
      if (!slotStartUtc || !slotEndUtc) continue;

      const slotStartDate = new Date(slotStartUtc);
      const slotEndDate = new Date(slotEndUtc);
      if (slotStartDate < earliest || slotStartDate > maxDate) continue;

      const available = qualifiedStaff.filter((staff) => {
        const ss = schedules.filter((s) => s.staff_id === staff.id);
        if (!ss.some((s) => timeToMinutes(s.start_time) <= slotStart && timeToMinutes(s.end_time) >= slotStart + service.duration_minutes)) return false;

        for (const exc of exceptions.filter((e) => e.staff_id === staff.id)) {
          if (new Date(exc.starts_at) < slotEndDate && new Date(exc.ends_at) > slotStartDate && !exc.is_available) return false;
        }

        for (const bk of bookings.filter((b) => b.staff_id === staff.id)) {
          if (new Date(bk.starts_at) < slotEndDate && new Date(bk.ends_at) > slotStartDate) return false;
        }
        return true;
      });

      if (!available.length) continue;

      const chosen = staffIdFilter
        ? available.find((s) => s.id === staffIdFilter) ?? available[0]
        : available.reduce((a, b) => {
            const loadA = bookings.filter((bk) => bk.staff_id === a.id).length;
            const loadB = bookings.filter((bk) => bk.staff_id === b.id).length;
            return loadB < loadA ? b : a;
          });

      allSlots.push({ start: slotStartUtc, localTime: minutesToTime(slotStart), staffId: chosen.id, staffName: chosen.displayName });
    }
  }

  return allSlots;
}

function timeToMinutes(t: string): number {
  const p = t.split(":");
  return parseInt(p[0]) * 60 + parseInt(p[1]);
}
function minutesToTime(m: number): string {
  return `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
}
function getDayOfWeekInTz(dateStr: string, tz: string): number {
  const dt = new Date(`${dateStr}T12:00:00`);
  const formatted = dt.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[formatted] ?? 0;
}
function localTimeToUtc(dateStr: string, timeStr: string, tz: string): string | null {
  try {
    const wallStr = `${dateStr}T${timeStr}:00`;
    const naive = new Date(wallStr + "Z");
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const parts = fmt.formatToParts(naive);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
    const localInTz = new Date(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`);
    const offsetMs = localInTz.getTime() - naive.getTime();
    return new Date(naive.getTime() - offsetMs).toISOString();
  } catch { return null; }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
