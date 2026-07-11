"use client";

import { useState, useTransition } from "react";
import { CreditCard, Zap, Crown, Building2, ArrowUpRight } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { createSubscriptionCheckout, createCustomerPortal } from "@/lib/stripe/subscription";

interface Plan {
  tier: string;
  name: string;
  per_seat_price: number;
  features: Record<string, any>;
}

interface Props {
  currentTier: string;
  subscriptionStatus: string | null;
  hasRealSubscription: boolean;
  seatCount: number;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  plans: Plan[];
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
  enterprise: <Building2 className="h-5 w-5" />,
};

export function SubscriptionCard({
  currentTier,
  subscriptionStatus,
  hasRealSubscription,
  seatCount,
  cancelAtPeriodEnd,
  trialEndsAt,
  plans,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingTier, setPendingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const isTrial = subscriptionStatus === "trialing";
  const paidPlans = plans.filter((p) => p.tier !== "free");

  function handleSelectPlan(tier: string) {
    setError(null);
    setPendingTier(tier);
    startTransition(async () => {
      const result = await createSubscriptionCheckout(tier);
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? "Failed to start checkout.");
        setPendingTier(null);
      }
    });
  }

  function handleManage() {
    setError(null);
    setPendingTier("manage");
    startTransition(async () => {
      const result = await createCustomerPortal();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? "Failed to open portal.");
        setPendingTier(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Current plan status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground capitalize">
              {currentTier} Plan
            </span>
            {isActive && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                {isTrial ? "Trial" : "Active"}
              </span>
            )}
            {subscriptionStatus === "past_due" && (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                Past Due
              </span>
            )}
            {cancelAtPeriodEnd && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Cancelling
              </span>
            )}
          </div>
          {isTrial && trialEndsAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Trial ends {new Date(trialEndsAt).toLocaleDateString()}
            </p>
          )}
          {isActive && currentTier !== "free" && (
            <p className="text-xs text-muted-foreground mt-1">
              {seatCount} seat{seatCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {isActive && currentTier !== "free" && (
          <button
            onClick={handleManage}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isPending && pendingTier === "manage" ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            {hasRealSubscription ? "Manage" : "Activate Subscription"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Plan cards (show when on free or when no real Stripe subscription) */}
      {(currentTier === "free" || !hasRealSubscription) && (
        <>
        {!hasRealSubscription && currentTier !== "free" && (
          <p className="text-sm text-muted-foreground">
            Your plan needs to be activated with a payment method. Choose a plan below to start your 14-day free trial.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {paidPlans.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-xl border p-4 transition-colors ${
                plan.tier === "pro"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-2 text-foreground">
                {TIER_ICONS[plan.tier]}
                <span className="font-semibold">{plan.name}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">
                ${(plan.per_seat_price / 100).toFixed(0)}
                <span className="text-sm font-normal text-muted-foreground">/seat/mo</span>
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {plan.features.max_staff != null && (
                  <li>Up to {plan.features.max_staff} staff</li>
                )}
                {plan.features.max_staff == null && (
                  <li>Unlimited staff</li>
                )}
                {plan.features.messaging && <li>In-app messaging</li>}
                {plan.features.featured_eligible && <li>Featured placement</li>}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan.tier)}
                disabled={isPending}
                className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  plan.tier === "pro"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                }`}
              >
                {isPending && pendingTier === plan.tier ? (
                  <Spinner className="mx-auto h-4 w-4" />
                ) : (
                  <>Start 14-day trial <ArrowUpRight className="inline h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
