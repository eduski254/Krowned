import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";

/**
 * Get the current user's business using the admin client (bypasses RLS).
 * Auth is verified via getEffectiveUserId() which checks the session.
 *
 * Returns { userId, business } or { userId: null, business: null } if not authenticated.
 */
export async function getAuthedBusiness() {
  const userId = await getEffectiveUserId();
  if (!userId) return { userId: null, business: null };

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, name, slug, plan_id, subscription_status, onboarding_completed_at, timezone, commission_rate, charges_enabled, stripe_connect_account_id, stripe_billing_customer_id, owner_id, primary_category_id, verification_status, is_published")
    .eq("owner_id", userId)
    .maybeSingle();

  return { userId, business };
}
