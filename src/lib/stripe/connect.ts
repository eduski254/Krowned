"use server";

/**
 * Stripe Connect — onboarding business owners to receive payments.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zawadibooking.vercel.app";

/**
 * Create or resume Stripe Connect onboarding for a business.
 * Returns the onboarding URL to redirect to.
 */
export async function createConnectOnboardingLink(): Promise<{
  url?: string;
  error?: string;
}> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, stripe_connect_account_id, name")
    .eq("owner_id", user.id)
    .single();

  if (!business) return { error: "No business found." };

  const stripe = getStripe();
  let accountId = business.stripe_connect_account_id;

  // Create Connect account if none exists
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      metadata: { business_id: business.id },
      business_profile: {
        name: business.name,
      },
    });
    accountId = account.id;
    await admin
      .from("businesses")
      .update({ stripe_connect_account_id: accountId })
      .eq("id", business.id);
  }

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${SITE_URL}/dashboard/business/settings?connect=refresh`,
    return_url: `${SITE_URL}/dashboard/business/settings?connect=success`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

/**
 * Check the status of a business's Connect account.
 */
export async function getConnectStatus(): Promise<{
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  error?: string;
}> {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { connected: false, chargesEnabled: false, payoutsEnabled: false, error: "Not authenticated." };

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, stripe_connect_account_id, charges_enabled")
    .eq("owner_id", user.id)
    .single();

  if (!business?.stripe_connect_account_id) {
    return { connected: false, chargesEnabled: false, payoutsEnabled: false };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(business.stripe_connect_account_id);

  // Sync charges_enabled if it changed
  if (account.charges_enabled !== business.charges_enabled) {
    await admin
      .from("businesses")
      .update({ charges_enabled: account.charges_enabled ?? false })
      .eq("id", business.id);
  }

  return {
    connected: true,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
  };
}
