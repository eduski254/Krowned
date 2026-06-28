"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendBookingCancellationEmails } from "@/lib/email/send-booking-emails";

export async function cancelBooking(
  bookingId: string,
): Promise<{ success: boolean; error?: string }> {
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: booking, error: fetchErr } = await admin
    .from("bookings")
    .select("id, client_id, business_id, status")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { success: false, error: "Booking not found." };

  // Determine who is cancelling
  let cancelledBy: "client" | "business";
  if (booking.client_id === user.id) {
    cancelledBy = "client";
  } else {
    // Check if user is the business owner
    const { data: biz } = await admin
      .from("businesses")
      .select("owner_id")
      .eq("id", booking.business_id)
      .single();
    if (biz?.owner_id === user.id) {
      cancelledBy = "business";
    } else {
      return { success: false, error: "Not authorized to cancel this booking." };
    }
  }

  if (!["confirmed", "pending_hold"].includes(booking.status)) {
    return { success: false, error: "This booking cannot be cancelled." };
  }

  const { error: updateErr } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateErr) return { success: false, error: "Failed to cancel booking." };

  // Fire-and-forget cancellation emails
  sendBookingCancellationEmails({ bookingId, cancelledBy }).catch(() => {});

  return { success: true };
}
