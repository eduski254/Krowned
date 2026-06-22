import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { Calendar, Star, TrendingUp } from "lucide-react";

export default async function StaffPerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!staffRow) redirect("/dashboard/staff");

  const [completedRes, reviewsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", staffRow.id)
      .eq("status", "completed"),
    supabase
      .from("reviews")
      .select("rating")
      .eq("staff_id", staffRow.id),
  ]);

  const completedCount = completedRes.count ?? 0;
  const reviews = reviewsRes.data ?? [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Performance</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Completed Appointments"
          value={completedCount.toString()}
          icon={Calendar}
        />
        <StatCard
          label="Average Rating"
          value={avgRating}
          icon={Star}
          trend={`${reviews.length} reviews`}
        />
        <StatCard
          label="Completion Rate"
          value={completedCount > 0 ? "—" : "—"}
          icon={TrendingUp}
          trend="Based on confirmed bookings"
        />
      </div>
    </div>
  );
}
