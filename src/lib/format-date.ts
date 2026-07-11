/**
 * Timezone-aware date/time formatting for bookings.
 *
 * All booking times are stored in UTC. They must be displayed in the
 * business's timezone (e.g., "Africa/Nairobi") — never in the viewer's
 * local browser timezone.
 */

/**
 * Format a UTC date string into a human-readable date in the given timezone.
 * e.g., "Mon, Jul 20, 2026"
 */
export function formatBookingDate(
  utcDate: string,
  timezone: string,
  options?: { includeYear?: boolean },
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(options?.includeYear !== false && { year: "numeric" }),
  }).format(new Date(utcDate));
}

/**
 * Format a UTC date string into a human-readable time in the given timezone.
 * e.g., "1:00 PM"
 */
export function formatBookingTime(utcDate: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(utcDate));
}

/**
 * Format a UTC date string into full date + time in the given timezone.
 * e.g., "Monday, July 20, 2026 at 1:00 PM"
 */
export function formatBookingDateTime(utcDate: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(utcDate));
}

/**
 * Convert a local date/time string (in a specific timezone) to a UTC ISO string.
 * Used when the user enters a time in the business timezone and we need to store it as UTC.
 *
 * @param localDateTime - e.g., "2026-07-20T14:00:00" (no Z, no offset)
 * @param timezone - e.g., "Africa/Nairobi"
 * @returns UTC ISO string, e.g., "2026-07-20T11:00:00.000Z"
 */
export function localToUtcIso(localDateTime: string, timezone: string): string {
  // Strategy: binary-search isn't needed for most cases.
  // We use Intl to find the UTC offset at the given wall-clock time.
  // 1. Parse the local datetime as if it were UTC (gives us a reference point)
  const asUtc = new Date(localDateTime + "Z");
  // 2. Format that UTC instant in the target timezone to see the offset
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(asUtc);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const tzStr = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`;
  const tzAsUtc = new Date(tzStr);
  // 3. The offset is the difference between what UTC shows in the tz vs actual UTC
  const offsetMs = tzAsUtc.getTime() - asUtc.getTime();
  // 4. Subtract offset from the naive-UTC interpretation of the local time
  return new Date(asUtc.getTime() - offsetMs).toISOString();
}

/** Default timezone fallback if business.timezone is missing */
export const DEFAULT_TIMEZONE = "Africa/Nairobi";
