import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Calendar,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";
import { DEFAULT_TIMEZONE } from "@/lib/format-date";
import { TodaysSchedule } from "./todays-schedule";
import {
  RevenueTrendChart,
  ServiceBreakdownChart,
  BookingSourceChart,
  WeeklyBookingsChart,
  type MonthlyRevenueRow,
  type ServiceBreakdownRow,
  type SourceRow,
  type WeeklyBookingRow,
} from "@/components/dashboard/business-overview-charts";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function pctChange(current: number, previous: number): string | undefined {
  if (previous === 0) return current > 0 ? "+100%" : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return undefined;
  return `${pct > 0 ? "+" : ""}${pct}% vs last period`;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

function weekLabel(dateStr: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function BusinessDashboardPage() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select(
      "id, name, plan_id, subscription_status, onboarding_completed_at, timezone",
    )
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (business && !business.onboarding_completed_at) {
    redirect("/dashboard/business/onboarding");
  }

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

  // ── Data fetches (parallel) ────────────────────────────────────────
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Period boundaries for comparison
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const [
    totalBookingsRes,
    todayBookingsRes,
    staffRes,
    reviewsRes,
    earningsRes,
    // 30-day current period
    currentPeriodBookingsRes,
    currentPeriodEarningsRes,
    // 30-day previous period
    prevPeriodBookingsRes,
    prevPeriodEarningsRes,
    // Revenue trend (6 months)
    revenueTrendRes,
    // Service breakdown
    serviceBreakdownRes,
    // Source breakdown
    sourceRes,
    // Weekly bookings (8 weeks)
    weeklyBookingsRes,
    // Recent activity
    recentBookingsRes,
    recentReviewsRes,
  ] = await Promise.all([
    // Total bookings
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    // Today's bookings
    admin
      .from("bookings")
      .select(
        "id, starts_at, status, services(name), staff(display_name), clients:client_id(full_name)",
      )
      .eq("business_id", business.id)
      .gte("starts_at", today.toISOString())
      .lt("starts_at", tomorrow.toISOString())
      .order("starts_at", { ascending: true }),
    // Active staff
    admin
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "active"),
    // All reviews (for avg)
    admin
      .from("reviews")
      .select("id, rating", { count: "exact" })
      .eq("business_id", business.id),
    // Total earnings
    admin
      .from("payments")
      .select("amount, booking_id, bookings!inner(business_id)")
      .eq("bookings.business_id", business.id)
      .eq("status", "succeeded"),
    // Current 30-day bookings
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("starts_at", thirtyDaysAgo.toISOString())
      .lt("starts_at", tomorrow.toISOString()),
    // Current 30-day earnings
    admin
      .from("payments")
      .select("amount, bookings!inner(business_id)")
      .eq("bookings.business_id", business.id)
      .eq("status", "succeeded")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    // Previous 30-day bookings
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("starts_at", sixtyDaysAgo.toISOString())
      .lt("starts_at", thirtyDaysAgo.toISOString()),
    // Previous 30-day earnings
    admin
      .from("payments")
      .select("amount, bookings!inner(business_id)")
      .eq("bookings.business_id", business.id)
      .eq("status", "succeeded")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString()),
    // Revenue trend (6 months of payments)
    admin
      .from("payments")
      .select("amount, created_at, bookings!inner(business_id)")
      .eq("bookings.business_id", business.id)
      .eq("status", "succeeded")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true }),
    // Service breakdown (all completed bookings)
    admin
      .from("bookings")
      .select("service_id, services(name)")
      .eq("business_id", business.id)
      .eq("status", "completed"),
    // Booking source breakdown
    admin
      .from("bookings")
      .select("source")
      .eq("business_id", business.id)
      .in("status", ["completed", "confirmed"]),
    // Weekly bookings (8 weeks)
    admin
      .from("bookings")
      .select("starts_at, status")
      .eq("business_id", business.id)
      .gte("starts_at", eightWeeksAgo.toISOString())
      .lt("starts_at", tomorrow.toISOString()),
    // Recent bookings (last 5)
    admin
      .from("bookings")
      .select(
        "id, starts_at, status, created_at, service_amount, currency, services(name), clients:client_id(full_name)",
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // Recent reviews (last 5)
    admin
      .from("reviews")
      .select(
        "id, rating, comment, created_at, clients:client_id(full_name), services:booking_id(services(name))",
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // ── Compute KPIs ──────────────────────────────────────────────────

  const totalBookings = totalBookingsRes.count ?? 0;
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

  // Period comparisons
  const currentBookings = currentPeriodBookingsRes.count ?? 0;
  const prevBookings = prevPeriodBookingsRes.count ?? 0;
  const currentEarnings = currentPeriodEarningsRes.data
    ? currentPeriodEarningsRes.data.reduce((s, p) => s + (p.amount ?? 0), 0)
    : 0;
  const prevEarnings = prevPeriodEarningsRes.data
    ? prevPeriodEarningsRes.data.reduce((s, p) => s + (p.amount ?? 0), 0)
    : 0;

  const bookingsTrend = pctChange(currentBookings, prevBookings);
  const earningsTrend = pctChange(currentEarnings, prevEarnings);

  // ── Revenue trend chart data ──────────────────────────────────────

  const revenueByMonth = new Map<string, { revenue: number; bookings: number }>();
  for (const p of revenueTrendRes.data ?? []) {
    const key = p.created_at.slice(0, 7); // "YYYY-MM"
    const prev = revenueByMonth.get(key) ?? { revenue: 0, bookings: 0 };
    revenueByMonth.set(key, {
      revenue: prev.revenue + (p.amount ?? 0) / 100,
      bookings: prev.bookings + 1,
    });
  }
  const revenueTrendData: MonthlyRevenueRow[] = Array.from(
    revenueByMonth.entries(),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      month: formatMonth(key + "-01"),
      revenue: Math.round(v.revenue * 100) / 100,
      bookings: v.bookings,
    }));

  // ── Service breakdown ─────────────────────────────────────────────

  const serviceCounts = new Map<string, number>();
  for (const b of serviceBreakdownRes.data ?? []) {
    const name =
      (b.services as unknown as { name: string } | null)?.name ?? "Unknown";
    serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
  }
  const serviceBreakdownData: ServiceBreakdownRow[] = Array.from(
    serviceCounts.entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // ── Source breakdown ──────────────────────────────────────────────

  const sourceCounts = new Map<string, number>();
  for (const b of sourceRes.data ?? []) {
    sourceCounts.set(b.source, (sourceCounts.get(b.source) ?? 0) + 1);
  }
  const sourceData: SourceRow[] = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }));

  // ── Weekly bookings ───────────────────────────────────────────────

  const weeklyMap = new Map<
    string,
    { completed: number; cancelled: number }
  >();
  // Generate 8 week buckets
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const key = weekStart.toISOString().slice(0, 10);
    weeklyMap.set(key, { completed: 0, cancelled: 0 });
  }
  const weekKeys = Array.from(weeklyMap.keys()).sort();
  for (const b of weeklyBookingsRes.data ?? []) {
    const bDate = new Date(b.starts_at);
    // Find which week bucket
    for (let i = weekKeys.length - 1; i >= 0; i--) {
      if (bDate >= new Date(weekKeys[i])) {
        const prev = weeklyMap.get(weekKeys[i])!;
        if (b.status === "completed") prev.completed++;
        else if (b.status === "cancelled") prev.cancelled++;
        break;
      }
    }
  }
  const weeklyData: WeeklyBookingRow[] = weekKeys.map((key) => ({
    week: weekLabel(key),
    ...weeklyMap.get(key)!,
  }));

  // ── Recent activity ───────────────────────────────────────────────

  const recentBookings = (recentBookingsRes.data ?? []).map((b) => ({
    id: b.id,
    type: "booking" as const,
    status: b.status,
    clientName:
      (b.clients as unknown as { full_name: string } | null)?.full_name ??
      "Client",
    serviceName:
      (b.services as unknown as { name: string } | null)?.name ?? "Service",
    amount: b.service_amount,
    currency: b.currency,
    date: b.created_at,
  }));

  const recentReviews = (recentReviewsRes.data ?? []).map((r) => ({
    id: r.id,
    type: "review" as const,
    rating: r.rating,
    comment: r.comment,
    clientName:
      (r.clients as unknown as { full_name: string } | null)?.full_name ??
      "Client",
    date: r.created_at,
  }));

  // Completion rate
  const completedBookings = (weeklyBookingsRes.data ?? []).filter(
    (b) => b.status === "completed",
  ).length;
  const totalRecentBookings = (weeklyBookingsRes.data ?? []).filter(
    (b) => b.status === "completed" || b.status === "cancelled" || b.status === "no_show",
  ).length;
  const completionRate =
    totalRecentBookings > 0
      ? Math.round((completedBookings / totalRecentBookings) * 100)
      : 0;

  const tz = business.timezone ?? DEFAULT_TIMEZONE;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Business overview and insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Bookings"
          value={totalBookings.toString()}
          icon={Calendar}
          trend={bookingsTrend}
          href="/dashboard/business/calendar"
        />
        <StatCard
          label="Total Earnings"
          value={`$${(totalEarnings / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={earningsTrend}
          href="/dashboard/business/earnings"
        />
        <StatCard
          label="Avg Rating"
          value={avgRating}
          icon={Star}
          trend={`${totalReviews} reviews`}
          href="/dashboard/business/reviews"
        />
        <StatCard
          label="Active Staff"
          value={activeStaff.toString()}
          icon={Users}
          href="/dashboard/business/staff"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          trend="Last 8 weeks"
        />
      </div>

      {/* Charts Row 1: Revenue Trend + Service Breakdown */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={revenueTrendData} />
        </div>
        <div>
          <ServiceBreakdownChart data={serviceBreakdownData} />
        </div>
      </div>

      {/* Charts Row 2: Weekly Bookings + Source + Completion */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyBookingsChart data={weeklyData} />
        </div>
        <div>
          <BookingSourceChart data={sourceData} />
        </div>
      </div>

      {/* Bottom Row: Today's Schedule + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div>
          <TodaysSchedule
            businessId={business.id}
            timezone={tz}
            initialItems={(todayBookingsRes.data ?? []).map((b) => ({
              id: b.id,
              starts_at: b.starts_at,
              status: b.status,
              serviceName:
                (b.services as unknown as { name: string } | null)?.name ??
                "Service",
              staffName:
                (b.staff as unknown as { display_name: string } | null)
                  ?.display_name ?? "Unassigned",
              clientName:
                (b.clients as unknown as { full_name: string } | null)
                  ?.full_name ?? "Client",
            }))}
          />
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[...recentBookings, ...recentReviews]
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .slice(0, 8)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  {item.type === "booking" ? (
                    <>
                      <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.serviceName} &middot;{" "}
                          <span
                            className={
                              item.status === "completed"
                                ? "text-success"
                                : item.status === "cancelled"
                                  ? "text-destructive"
                                  : "text-primary"
                            }
                          >
                            {item.status}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          ${((item.amount ?? 0) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(item.date)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2">
                        <Star className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.clientName}{" "}
                          <span className="text-muted-foreground">
                            left a {item.rating}-star review
                          </span>
                        </p>
                        {item.comment && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            &ldquo;{item.comment}&rdquo;
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(item.date)}
                      </p>
                    </>
                  )}
                </div>
              ))}
            {recentBookings.length === 0 && recentReviews.length === 0 && (
              <EmptyState
                icon={Clock}
                title="No activity yet"
                description="Recent bookings and reviews will show up here."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Time-ago helper                                                    */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
