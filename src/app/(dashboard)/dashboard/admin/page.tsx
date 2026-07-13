import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, Building2, Calendar, DollarSign } from "lucide-react";
import {
  SignupsChart,
  BookingsChart,
  CategoryChart,
  TopCitiesChart,
  type SignupRow,
  type BookingDayRow,
  type CategoryRow,
  type CityRow,
} from "@/components/dashboard/overview-charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "super_admin") redirect("/dashboard");

  const admin = createAdminClient();

  // Stat card counts + chart data in parallel
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const [
    usersRes,
    businessesRes,
    bookingsRes,
    paymentsRes,
    recentProfiles,
    recentBusinesses,
    recentBookings,
    bookingServices,
    allBusinesses,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("businesses").select("id", { count: "exact", head: true }),
    admin.from("bookings").select("id", { count: "exact", head: true }),
    admin
      .from("payments")
      .select("application_fee_amount")
      .eq("status", "succeeded"),
    // Signups last 30 days
    admin
      .from("profiles")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at"),
    admin
      .from("businesses")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at"),
    // Bookings last 30 days
    admin
      .from("bookings")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at"),
    // Bookings by category (via services)
    admin
      .from("bookings")
      .select("service:services(category:categories(name))"),
    // Top cities
    admin.from("businesses").select("city"),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const totalBusinesses = businessesRes.count ?? 0;
  const totalBookings = bookingsRes.count ?? 0;
  const platformRevenue =
    paymentsRes.data?.reduce(
      (s, p) => s + (p.application_fee_amount ?? 0),
      0,
    ) ?? 0;

  // Build signups by day
  const signupMap = new Map<string, { users: number; businesses: number }>();
  for (let d = 0; d < 30; d++) {
    const dt = new Date(thirtyDaysAgo);
    dt.setDate(dt.getDate() + d);
    const key = dt.toISOString().slice(5, 10); // MM-DD
    signupMap.set(key, { users: 0, businesses: 0 });
  }
  for (const p of recentProfiles.data ?? []) {
    const key = p.created_at.slice(5, 10);
    const entry = signupMap.get(key);
    if (entry) entry.users++;
  }
  for (const b of recentBusinesses.data ?? []) {
    const key = b.created_at.slice(5, 10);
    const entry = signupMap.get(key);
    if (entry) entry.businesses++;
  }
  const signupsData: SignupRow[] = Array.from(signupMap.entries()).map(
    ([date, v]) => ({ date, ...v }),
  );

  // Build bookings by day
  const bookingMap = new Map<string, number>();
  for (let d = 0; d < 30; d++) {
    const dt = new Date(thirtyDaysAgo);
    dt.setDate(dt.getDate() + d);
    const key = dt.toISOString().slice(5, 10);
    bookingMap.set(key, 0);
  }
  for (const b of recentBookings.data ?? []) {
    const key = b.created_at.slice(5, 10);
    if (bookingMap.has(key)) bookingMap.set(key, bookingMap.get(key)! + 1);
  }
  const bookingsData: BookingDayRow[] = Array.from(bookingMap.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  // Build bookings by category
  const catMap = new Map<string, number>();
  for (const row of bookingServices.data ?? []) {
    const name =
      (row as any)?.service?.category?.name ?? "Uncategorized";
    catMap.set(name, (catMap.get(name) ?? 0) + 1);
  }
  const categoryData: CategoryRow[] = Array.from(catMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Build top cities
  const cityMap = new Map<string, number>();
  for (const b of allBusinesses.data ?? []) {
    const city = (b.city as string) || "Unknown";
    cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
  }
  const cityData: CityRow[] = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts row 1 */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <SignupsChart data={signupsData} />
        <BookingsChart data={bookingsData} />
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryChart data={categoryData} />
        <TopCitiesChart data={cityData} />
      </div>
    </div>
  );
}
