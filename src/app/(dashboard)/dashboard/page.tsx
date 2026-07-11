import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Calendar,
  Heart,
  Star,
  Search,
} from "lucide-react";

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = user.user_metadata?.full_name ?? "there";

  // Fetch real counts
  const [bookingsRes, favoritesRes, reviewsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id),
    supabase
      .from("favorites")
      .select("business_id", { count: "exact", head: true })
      .eq("client_id", user.id),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id),
  ]);

  const bookingCount = bookingsRes.count ?? 0;
  const favoriteCount = favoritesRes.count ?? 0;
  const reviewCount = reviewsRes.count ?? 0;

  // Upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from("bookings")
    .select("id, starts_at, status, services(name), businesses(name, timezone)")
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {fullName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your bookings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          label="Total Bookings"
          value={bookingCount.toString()}
          icon={Calendar}
        />
        <StatCard
          label="Favorites"
          value={favoriteCount.toString()}
          icon={Heart}
        />
        <StatCard
          label="Reviews Given"
          value={reviewCount.toString()}
          icon={Star}
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
          Find Services
        </Link>
      </div>

      {/* Upcoming bookings */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Upcoming Bookings
        </h2>
        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {(booking.services as unknown as { name: string } | null)?.name ?? "Service"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(booking.businesses as unknown as { name: string } | null)?.name ?? "Business"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(booking.starts_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: (booking.businesses as unknown as { name: string; timezone: string } | null)?.timezone ?? "Africa/Nairobi",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(booking.starts_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: (booking.businesses as unknown as { name: string; timezone: string } | null)?.timezone ?? "Africa/Nairobi",
                    })}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No upcoming bookings"
            description="When you book a service, your upcoming appointments will appear here."
            action={
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Browse services
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
