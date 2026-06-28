import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Essential email events — always sent, user cannot opt out.
 * Per spec: welcome, booking confirmation, reschedule, cancellation,
 * new-booking-to-owner, cancelled-by-client-to-owner, staff invite.
 */
const ESSENTIAL_EVENTS = new Set([
  "welcome",
  "booking_confirmation",
  "booking_cancellation",
  "booking_reschedule",
  "new_booking_owner",
  "booking_cancelled_owner",
  "staff_invitation",
]);

/**
 * Check if a user has opted in to email for a given event type.
 * Essential events always return true.
 * Optional events default to true (opt-out model).
 */
export async function shouldSendEmail(
  userId: string,
  eventType: string,
): Promise<boolean> {
  if (ESSENTIAL_EVENTS.has(eventType)) return true;

  const admin = createAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("email")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .maybeSingle();

  // Default to true (opt-out model) — if no row exists, they get emails
  return data?.email ?? true;
}

export function isEssentialEvent(eventType: string): boolean {
  return ESSENTIAL_EVENTS.has(eventType);
}
