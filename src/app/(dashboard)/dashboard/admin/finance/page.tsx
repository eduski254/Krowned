import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";

export default async function AdminFinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, tip_amount, application_fee_amount, status")
    .eq("status", "succeeded");

  const totalGMV = payments?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const totalFees =
    payments?.reduce((s, p) => s + (p.application_fee_amount ?? 0), 0) ?? 0;
  const totalTips = payments?.reduce((s, p) => s + (p.tip_amount ?? 0), 0) ?? 0;

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
    </div>
  );
}
