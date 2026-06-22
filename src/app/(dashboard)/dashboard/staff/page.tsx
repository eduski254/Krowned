import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Calendar, DollarSign, Star, Clock } from "lucide-react";

export default async function StaffDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find the staff row for this user
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, display_name, business_id, businesses(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!staffRow) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          Staff Dashboard
        </h1>
        <EmptyState
          icon={Clock}
          title="No active staff membership"
          description="You'll see your dashboard here once a business adds you as staff."
        />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalRes, todayRes, reviewRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", staffRow.id),
    supabase
      .from("bookings")
      .select("id, starts_at, status, services(name), clients:client_id(full_name)")
      .eq("staff_id", staffRow.id)
      .gte("starts_at", today.toISOString())
      .lt("starts_at", tomorrow.toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("reviews")
      .select("rating")
      .eq("staff_id", staffRow.id),
  ]);

  const totalBookings = totalRes.count ?? 0;
  const todayBookings = todayRes.data ?? [];
  const avgRating =
    reviewRes.data && reviewRes.data.length > 0
      ? (reviewRes.data.reduce((s, r) => s + r.rating, 0) / reviewRes.data.length).toFixed(1)
      : "—";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Hey, {staffRow.display_name ?? "there"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {(staffRow.businesses as unknown as { name: string } | null)?.name}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Appointments"
          value={totalBookings.toString()}
          icon={Calendar}
        />
        <StatCard
          label="Today"
          value={todayBookings.length.toString()}
          icon={Clock}
        />
        <StatCard
          label="Avg Rating"
          value={avgRating}
          icon={Star}
          trend={`${reviewRes.data?.length ?? 0} reviews`}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Today&apos;s Appointments
      </h2>
      {todayBookings.length > 0 ? (
        <div className="space-y-3">
          {todayBookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium text-foreground">
                  {(b.services as unknown as { name: string } | null)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
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
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No appointments today"
          description="Your schedule for today is clear."
        />
      )}
    </div>
  );
}
