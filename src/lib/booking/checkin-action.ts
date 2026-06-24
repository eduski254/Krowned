"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const schema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * Mark a booking as checked in. Only the business owner or the assigned
 * staff member can perform this action.
 */
export async function checkInBooking(input: { bookingId: string }) {
  const { bookingId } = schema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Load the booking with its business owner
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, status, checked_in_at, business_id, staff_id, businesses(owner_id)")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { error: "Booking not found" };

  // Authorization: user must be the business owner OR the assigned staff member
  const biz = booking.businesses as unknown as { owner_id: string } | null;
  const isOwner = biz?.owner_id === user.id;

  let isAssignedStaff = false;
  if (booking.staff_id) {
    const { data: staff } = await supabase
      .from("staff")
      .select("user_id")
      .eq("id", booking.staff_id)
      .single();
    isAssignedStaff = staff?.user_id === user.id;
  }

  if (!isOwner && !isAssignedStaff) {
    return { error: "Only the business owner or assigned staff can check in a client" };
  }

  // Validate state
  if (booking.checked_in_at) {
    return { error: "Already checked in", checkedInAt: booking.checked_in_at };
  }

  if (booking.status !== "confirmed") {
    return { error: `Cannot check in a booking with status "${booking.status}"` };
  }

  // Perform check-in
  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("bookings")
    .update({ checked_in_at: now })
    .eq("id", bookingId);

  if (updateErr) return { error: updateErr.message };

  return { success: true, checkedInAt: now };
}
