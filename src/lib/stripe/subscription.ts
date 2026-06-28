"use server";

/**
 * Stripe Billing — subscription checkout + portal for business owners.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Create a Stripe Checkout Session for a plan subscription.
 * Returns the checkout URL to redirect to.
 */
export async function createSubscriptionCheckout(planTier: string): Promise<{
  url?: string;
  error?: string;
}> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Find the business owned by this user
  const { data: business } = await admin
    .from("businesses")
    .select("id, stripe_billing_customer_id, plan_id, plans(tier)")
    .eq("owner_id", user.id)
    .single();

  if (!business) return { error: "No business found." };

  const currentTier = (business.plans as any)?.tier;
  if (currentTier === planTier) return { error: "You are already on this plan." };

  // Fetch target plan
  const { data: plan } = await admin
    .from("plans")
    .select("id, tier, stripe_price_id, name")
    .eq("tier", planTier)
    .eq("is_active", true)
    .single();

  if (!plan || !plan.stripe_price_id) {
    return { error: "Plan not available." };
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  let customerId = business.stripe_billing_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { business_id: business.id, supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("businesses")
      .update({ stripe_billing_customer_id: customerId })
      .eq("id", business.id);
  }

  // Count active staff for seat-based pricing
  const { count: seatCount } = await admin
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "active");

  // If already subscribed, use the portal for plan changes
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("business_id", business.id)
    .in("status", ["active", "trialing", "past_due"])
    .single();

  if (existingSub?.stripe_subscription_id) {
    // Use customer portal for upgrades/downgrades
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/dashboard/business/settings`,
    });
    return { url: session.url };
  }

  // New subscription checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: plan.stripe_price_id,
        quantity: Math.max(seatCount ?? 1, 1),
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        business_id: business.id,
        plan_id: plan.id,
        plan_tier: plan.tier,
      },
    },
    success_url: `${SITE_URL}/dashboard/business/settings?subscription=success`,
    cancel_url: `${SITE_URL}/dashboard/business/settings?subscription=cancelled`,
    metadata: {
      business_id: business.id,
      plan_id: plan.id,
      type: "subscription",
    },
  });

  return { url: session.url ?? undefined };
}

/**
 * Create a Stripe Customer Portal session for managing the subscription.
 */
export async function createCustomerPortal(): Promise<{
  url?: string;
  error?: string;
}> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, stripe_billing_customer_id")
    .eq("owner_id", user.id)
    .single();

  if (!business?.stripe_billing_customer_id) {
    return { error: "No billing account found." };
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_billing_customer_id,
    return_url: `${SITE_URL}/dashboard/business/settings`,
  });

  return { url: session.url };
}
