import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function BusinessPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, stripe_connect_account_id, charges_enabled, payouts_enabled, stripe_billing_customer_id, subscription_status",
    )
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Payments Setup
      </h1>

      <div className="max-w-xl space-y-6">
        {/* Stripe Connect — receiving payments */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Receive Payments (Stripe Connect)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your Stripe account to accept online payments from clients.
          </p>
          <div className="mt-4">
            {business.stripe_connect_account_id ? (
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    business.charges_enabled
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {business.charges_enabled ? "Active" : "Pending verification"}
                </span>
                {/* // REVIEW: Link to Stripe Connect dashboard or onboarding refresh */}
              </div>
            ) : (
              <button
                disabled
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-50"
              >
                {/* // REVIEW: Stripe Connect onboarding flow needed here */}
                Connect Stripe Account
              </button>
            )}
          </div>
        </div>

        {/* Stripe Billing — subscription */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Subscription (Stripe Billing)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Zawadi Pro subscription for the booking engine and premium features.
          </p>
          <div className="mt-4">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                business.subscription_status === "active" || business.subscription_status === "trialing"
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {business.subscription_status ?? "Free plan"}
            </span>
            {/* // REVIEW: Stripe Billing portal / upgrade flow */}
          </div>
        </div>
      </div>
    </div>
  );
}
