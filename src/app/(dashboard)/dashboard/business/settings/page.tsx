import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/effective-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { VisibilityToggle } from "./visibility-toggle";
import { HoursEditor } from "./hours-editor";
import { SubscriptionCard } from "./subscription-card";
import { ConnectCard } from "./connect-card";

export default async function BusinessSettingsPage() {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select(
      `id, name, default_payment_option, is_published,
       stripe_connect_account_id, charges_enabled,
       subscription_status, plan_id,
       plans(tier, name)`
    )
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  // Fetch all active plans for the pricing cards
  const { data: allPlans } = await admin
    .from("plans")
    .select("tier, name, per_seat_price, features")
    .eq("is_active", true)
    .order("per_seat_price");

  // Fetch subscription details
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("seat_count, cancel_at_period_end, trial_ends_at, status")
    .eq("business_id", business.id)
    .in("status", ["trialing", "active", "past_due"])
    .maybeSingle();

  const { data: hours } = await admin
    .from("business_hours")
    .select("day_of_week, open_time, close_time")
    .eq("business_id", business.id)
    .order("day_of_week");

  const currentTier = (business.plans as any)?.tier ?? "free";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground font-heading">
        Business Settings
      </h1>

      <div className="max-w-2xl space-y-6">
        {/* Subscription / Plan */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Subscription Plan
          </h2>
          <SubscriptionCard
            currentTier={currentTier}
            subscriptionStatus={business.subscription_status}
            seatCount={subscription?.seat_count ?? 1}
            cancelAtPeriodEnd={subscription?.cancel_at_period_end ?? false}
            trialEndsAt={subscription?.trial_ends_at ?? null}
            plans={(allPlans ?? []).map((p) => ({
              tier: p.tier,
              name: p.name,
              per_seat_price: p.per_seat_price,
              features: (p.features as Record<string, any>) ?? {},
            }))}
          />
        </div>

        {/* Stripe Connect */}
        {currentTier !== "free" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Online Payments
            </h2>
            <ConnectCard
              hasConnectAccount={!!business.stripe_connect_account_id}
              chargesEnabled={business.charges_enabled ?? false}
            />
          </div>
        )}

        {/* Visibility */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Directory Visibility
          </h2>
          <VisibilityToggle
            businessId={business.id}
            isPublished={business.is_published ?? false}
          />
        </div>

        {/* Payment option */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Default Payment Option
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current default: <strong>{business.default_payment_option ?? "Not set"}</strong>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Individual services can override this.
          </p>
        </div>

        {/* Business hours */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Business Hours
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Set your opening hours. Staff schedules and the booking engine
            use these as the outer boundary — slots are only available
            during these hours.
          </p>
          <HoursEditor businessId={business.id} initialHours={hours ?? []} />
        </div>
      </div>
    </div>
  );
}
