"use server";

/**
 * Server actions for booking creation.
 *
 * All booking writes go through trusted server-side code using the
 * service-role client. The double-booking guard is in the Postgres
 * function reserve_booking_slot().
 */

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "./availability";

// ── Zod schemas ─────────────────────────────────────────────────────

const holdBookingSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable().optional(),
  /** UTC ISO string of the slot start */
  slotStart: z.string().datetime(),
  source: z.enum(["marketplace", "direct_link", "manual"]),
  paymentMethod: z.enum(["prepay", "pay_at_store"]),
  clientNote: z.string().max(500).trim().optional().default(""),
});

export type HoldBookingInput = z.infer<typeof holdBookingSchema>;

export interface HoldBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Hold a booking slot for 10 minutes while the client completes checkout.
 * Creates a booking with status 'pending_hold'.
 *
 * REVIEW: After this, the payment step should:
 *   1. Create a Stripe PaymentIntent (if prepay)
 *   2. On success, flip status pending_hold → confirmed
 *   3. On failure/timeout, the hold expires and the slot is released
 *   For pay_at_store bookings, flip directly to 'confirmed' after this hold.
 */
export async function holdBookingSlot(
  input: HoldBookingInput,
): Promise<HoldBookingResult> {
  // 1. Validate input
  const parsed = holdBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // 2. Authenticate the client
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to book." };
  }

  const admin = createAdminClient();

  // 3. Fetch business + service details
  const [bizResult, svcResult] = await Promise.all([
    admin
      .from("businesses")
      .select("id, timezone, commission_rate, plan_id, subscription_status, charges_enabled, plans(tier)")
      .eq("id", data.businessId)
      .single(),
    admin
      .from("services")
      .select("id, duration_minutes, price_amount, currency, payment_option, business_id")
      .eq("id", data.serviceId)
      .eq("is_active", true)
      .single(),
  ]);

  if (bizResult.error || !bizResult.data) {
    return { success: false, error: "Business not found." };
  }
  if (svcResult.error || !svcResult.data) {
    return { success: false, error: "Service not found or inactive." };
  }

  const biz = bizResult.data;
  const service = svcResult.data;

  // Verify service belongs to this business
  if (service.business_id !== biz.id) {
    return { success: false, error: "Service does not belong to this business." };
  }

  // 4. Gate checks
  const plan = biz.plans as unknown as { tier: string } | null;
  if (plan?.tier !== "premium" || !["trialing", "active"].includes(biz.subscription_status ?? "")) {
    return { success: false, error: "This business is not currently accepting bookings." };
  }

  // Payment method gate
  if (data.paymentMethod === "prepay" && !biz.charges_enabled) {
    return { success: false, error: "Online payment is not available for this business. Please choose pay at store." };
  }

  // Service payment option gate
  if (service.payment_option === "prepay" && data.paymentMethod !== "prepay") {
    return { success: false, error: "This service requires online prepayment." };
  }
  if (service.payment_option === "pay_at_store" && data.paymentMethod !== "pay_at_store") {
    return { success: false, error: "This service requires payment at store." };
  }

  // 5. Compute the slot end time
  const slotStartDate = new Date(data.slotStart);
  const slotEndDate = new Date(slotStartDate.getTime() + service.duration_minutes * 60_000);

  // 6. Lead time check (1 hour)
  const now = new Date();
  const earliest = new Date(now.getTime() + 60 * 60_000);
  if (slotStartDate < earliest) {
    return { success: false, error: "Bookings must be at least 1 hour from now." };
  }

  // 7. Window check (60 days)
  const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60_000);
  if (slotStartDate > maxDate) {
    return { success: false, error: "Cannot book more than 60 days ahead." };
  }

  // 8. Resolve staff
  let staffId = data.staffId;
  let staffChosen = !!data.staffId;

  if (!staffId) {
    // Auto-assign: re-check availability and pick lightest-loaded
    const dateStr = formatDateInTz(slotStartDate, biz.timezone);
    const availability = await getAvailableSlots(admin, {
      businessId: data.businessId,
      serviceId: data.serviceId,
      date: dateStr,
    });

    const matchingSlot = availability.slots.find((s) => s.start === data.slotStart);
    if (!matchingSlot) {
      return { success: false, error: "This slot is no longer available." };
    }
    staffId = matchingSlot.staffId;
    staffChosen = false;
  }

  // 9. Calculate fees
  const serviceAmount = service.price_amount;
  const platformFee = Math.round(serviceAmount * (biz.commission_rate as number));

  // 10. Call the Postgres reserve function (atomic double-booking guard)
  const { data: bookingId, error: reserveErr } = await admin.rpc(
    "reserve_booking_slot",
    {
      p_client_id: user.id,
      p_business_id: biz.id,
      p_service_id: service.id,
      p_staff_id: staffId,
      p_staff_chosen: staffChosen,
      p_source: data.source,
      p_starts_at: slotStartDate.toISOString(),
      p_ends_at: slotEndDate.toISOString(),
      p_payment_method: data.paymentMethod,
      p_service_amount: serviceAmount,
      p_platform_fee: platformFee,
      p_currency: service.currency,
      p_client_note: data.clientNote || null,
      p_hold_minutes: 10,
    },
  );

  if (reserveErr) {
    if (reserveErr.message?.includes("SLOT_TAKEN")) {
      return { success: false, error: "This time slot was just taken. Please choose another." };
    }
    return { success: false, error: "Booking failed. Please try again." };
  }

  return { success: true, bookingId: bookingId as string };
}

/**
 * Confirm a held booking (flip pending_hold → confirmed).
 *
 * REVIEW: In the Stripe phase, this should be called AFTER successful payment.
 * For pay-at-store bookings, call this immediately after holdBookingSlot.
 */
export async function confirmBooking(
  bookingId: string,
): Promise<{ success: boolean; error?: string }> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: booking, error: fetchErr } = await admin
    .from("bookings")
    .select("id, client_id, status, hold_expires_at")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { success: false, error: "Booking not found." };
  if (booking.client_id !== user.id) return { success: false, error: "Not your booking." };
  if (booking.status !== "pending_hold") {
    return { success: false, error: "Booking is not in a holdable state." };
  }

  // Check if hold has expired
  if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
    // Clean up the expired hold
    await admin.from("bookings").delete().eq("id", bookingId);
    return { success: false, error: "Your hold expired. Please select a new time." };
  }

  const { error: updateErr } = await admin
    .from("bookings")
    .update({ status: "confirmed", hold_expires_at: null })
    .eq("id", bookingId);

  if (updateErr) return { success: false, error: "Failed to confirm booking." };

  return { success: true };
}

/**
 * Release expired holds. Called opportunistically or by a cron.
 * Returns the number of expired holds cleaned up.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .delete()
    .eq("status", "pending_hold")
    .lt("hold_expires_at", new Date().toISOString())
    .select("id");

  if (error) return 0;
  return data?.length ?? 0;
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatDateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
