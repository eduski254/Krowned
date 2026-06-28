"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendBookingRescheduleEmail } from "@/lib/email/send-booking-emails";

const rescheduleSchema = z.object({
  bookingId: z.string().uuid(),
  newStartsAt: z.string().datetime(),
});

export async function rescheduleBooking(
  input: z.infer<typeof rescheduleSchema>,
): Promise<{ success: boolean; error?: string }> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();
  const { bookingId, newStartsAt } = parsed.data;

  // Fetch booking + verify ownership
  const { data: booking } = await admin
    .from("bookings")
    .select(
      `id, client_id, business_id, staff_id, starts_at, ends_at, status,
       services(duration_minutes),
       businesses(owner_id)`,
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return { success: false, error: "Booking not found." };

  // Only the business owner can reschedule
  const ownerId = (booking.businesses as any)?.owner_id;
  if (ownerId !== user.id) {
    return { success: false, error: "Only the business owner can reschedule bookings." };
  }

  if (booking.status !== "confirmed") {
    return { success: false, error: "Only confirmed bookings can be rescheduled." };
  }

  const oldStartsAt = new Date(booking.starts_at);
  const newStart = new Date(newStartsAt);
  const durationMs =
    ((booking.services as any)?.duration_minutes ?? 60) * 60_000;
  const newEnd = new Date(newStart.getTime() + durationMs);

  // Prevent rescheduling to the past
  if (newStart < new Date()) {
    return { success: false, error: "Cannot reschedule to a time in the past." };
  }

  // Check for conflicting bookings for the same staff
  if (booking.staff_id) {
    const { data: conflicts } = await admin
      .from("bookings")
      .select("id")
      .eq("staff_id", booking.staff_id)
      .neq("id", bookingId)
      .in("status", ["confirmed", "pending_hold"])
      .lt("starts_at", newEnd.toISOString())
      .gt("ends_at", newStart.toISOString())
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: "The new time conflicts with another booking." };
    }
  }

  const { error: updateErr } = await admin
    .from("bookings")
    .update({
      starts_at: newStart.toISOString(),
      ends_at: newEnd.toISOString(),
    })
    .eq("id", bookingId);

  if (updateErr) return { success: false, error: "Failed to reschedule booking." };

  // Fire-and-forget reschedule email to client
  sendBookingRescheduleEmail({ bookingId, oldStartsAt }).catch(() => {});

  return { success: true };
}
