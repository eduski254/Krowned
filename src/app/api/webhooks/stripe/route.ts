import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmBooking } from "@/lib/booking/actions";

/**
 * Stripe webhook handler.
 *
 * Handles:
 * - checkout.session.completed (subscription + booking payment)
 * - customer.subscription.updated (plan changes, trial end)
 * - customer.subscription.deleted (cancellation → downgrade)
 * - account.updated (Connect onboarding status)
 * - payment_intent.succeeded (booking payment confirmation)
 */

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        // Unhandled event type — just acknowledge
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── Handlers ───────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const type = session.metadata?.type;

  if (type === "subscription" && session.subscription) {
    // Subscription was just created — the subscription.created event
    // handles the DB writes, but we can log here for tracing
    console.log(`[stripe-webhook] Subscription checkout completed: ${session.subscription}`);
  }

  if (type === "booking_payment") {
    // Payment for a booking — the payment_intent.succeeded event
    // handles confirmation, but as a safety net we confirm here too
    const bookingId = session.metadata?.booking_id;
    if (bookingId && session.payment_status === "paid") {
      await confirmBookingFromWebhook(bookingId, session.payment_intent as string);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const businessId = subscription.metadata?.business_id;
  const planId = subscription.metadata?.plan_id;
  const planTier = subscription.metadata?.plan_tier;

  if (!businessId) {
    console.warn("[stripe-webhook] Subscription missing business_id metadata");
    return;
  }

  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    unpaid: "past_due",
    paused: "past_due",
  };
  const status = statusMap[subscription.status] ?? "incomplete";

  // Upsert subscription record
  const subData = {
    business_id: businessId,
    stripe_subscription_id: subscription.id,
    status,
    seat_count: subscription.items.data[0]?.quantity ?? 1,
    current_period_end: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    ...(planId ? { plan_id: planId } : {}),
  };

  // Check for existing subscription
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("business_id", businessId)
    .single();

  if (existing) {
    await admin.from("subscriptions").update(subData).eq("business_id", businessId);
  } else {
    // Need plan_id for insert
    if (!planId) {
      // Resolve from stripe_price_id
      const priceId = subscription.items.data[0]?.price?.id;
      if (priceId) {
        const { data: plan } = await admin
          .from("plans")
          .select("id")
          .eq("stripe_price_id", priceId)
          .single();
        if (plan) {
          (subData as any).plan_id = plan.id;
        }
      }
    }
    await admin.from("subscriptions").insert(subData as any);
  }

  // Sync business-level fields
  const updateFields: Record<string, any> = {
    subscription_status: status,
  };

  // Resolve the plan — try metadata first, then fall back to stripe_price_id
  let resolvedPlanId = planId;
  if (!resolvedPlanId && planTier) {
    const { data: plan } = await admin
      .from("plans")
      .select("id")
      .eq("tier", planTier)
      .single();
    if (plan) resolvedPlanId = plan.id;
  }
  if (!resolvedPlanId) {
    // Resolve from the current subscription item's price (handles plan changes)
    const priceId = subscription.items.data[0]?.price?.id;
    if (priceId) {
      const { data: plan } = await admin
        .from("plans")
        .select("id")
        .eq("stripe_price_id", priceId)
        .single();
      if (plan) resolvedPlanId = plan.id;
    }
  }
  if (resolvedPlanId) {
    updateFields.plan_id = resolvedPlanId;
    // Also update subscription record's plan_id
    await admin
      .from("subscriptions")
      .update({ plan_id: resolvedPlanId })
      .eq("business_id", businessId);
  }

  await admin.from("businesses").update(updateFields).eq("id", businessId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const businessId = subscription.metadata?.business_id;

  if (!businessId) return;

  // Get the free plan
  const { data: freePlan } = await admin
    .from("plans")
    .select("id")
    .eq("tier", "free")
    .single();

  // Downgrade business to free
  await admin
    .from("businesses")
    .update({
      plan_id: freePlan?.id,
      subscription_status: "canceled",
    })
    .eq("id", businessId);

  // Update subscription record
  await admin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("business_id", businessId);

  // Deactivate excess staff (keep only owner's staff row if any)
  const { data: business } = await admin
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  if (business) {
    await admin
      .from("staff")
      .update({ status: "inactive" })
      .eq("business_id", businessId)
      .neq("user_id", business.owner_id);
  }

  console.log(`[stripe-webhook] Business ${businessId} downgraded to free`);
}

async function handleAccountUpdated(account: Stripe.Account) {
  const admin = createAdminClient();
  const businessId = account.metadata?.business_id;

  if (!businessId) {
    // Try to find by connect account ID
    const { data: business } = await admin
      .from("businesses")
      .select("id")
      .eq("stripe_connect_account_id", account.id)
      .single();
    if (!business) return;

    await admin
      .from("businesses")
      .update({ charges_enabled: account.charges_enabled ?? false })
      .eq("id", business.id);
    return;
  }

  await admin
    .from("businesses")
    .update({ charges_enabled: account.charges_enabled ?? false })
    .eq("id", businessId);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId || paymentIntent.metadata?.type !== "booking_payment") return;

  await confirmBookingFromWebhook(bookingId, paymentIntent.id);
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Confirm a booking and create a payment record after successful Stripe payment.
 * Idempotent — safe to call multiple times for the same booking.
 */
async function confirmBookingFromWebhook(bookingId: string, paymentIntentId: string) {
  const admin = createAdminClient();

  // Check if already confirmed (idempotent)
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, service_amount, platform_fee_amount, currency")
    .eq("id", bookingId)
    .single();

  if (!booking) return;
  if (booking.status === "confirmed") return; // Already confirmed

  if (booking.status !== "pending_hold") {
    console.warn(`[stripe-webhook] Booking ${bookingId} in unexpected status: ${booking.status}`);
    return;
  }

  // Confirm the booking
  const { error: updateErr } = await admin
    .from("bookings")
    .update({ status: "confirmed", hold_expires_at: null })
    .eq("id", bookingId);

  if (updateErr) {
    console.error(`[stripe-webhook] Failed to confirm booking ${bookingId}:`, updateErr);
    return;
  }

  // Create payment record
  await admin.from("payments").insert({
    booking_id: bookingId,
    amount: booking.service_amount ?? 0,
    application_fee_amount: booking.platform_fee_amount ?? 0,
    tip_amount: 0,
    currency: booking.currency ?? "usd",
    status: "succeeded",
    stripe_payment_intent_id: paymentIntentId,
  });

  // Send confirmation emails (fire-and-forget)
  try {
    const { sendBookingConfirmationEmails } = await import("@/lib/email/send-booking-emails");
    sendBookingConfirmationEmails({ bookingId }).catch(() => {});
  } catch {}

  console.log(`[stripe-webhook] Booking ${bookingId} confirmed via payment`);
}
