import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, Building2, Calendar, DollarSign } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  const [usersRes, businessesRes, bookingsRes, paymentsRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase
        .from("payments")
        .select("application_fee_amount")
        .eq("status", "succeeded"),
    ]);

  const totalUsers = usersRes.count ?? 0;
  const totalBusinesses = businessesRes.count ?? 0;
  const totalBookings = bookingsRes.count ?? 0;
  const platformRevenue =
    paymentsRes.data?.reduce(
      (s, p) => s + (p.application_fee_amount ?? 0),
      0,
    ) ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Platform Overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Admin dashboard — platform-wide metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={totalUsers.toString()}
          icon={Users}
        />
        <StatCard
          label="Businesses"
          value={totalBusinesses.toString()}
          icon={Building2}
        />
        <StatCard
          label="Total Bookings"
          value={totalBookings.toString()}
          icon={Calendar}
        />
        <StatCard
          label="Platform Revenue"
          value={`${(platformRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
          trend="From application fees"
        />
      </div>
    </div>
  );
}
