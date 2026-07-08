import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import {
  AdminRevenueChart,
  AdminBreakdownChart,
  AdminTransactionsChart,
  type PaymentRow,
} from "@/components/dashboard/finance-charts";

export default async function AdminFinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, tip_amount, application_fee_amount, status, created_at")
    .eq("status", "succeeded")
    .order("created_at", { ascending: true });

  const rows: PaymentRow[] = (payments ?? []).map((p) => ({
    amount: p.amount ?? 0,
    tip_amount: p.tip_amount ?? 0,
    application_fee_amount: p.application_fee_amount ?? 0,
    created_at: p.created_at,
  }));

  const totalGMV = rows.reduce((s, p) => s + p.amount, 0);
  const totalFees = rows.reduce((s, p) => s + p.application_fee_amount, 0);
  const totalTips = rows.reduce((s, p) => s + p.tip_amount, 0);

  const { count: activeSubCount } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "trialing"]);

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
          value={(activeSubCount ?? 0).toString()}
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
    </div>
  );
}
