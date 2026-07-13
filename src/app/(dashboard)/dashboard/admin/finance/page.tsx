import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import {
  AdminRevenueChart,
  AdminBreakdownChart,
  AdminTransactionsChart,
  type PaymentRow,
} from "@/components/dashboard/finance-charts";
import {
  SubscriptionsByPlanChart,
  TopBusinessesChart,
  type PlanRow,
  type TopBusinessRow,
} from "@/components/dashboard/overview-charts";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [paymentsRes, subCountRes, subsData, paymentsWithBiz] =
    await Promise.all([
      admin
        .from("payments")
        .select(
          "amount, tip_amount, application_fee_amount, status, created_at",
        )
        .eq("status", "succeeded")
        .order("created_at", { ascending: true }),
      admin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "trialing"]),
      // Subscriptions by plan
      admin
        .from("subscriptions")
        .select("plan:plans(tier)")
        .in("status", ["active", "trialing"]),
      // Top businesses by GMV
      admin
        .from("payments")
        .select("amount, booking:bookings(business:businesses(name))")
        .eq("status", "succeeded"),
    ]);

  const rows: PaymentRow[] = (paymentsRes.data ?? []).map((p) => ({
    amount: p.amount ?? 0,
    tip_amount: p.tip_amount ?? 0,
    application_fee_amount: p.application_fee_amount ?? 0,
    created_at: p.created_at,
  }));

  const totalGMV = rows.reduce((s, p) => s + p.amount, 0);
  const totalFees = rows.reduce((s, p) => s + p.application_fee_amount, 0);
  const totalTips = rows.reduce((s, p) => s + p.tip_amount, 0);

  // Subscriptions by plan
  const planMap = new Map<string, number>();
  for (const sub of subsData.data ?? []) {
    const tier =
      (sub as any)?.plan?.tier ?? "free";
    const label = tier.charAt(0).toUpperCase() + tier.slice(1);
    planMap.set(label, (planMap.get(label) ?? 0) + 1);
  }
  const planData: PlanRow[] = Array.from(planMap.entries()).map(
    ([plan, count]) => ({ plan, count }),
  );

  // Top businesses by GMV
  const bizMap = new Map<string, number>();
  for (const p of paymentsWithBiz.data ?? []) {
    const name =
      (p as any)?.booking?.business?.name ?? "Unknown";
    bizMap.set(name, (bizMap.get(name) ?? 0) + ((p.amount as number) ?? 0));
  }
  const topBusinesses: TopBusinessRow[] = Array.from(bizMap.entries())
    .map(([name, revenue]) => ({ name, revenue: revenue / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Finance</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="GMV (Gross)"
          value={`${(totalGMV / 100).toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          label="Platform Fees"
          value={`${(totalFees / 100).toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Tips (pass-through)"
          value={`${(totalTips / 100).toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          label="Active Subscriptions"
          value={(subCountRes.count ?? 0).toString()}
          icon={CreditCard}
        />
      </div>

      <div className="mb-8">
        <AdminRevenueChart payments={rows} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <AdminBreakdownChart payments={rows} />
        <AdminTransactionsChart payments={rows} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionsByPlanChart data={planData} />
        <TopBusinessesChart data={topBusinesses} />
      </div>
    </div>
  );
}
