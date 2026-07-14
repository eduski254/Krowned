import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error(
      "[stripe] STRIPE_SECRET_KEY is missing or empty. " +
        "Stripe features are disabled. Add it to your environment variables.",
    );
    return false;
  }
  return true;
}
