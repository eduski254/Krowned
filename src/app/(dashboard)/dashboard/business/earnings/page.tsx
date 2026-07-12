import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DollarSign, TrendingUp } from "lucide-react";
import {
  BusinessEarningsChart,
  BusinessBreakdownChart,
  type PaymentRow,
} from "@/components/dashboard/finance-charts";

export default async function BusinessEarningsPage() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  // Fetch succeeded payments for this business
  const { data: payments } = await admin
    .from("payments")
    .select("amount, tip_amount, application_fee_amount, currency, created_at, bookings!inner(business_id)")
    .eq("bookings.business_id", business.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });

  const rows: PaymentRow[] = (payments ?? []).map((p) => ({
    amount: p.amount ?? 0,
    tip_amount: p.tip_amount ?? 0,
    application_fee_amount: p.application_fee_amount ?? 0,
    created_at: p.created_at,
  }));

  const totalRevenue = rows.reduce((s, p) => s + p.amount, 0);
  const totalTips = rows.reduce((s, p) => s + p.tip_amount, 0);
  const totalFees = rows.reduce((s, p) => s + p.application_fee_amount, 0);
  const netEarnings = totalRevenue - totalFees;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Earnings</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`${(totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          label="Net Earnings"
          value={`${(netEarnings / 100).toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Tips Received"
          value={`${(totalTips / 100).toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          label="Platform Fees"
          value={`${(totalFees / 100).toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      {rows.length > 0 ? (
        <>
          <div className="mb-8">
            <BusinessEarningsChart payments={rows} />
          </div>

          <div className="mb-8">
            <BusinessBreakdownChart payments={rows} />
          </div>

          {/* // REVIEW: Payout history from payouts table + Stripe Connect dashboard link */}

          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Recent Payments
            </h2>
            <div className="space-y-3">
              {payments!.slice(0, 20).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {((p.amount ?? 0) / 100).toFixed(2)}{" "}
                    <span className="text-sm text-muted-foreground">
                      {p.currency?.toUpperCase()}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={DollarSign}
          title="No earnings yet"
          description="Earnings from completed bookings will appear here."
        />
      )}
    </div>
  );
}
