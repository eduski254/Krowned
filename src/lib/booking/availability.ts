/**
 * Availability engine — computes open 30-min-grid slots for a service.
 *
 * Availability = business_hours ∩ staff_schedules − schedule_exceptions
 *                − existing bookings (including active holds)
 *                − slots that can't fit the service duration
 *                − slots violating 1-hour lead / 60-day window
 *
 * All computation is in the business's local timezone.
 * Returned slots are { start: ISO string (UTC), localTime: "HH:MM" }.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isBookable } from "@/lib/plans";

const SLOT_GRID_MINUTES = 30;
const LEAD_TIME_MINUTES = 60;
const MAX_DAYS_AHEAD = 60;

export interface AvailableSlot {
  /** UTC ISO string for DB storage */
  start: string;
  /** Local time display string "HH:MM" in business timezone */
  localTime: string;
  /** Staff ID that is available for this slot (for "any available" mode) */
  staffId: string;
  /** Staff display name */
  staffName: string;
}

export interface AvailabilityQuery {
  businessId: string;
  serviceId: string;
  /** If set, only this staff member. If null/undefined, "any available" */
  staffId?: string | null;
  /** ISO date string YYYY-MM-DD in business local time */
  date: string;
}

export interface AvailabilityResult {
  slots: AvailableSlot[];
  timezone: string;
  date: string;
}

/**
 * Get available slots for a single date.
 * Uses the service-role client (bypasses RLS) for server-side computation.
 */
export async function getAvailableSlots(
  supabase: SupabaseClient,
  query: AvailabilityQuery,
): Promise<AvailabilityResult> {
  const { businessId, serviceId, date } = query;
  const staffIdFilter = query.staffId || null;

  // 1. Fetch business + service + staff in parallel
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
      .eq("business_id", businessId)
      .eq("is_active", true)
      .single(),
  ]);

  if (bizResult.error || !bizResult.data) return { slots: [], timezone: "Africa/Nairobi", date };
  if (svcResult.error || !svcResult.data) return { slots: [], timezone: bizResult.data.timezone, date };

  const biz = bizResult.data;
  const service = svcResult.data;
  const tz = biz.timezone;

  // Gate check: must be paid tier + active/trialing
  const plan = biz.plans as unknown as { tier: string } | null;
  if (!isBookable(plan?.tier, biz.subscription_status)) {
    return { slots: [], timezone: tz, date };
  }

  // 2. Parse the date in business timezone and check lead/window
  const now = new Date();
  const earliest = new Date(now.getTime() + LEAD_TIME_MINUTES * 60_000);
  const maxDate = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60_000);

  // Get the day-of-week for the requested date in the business timezone
  const dateObj = parseDateInTz(date, tz);
  if (!dateObj || dateObj > maxDate) return { slots: [], timezone: tz, date };

  const dayOfWeek = getDayOfWeekInTz(date, tz); // 0=Sun..6=Sat

  // 3. Get business hours for this day
  const { data: hoursRows } = await supabase
    .from("business_hours")
    .select("open_time, close_time")
    .eq("business_id", businessId)
    .eq("day_of_week", dayOfWeek);

  if (!hoursRows?.length) return { slots: [], timezone: tz, date };

  // 4. Get qualified staff (mapped to this service + active)
  let staffQuery = supabase
    .from("staff_services")
    .select("staff_id, staff(id, display_name, status, business_id)")
    .eq("service_id", serviceId);

  if (staffIdFilter) {
    staffQuery = staffQuery.eq("staff_id", staffIdFilter);
  }

  const { data: staffServiceRows } = await staffQuery;
  if (!staffServiceRows?.length) return { slots: [], timezone: tz, date };

  // Filter to active staff of this business
  const qualifiedStaff = staffServiceRows
    .filter((row) => {
      const s = row.staff as unknown as { id: string; display_name: string; status: string; business_id: string } | null;
      return s && s.status === "active" && s.business_id === businessId;
    })
    .map((row) => {
      const s = row.staff as unknown as { id: string; display_name: string };
      return { id: s.id, displayName: s.display_name };
    });

  if (!qualifiedStaff.length) return { slots: [], timezone: tz, date };

  const staffIds = qualifiedStaff.map((s) => s.id);

  // 5. Fetch schedules, exceptions, and bookings for all candidate staff on this date
  const dayStartUtc = localDateToUtcRange(date, "00:00", tz);
  const dayEndUtc = localDateToUtcRange(date, "23:59", tz);

  const [schedulesResult, exceptionsResult, bookingsResult] = await Promise.all([
    supabase
      .from("staff_schedules")
      .select("staff_id, start_time, end_time")
      .in("staff_id", staffIds)
      .eq("day_of_week", dayOfWeek),

    supabase
      .from("schedule_exceptions")
      .select("staff_id, starts_at, ends_at, is_available")
      .in("staff_id", staffIds)
      .lte("starts_at", dayEndUtc)
      .gte("ends_at", dayStartUtc),

    supabase
      .from("bookings")
      .select("staff_id, starts_at, ends_at, status, hold_expires_at")
      .in("staff_id", staffIds)
      .not("status", "in", '("cancelled","no_show")')
      .lte("starts_at", dayEndUtc)
      .gte("ends_at", dayStartUtc),
  ]);

  const schedules = schedulesResult.data ?? [];
  const exceptions = exceptionsResult.data ?? [];
  const bookings = (bookingsResult.data ?? []).filter((b) => {
    // Exclude expired holds
    if (b.status === "pending_hold" && b.hold_expires_at) {
      return new Date(b.hold_expires_at) > now;
    }
    return true;
  });

  // 6. For each business-hours window, generate 30-min grid slots
  const allSlots: AvailableSlot[] = [];

  for (const hours of hoursRows) {
    if (!hours.open_time || !hours.close_time) continue;

    const openMinutes = timeToMinutes(hours.open_time);
    const closeMinutes = timeToMinutes(hours.close_time);

    for (let slotStart = openMinutes; slotStart + service.duration_minutes <= closeMinutes; slotStart += SLOT_GRID_MINUTES) {
      const slotStartUtc = localTimeToUtc(date, minutesToTime(slotStart), tz);
      const slotEndUtc = localTimeToUtc(date, minutesToTime(slotStart + service.duration_minutes), tz);

      if (!slotStartUtc || !slotEndUtc) continue;

      const slotStartDate = new Date(slotStartUtc);
      const slotEndDate = new Date(slotEndUtc);

      // Lead time check
      if (slotStartDate < earliest) continue;
      // Window check
      if (slotStartDate > maxDate) continue;

      // Find available staff for this slot
      const availableStaff = findAvailableStaff(
        qualifiedStaff,
        slotStartDate,
        slotEndDate,
        slotStart,
        slotStart + service.duration_minutes,
        schedules,
        exceptions,
        bookings,
        date,
        tz,
      );

      if (availableStaff.length === 0) continue;

      // If specific staff requested, use them. Otherwise pick lightest-loaded.
      let chosenStaff: { id: string; displayName: string };
      if (staffIdFilter) {
        const match = availableStaff.find((s) => s.id === staffIdFilter);
        if (!match) continue;
        chosenStaff = match;
      } else {
        // Lightest loaded: fewest bookings today
        chosenStaff = availableStaff.reduce((lightest, staff) => {
          const loadA = bookings.filter((b) => b.staff_id === lightest.id).length;
          const loadB = bookings.filter((b) => b.staff_id === staff.id).length;
          return loadB < loadA ? staff : lightest;
        });
      }

      allSlots.push({
        start: slotStartUtc,
        localTime: minutesToTime(slotStart),
        staffId: chosenStaff.id,
        staffName: chosenStaff.displayName,
      });
    }
  }

  return { slots: allSlots, timezone: tz, date };
}

// ── Internal helpers ──────────────────────────────────────────────────

function findAvailableStaff(
  candidates: { id: string; displayName: string }[],
  slotStartUtc: Date,
  slotEndUtc: Date,
  slotStartMin: number,
  slotEndMin: number,
  schedules: { staff_id: string; start_time: string; end_time: string }[],
  exceptions: { staff_id: string; starts_at: string; ends_at: string; is_available: boolean }[],
  bookings: { staff_id: string; starts_at: string; ends_at: string }[],
  date: string,
  tz: string,
): { id: string; displayName: string }[] {
  return candidates.filter((staff) => {
    // Check staff schedule: must have a schedule window covering the entire slot
    const staffSchedules = schedules.filter((s) => s.staff_id === staff.id);
    const hasCoveringSchedule = staffSchedules.some((s) => {
      const schedStart = timeToMinutes(s.start_time);
      const schedEnd = timeToMinutes(s.end_time);
      return schedStart <= slotStartMin && schedEnd >= slotEndMin;
    });
    if (!hasCoveringSchedule) return false;

    // Check exceptions
    const staffExceptions = exceptions.filter((e) => e.staff_id === staff.id);
    for (const exc of staffExceptions) {
      const excStart = new Date(exc.starts_at);
      const excEnd = new Date(exc.ends_at);
      const overlaps = excStart < slotEndUtc && excEnd > slotStartUtc;
      if (overlaps) {
        // If is_available=true it's added availability (skip block logic)
        // If is_available=false it's a block — staff is unavailable
        if (!exc.is_available) return false;
      }
    }

    // Check existing bookings: no overlap
    const staffBookings = bookings.filter((b) => b.staff_id === staff.id);
    for (const booking of staffBookings) {
      const bStart = new Date(booking.starts_at);
      const bEnd = new Date(booking.ends_at);
      if (bStart < slotEndUtc && bEnd > slotStartUtc) {
        return false;
      }
    }

    return true;
  });
}

/** Parse "HH:MM:SS" or "HH:MM" to minutes since midnight */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/** Convert minutes since midnight to "HH:MM" */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Get day-of-week (0=Sun..6=Sat) for a date string in a given timezone */
function getDayOfWeekInTz(dateStr: string, tz: string): number {
  // Create a date at noon local time to avoid DST edge cases
  const dt = new Date(`${dateStr}T12:00:00`);
  const formatted = dt.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return dayMap[formatted] ?? 0;
}

/** Parse a YYYY-MM-DD date string as the start of that day in a timezone */
function parseDateInTz(dateStr: string, tz: string): Date | null {
  try {
    const utcStr = localTimeToUtc(dateStr, "00:00", tz);
    return utcStr ? new Date(utcStr) : null;
  } catch {
    return null;
  }
}

/**
 * Convert a local date + time ("YYYY-MM-DD", "HH:MM") in a timezone to a UTC ISO string.
 * Uses Intl.DateTimeFormat to handle DST correctly.
 */
function localTimeToUtc(dateStr: string, timeStr: string, tz: string): string | null {
  try {
    // Build a wall-clock string and parse in the target timezone
    const wallStr = `${dateStr}T${timeStr}:00`;

    // Use a two-step approach: parse as UTC, then compute the offset in the target tz
    const naive = new Date(wallStr + "Z");

    // Get the offset of the target timezone at this approximate time
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(naive);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

    const localInTz = new Date(
      `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`,
    );

    // The offset is how far the tz-rendered time is from the UTC input
    const offsetMs = localInTz.getTime() - naive.getTime();

    // The actual UTC time = wall clock - offset
    const actualUtc = new Date(naive.getTime() - offsetMs);
    return actualUtc.toISOString();
  } catch {
    return null;
  }
}

/**
 * Convert a local date + time ("YYYY-MM-DD", "HH:MM") in a timezone
 * to a UTC ISO string (for range queries).
 */
function localDateToUtcRange(dateStr: string, timeStr: string, tz: string): string {
  return localTimeToUtc(dateStr, timeStr, tz) ?? new Date(`${dateStr}T${timeStr}:00Z`).toISOString();
}

/**
 * Get dates available for booking (dates within the 60-day window
 * that have business hours set). Returns YYYY-MM-DD strings in business tz.
 */
export async function getAvailableDateRange(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ dates: string[]; timezone: string }> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("timezone, plans(tier), subscription_status")
    .eq("id", businessId)
    .single();

  if (!biz) return { dates: [], timezone: "Africa/Nairobi" };

  const plan = biz.plans as unknown as { tier: string } | null;
  if (!isBookable(plan?.tier, biz.subscription_status)) {
    return { dates: [], timezone: biz.timezone };
  }

  const { data: hours } = await supabase
    .from("business_hours")
    .select("day_of_week")
    .eq("business_id", businessId);

  if (!hours?.length) return { dates: [], timezone: biz.timezone };

  const openDays = new Set(hours.map((h) => h.day_of_week));
  const tz = biz.timezone;
  const now = new Date();
  const dates: string[] = [];

  // Start from tomorrow (lead time makes today partial at best)
  for (let d = 0; d <= MAX_DAYS_AHEAD; d++) {
    const futureDate = new Date(now.getTime() + d * 24 * 60 * 60_000);
    const dateStr = formatDateInTz(futureDate, tz);
    const dow = getDayOfWeekInTz(dateStr, tz);
    if (openDays.has(dow)) {
      dates.push(dateStr);
    }
  }

  return { dates, timezone: tz };
}

/** Format a Date as "YYYY-MM-DD" in a given timezone */
function formatDateInTz(date: Date, tz: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}
