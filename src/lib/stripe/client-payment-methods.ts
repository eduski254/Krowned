"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/**
 * Get or create a Stripe Customer for the authenticated client.
 * Stores the customer ID in profiles.stripe_customer_id.
 */
async function getOrCreateCustomer(userId: string): Promise<string | null> {
  if (!isStripeConfigured()) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, full_name, email")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create a new Stripe customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: profile.email ?? undefined,
    name: profile.full_name ?? undefined,
    metadata: { user_id: userId },
  });

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

/**
 * List saved payment methods for the authenticated client.
 */
export async function listPaymentMethods(): Promise<{
  cards: SavedCard[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { cards: [], error: "Not authenticated." };

  if (!isStripeConfigured()) return { cards: [], error: "Payments not configured." };

  const customerId = await getOrCreateCustomer(user.id);
  if (!customerId) return { cards: [], error: "Could not create payment profile." };

  const stripe = getStripe();

  const [methods, customer] = await Promise.all([
    stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    }),
    stripe.customers.retrieve(customerId),
  ]);

  const defaultPmId =
    typeof customer !== "string" && !customer.deleted
      ? (customer.invoice_settings?.default_payment_method as string | null)
      : null;

  const cards: SavedCard[] = methods.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand ?? "unknown",
    last4: pm.card?.last4 ?? "****",
    expMonth: pm.card?.exp_month ?? 0,
    expYear: pm.card?.exp_year ?? 0,
    isDefault: pm.id === defaultPmId,
  }));

  return { cards };
}

/**
 * Create a SetupIntent so the client can add a new card.
 * Returns the client_secret for Stripe.js.
 */
export async function createSetupIntent(): Promise<{
  clientSecret?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (!isStripeConfigured()) return { error: "Payments not configured." };

  const customerId = await getOrCreateCustomer(user.id);
  if (!customerId) return { error: "Could not create payment profile." };

  const stripe = getStripe();
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });

  return { clientSecret: setupIntent.client_secret ?? undefined };
}

/**
 * Remove a saved payment method.
 */
export async function removePaymentMethod(
  paymentMethodId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (!isStripeConfigured()) return { success: false, error: "Payments not configured." };

  const customerId = await getOrCreateCustomer(user.id);
  if (!customerId) return { success: false, error: "Could not find payment profile." };

  const stripe = getStripe();

  // Verify the payment method belongs to this customer
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== customerId) {
    return { success: false, error: "Payment method not found." };
  }

  await stripe.paymentMethods.detach(paymentMethodId);
  return { success: true };
}

/**
 * Set a payment method as the default for this customer.
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (!isStripeConfigured()) return { success: false, error: "Payments not configured." };

  const customerId = await getOrCreateCustomer(user.id);
  if (!customerId) return { success: false, error: "Could not find payment profile." };

  const stripe = getStripe();

  // Verify ownership
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== customerId) {
    return { success: false, error: "Payment method not found." };
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  return { success: true };
}
