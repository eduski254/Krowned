import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Essential email events — always sent, user cannot opt out.
 * These are transactional emails required for the service to function.
 */
const ESSENTIAL_EVENTS = new Set([
  "booking_confirmation",
  "booking_cancellation",
  "booking_reschedule",
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
