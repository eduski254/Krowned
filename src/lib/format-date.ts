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

/** Default timezone fallback if business.timezone is missing */
export const DEFAULT_TIMEZONE = "Africa/Nairobi";
