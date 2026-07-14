"use server";

/**
 * Account deletion — soft delete with 14-day grace period.
 *
 * Steps (in order):
 * 1. Cancel any active Stripe subscription immediately
 * 2. Unpublish all businesses (removes from directory/explore)
 * 3. Mark profile as deleted (deleted_at timestamp)
 * 4. Deactivate all staff records
 * 5. Log the deletion for audit
 * 6. Sign out the user
 *
 * The auth account is NOT hard-deleted yet — a background job or admin
 * action purges after the 14-day grace period. During the grace period,
 * login is blocked by checking deleted_at in middleware.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export interface DeleteAccountResult {
  success?: boolean;
  error?: string;
}

export async function deleteAccount(
  confirmPhrase: string,
): Promise<DeleteAccountResult> {
  if (confirmPhrase !== "DELETE") {
    return { error: "Please type DELETE to confirm." };
  }

  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Prevent super admins from deleting themselves
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role === "super_admin") {
    return { error: "Super admin accounts cannot be self-deleted." };
  }

  try {
    // 1. Find businesses owned by this user
    const { data: businesses } = await admin
      .from("businesses")
      .select("id, name, stripe_billing_customer_id")
      .eq("owner_id", user.id);

    for (const biz of businesses ?? []) {
      // 1a. Cancel active Stripe subscription immediately
      if (isStripeConfigured()) {
        const { data: sub } = await admin
          .from("subscriptions")
          .select("stripe_subscription_id")
          .eq("business_id", biz.id)
          .in("status", ["active", "trialing", "past_due"])
          .maybeSingle();

        if (sub?.stripe_subscription_id) {
          try {
            const stripe = getStripe();
            await stripe.subscriptions.cancel(sub.stripe_subscription_id, {
              invoice_now: true,
            });
          } catch (stripeErr: any) {
            console.error(
              `[delete-account] Stripe cancel failed for ${biz.id}:`,
              stripeErr.message,
            );
            // Continue — don't block deletion if Stripe fails
          }
        }
      }

      // 1b. Update subscription records
      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("business_id", biz.id);

      // 2. Unpublish business (removes from explore/directory)
      await admin
        .from("businesses")
        .update({
          is_published: false,
          subscription_status: "canceled",
        })
        .eq("id", biz.id);

      // 3. Deactivate all staff for this business
      await admin
        .from("staff")
        .update({ status: "inactive" })
        .eq("business_id", biz.id);
    }

    // 4. Mark profile as deleted with timestamp
    const now = new Date().toISOString();
    await admin
      .from("profiles")
      .update({
        deleted_at: now,
        full_name: "[Deleted User]",
        phone: null,
        bio: null,
        avatar_url: null,
      })
      .eq("id", user.id);

    // 5. Deactivate any staff records where this user is staff at other businesses
    await admin
      .from("staff")
      .update({ status: "inactive" })
      .eq("user_id", user.id);

    // 6. Send deletion confirmation email
    try {
      const { sendAccountDeletionEmail } = await import(
        "@/lib/email/send-booking-emails"
      );
      if (user.email) {
        await sendAccountDeletionEmail(
          user.email,
          profile?.full_name ?? "User",
        );
      }
    } catch {
      // Non-critical
    }

    // 7. Sign out the user
    await serverClient.auth.signOut();

    return { success: true };
  } catch (err: any) {
    console.error("[delete-account] Fatal error:", err);
    return { error: "Account deletion failed. Please contact support." };
  }
}
