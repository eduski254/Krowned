"use server";

/**
 * Stripe payment for prepay bookings via Checkout Sessions.
 *
 * Flow:
 * 1. Client holds a slot (pending_hold, 10 min)
 * 2. This creates a Checkout Session for the service amount
 * 3. Client pays on Stripe-hosted page
 * 4. Webhook confirms the booking + creates payment record
 * 5. If payment fails / expires, hold expires automatically
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Create a Stripe Checkout Session for a held booking.
 * The booking must be in pending_hold status.
 */
export async function createBookingCheckout(bookingId: string): Promise<{
  url?: string;
  error?: string;
}> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(`
      id, client_id, business_id, service_id, staff_id, starts_at, ends_at,
      status, hold_expires_at, service_amount, platform_fee_amount, currency,
      payment_method,
      services(name, duration_minutes),
      businesses(name, stripe_connect_account_id, commission_rate),
      staff(display_name)
    `)
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Booking not found." };
  if (booking.client_id !== user.id) return { error: "Not your booking." };
  if (booking.status !== "pending_hold") return { error: "Booking is not in a payable state." };
  if (booking.payment_method !== "prepay") return { error: "This booking doesn't require online payment." };

  // Check hold hasn't expired
  if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
    await admin.from("bookings").delete().eq("id", bookingId);
    return { error: "Your hold expired. Please select a new time." };
  }

  const biz = booking.businesses as any;
  if (!biz?.stripe_connect_account_id) {
    return { error: "This business cannot accept online payments yet." };
  }

  const serviceName = (booking.services as any)?.name ?? "Service";
  const staffName = (booking.staff as any)?.display_name ?? "Staff";
  const serviceAmount = booking.service_amount ?? 0;
  const platformFee = booking.platform_fee_amount ?? 0;

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: booking.currency ?? "usd",
          unit_amount: serviceAmount,
          product_data: {
            name: serviceName,
            description: `with ${staffName} at ${biz.name}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: biz.stripe_connect_account_id,
      },
      metadata: {
        booking_id: bookingId,
        type: "booking_payment",
      },
    },
    customer_email: user.email ?? undefined,
    success_url: `${SITE_URL}/booking/success?booking_id=${bookingId}`,
    cancel_url: `${SITE_URL}/booking/cancelled?booking_id=${bookingId}`,
    expires_at: Math.floor(Date.now() / 1000) + 9 * 60, // 9 min (within hold window)
    metadata: {
      booking_id: bookingId,
      type: "booking_payment",
    },
  });

  return { url: session.url ?? undefined };
}
