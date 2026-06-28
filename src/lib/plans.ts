/**
 * Plan tier helpers.
 * All paid tiers (starter, pro, enterprise) unlock the booking engine.
 * The "free" tier is directory-only, not bookable.
 */

const PAID_TIERS = new Set(["starter", "pro", "enterprise"]);

/** Returns true if the tier unlocks the booking engine (any paid plan). */
export function isPaidTier(tier: string | null | undefined): boolean {
  return !!tier && PAID_TIERS.has(tier);
}

/** Returns true if the business is bookable (paid tier + active/trialing subscription). */
export function isBookable(
  tier: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): boolean {
  return (
    isPaidTier(tier) &&
    ["trialing", "active"].includes(subscriptionStatus ?? "")
  );
}
