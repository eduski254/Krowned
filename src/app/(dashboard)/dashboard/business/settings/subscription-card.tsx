"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  Zap,
  Crown,
  Building2,
  ArrowUpRight,
  Check,
  ArrowDown,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import { Spinner } from "@/components/spinner";
import {
  createSubscriptionCheckout,
  createCustomerPortal,
  changePlan,
} from "@/lib/stripe/subscription";

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

const TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const isActive =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const isTrial = subscriptionStatus === "trialing";
  const paidPlans = plans.filter((p) => p.tier !== "free");

  function handleSelectPlan(tier: string) {
    setError(null);
    setSuccessMsg(null);
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

  function handleChangePlan(tier: string) {
    setError(null);
    setSuccessMsg(null);
    setPendingTier(tier);
    startTransition(async () => {
      const result = await changePlan(tier);
      if (result.success) {
        setSuccessMsg(`Switched to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`);
        setShowPlanPicker(false);
        // Reload to reflect the new plan
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(result.error ?? "Failed to change plan.");
      }
      setPendingTier(null);
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

  function getChangeLabel(tier: string): {
    label: string;
    icon: React.ReactNode;
  } {
    const current = TIER_ORDER[currentTier] ?? 0;
    const target = TIER_ORDER[tier] ?? 0;
    if (target > current)
      return { label: "Upgrade", icon: <ArrowUp className="inline h-3.5 w-3.5" /> };
    return { label: "Downgrade", icon: <ArrowDown className="inline h-3.5 w-3.5" /> };
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
            <p className="mt-1 text-xs text-muted-foreground">
              Trial ends{" "}
              {new Date(trialEndsAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
          )}
          {isActive && currentTier !== "free" && (
            <p className="mt-1 text-xs text-muted-foreground">
              {seatCount} seat{seatCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Change Plan button — only for active paid subscribers */}
          {isActive && currentTier !== "free" && hasRealSubscription && (
            <button
              onClick={() => setShowPlanPicker(!showPlanPicker)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Change Plan
            </button>
          )}
          {/* Manage / Activate button */}
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
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {successMsg && (
        <p className="text-sm text-success flex items-center gap-1">
          <Check className="h-4 w-4" /> {successMsg}
        </p>
      )}

      {/* Plan picker for active subscribers wanting to change plan */}
      {showPlanPicker && hasRealSubscription && isActive && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Switch your plan. You&apos;ll be prorated automatically — charged or
            credited the difference for the rest of this billing cycle.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {paidPlans.map((plan) => {
              const isCurrent = plan.tier === currentTier;
              const change = getChangeLabel(plan.tier);
              return (
                <div
                  key={plan.tier}
                  className={`rounded-xl border p-4 transition-colors ${
                    isCurrent
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
                    <span className="text-sm font-normal text-muted-foreground">
                      /seat/mo
                    </span>
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {plan.features.max_staff != null && (
                      <li>Up to {plan.features.max_staff} staff</li>
                    )}
                    {plan.features.max_staff == null && (
                      <li>Unlimited staff</li>
                    )}
                    {plan.features.messaging && <li>In-app messaging</li>}
                    {plan.features.featured_eligible && (
                      <li>Featured placement</li>
                    )}
                  </ul>
                  {isCurrent ? (
                    <div className="mt-4 w-full rounded-lg bg-primary/10 px-3 py-2 text-center text-sm font-semibold text-primary">
                      <Check className="mr-1 inline h-3.5 w-3.5" /> Current
                      plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleChangePlan(plan.tier)}
                      disabled={isPending}
                      className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isPending && pendingTier === plan.tier ? (
                        <Spinner className="mx-auto h-4 w-4" />
                      ) : (
                        <>
                          {change.label} {change.icon}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan cards for new subscribers (free tier or no real Stripe subscription) */}
      {(currentTier === "free" || !hasRealSubscription) && !showPlanPicker && (
        <>
          {!hasRealSubscription && currentTier !== "free" && (
            <p className="text-sm text-muted-foreground">
              Your plan needs to be activated with a payment method. Choose a
              plan below to start your 14-day free trial.
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
                  <span className="text-sm font-normal text-muted-foreground">
                    /seat/mo
                  </span>
                </p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {plan.features.max_staff != null && (
                    <li>Up to {plan.features.max_staff} staff</li>
                  )}
                  {plan.features.max_staff == null && (
                    <li>Unlimited staff</li>
                  )}
                  {plan.features.messaging && <li>In-app messaging</li>}
                  {plan.features.featured_eligible && (
                    <li>Featured placement</li>
                  )}
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
                    <>
                      Start 14-day trial{" "}
                      <ArrowUpRight className="inline h-3.5 w-3.5" />
                    </>
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
