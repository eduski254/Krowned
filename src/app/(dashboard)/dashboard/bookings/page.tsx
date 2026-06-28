import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { CancelButton, ReviewButton } from "./booking-actions";

export default async function ClientBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, payment_method, service_amount, currency, services(name), businesses(name), staff(display_name)",
    )
    .eq("client_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(50);

  // Fetch existing reviews for these bookings so we know which ones are reviewed
  const bookingIds = (bookings ?? []).map((b) => b.id);
  const { data: reviews } = bookingIds.length
    ? await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds)
    : { data: [] };
  const reviewedSet = new Set((reviews ?? []).map((r) => r.booking_id));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold font-heading text-foreground">
        My Bookings
      </h1>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => {
            const isPast = new Date(b.ends_at) < new Date();
            const isFuture = new Date(b.starts_at) > new Date();
            const canCancel = b.status === "confirmed" && isFuture;
            const canReview = b.status === "completed";

            return (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {(b.services as unknown as { name: string } | null)
                        ?.name ?? "Service"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(b.businesses as unknown as { name: string } | null)
                        ?.name}
                      {(
                        b.staff as unknown as {
                          display_name: string;
                        } | null
                      )?.display_name
                        ? ` — ${(b.staff as unknown as { display_name: string }).display_name}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(b.starts_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(b.starts_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === "completed"
                          ? "bg-success/10 text-success"
                          : b.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.service_amount != null && (
                      <span className="text-sm font-semibold text-foreground">
                        {(b.service_amount / 100).toFixed(2)}{" "}
                        {b.currency?.toUpperCase()}
                      </span>
                    )}
                    {canCancel && <CancelButton bookingId={b.id} />}
                  </div>
                </div>
                {canReview && (
                  <div className="mt-2">
                    <ReviewButton
                      bookingId={b.id}
                      hasReview={reviewedSet.has(b.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No bookings yet"
          description="Your booking history will appear here once you book a service."
          action={
            <Link
              href="/explore"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Find services
            </Link>
          }
        />
      )}
    </div>
  );
}
