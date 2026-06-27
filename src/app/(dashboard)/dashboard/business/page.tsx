import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Calendar,
  DollarSign,
  Users,
  Star,
  TrendingUp,
} from "lucide-react";

export default async function BusinessDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the user's business
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan_id, subscription_status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Business Dashboard
        </h1>
        <EmptyState
          icon={TrendingUp}
          title="No business yet"
          description="Create your business to start accepting bookings and managing your team."
          action={
            <a
              href="/dashboard/business/profile"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create Business
            </a>
          }
        />
      </div>
    );
  }

  // Fetch KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [bookingsRes, todayBookingsRes, staffRes, reviewsRes, earningsRes] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase
        .from("bookings")
        .select("id, starts_at, status, services(name), staff(display_name), clients:client_id(full_name)")
        .eq("business_id", business.id)
        .gte("starts_at", today.toISOString())
        .lt("starts_at", tomorrow.toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "active"),
      supabase
        .from("reviews")
        .select("id, rating", { count: "exact" })
        .eq("business_id", business.id),
      supabase
        .from("payments")
        .select("amount, booking_id, bookings!inner(business_id)")
        .eq("bookings.business_id", business.id)
        .eq("status", "succeeded"),
    ]);

  const totalBookings = bookingsRes.count ?? 0;
  const activeStaff = staffRes.count ?? 0;
  const totalReviews = reviewsRes.count ?? 0;
  const avgRating =
    reviewsRes.data && reviewsRes.data.length > 0
      ? (
          reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) /
          reviewsRes.data.length
        ).toFixed(1)
      : "—";
  const totalEarnings = earningsRes.data
    ? earningsRes.data.reduce((sum, p) => sum + (p.amount ?? 0), 0)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Business overview and today&apos;s schedule.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={totalBookings.toString()}
          icon={Calendar}
          href="/dashboard/business/calendar"
        />
        <StatCard
          label="Active Staff"
          value={activeStaff.toString()}
          icon={Users}
          href="/dashboard/business/staff"
        />
        <StatCard
          label="Avg Rating"
          value={avgRating}
          icon={Star}
          trend={`${totalReviews} reviews`}
          href="/dashboard/business/reviews"
        />
        <StatCard
          label="Total Earnings"
          value={`${(totalEarnings / 100).toFixed(2)}`}
          icon={DollarSign}
          href="/dashboard/business/earnings"
        />
      </div>

      {/* Today's schedule */}
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Today&apos;s Schedule
      </h2>
      {todayBookingsRes.data && todayBookingsRes.data.length > 0 ? (
        <div className="space-y-3">
          {todayBookingsRes.data.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium text-foreground">
                  {(b.services as unknown as { name: string } | null)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(b.staff as unknown as { display_name: string } | null)?.display_name ?? "Unassigned"}
                  {" — "}
                  {(b.clients as unknown as { full_name: string } | null)?.full_name ?? "Client"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {new Date(b.starts_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "confirmed"
                      ? "bg-success/10 text-success"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No bookings today"
          description="Your schedule for today is clear."
        />
      )}
    </div>
  );
}
