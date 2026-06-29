import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Calendar } from "lucide-react";
import { OwnerCancelButton, RescheduleButton } from "./calendar-actions";
import { CalendarHeader } from "./calendar-header";

export default async function BusinessCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  // Fetch upcoming bookings for the next 30 days
  const now = new Date();
  const thirtyDays = new Date(now);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `id, starts_at, ends_at, status, source,
       services(name),
       staff(display_name),
       clients:client_id(full_name),
       contact:contact_id(name)`,
    )
    .eq("business_id", business.id)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", thirtyDays.toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);

  // Fetch services and staff for the "New Booking" modal
  const [{ data: services }, { data: staffMembers }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_amount, currency")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("staff")
      .select("id, display_name")
      .eq("business_id", business.id)
      .eq("status", "active")
      .order("display_name"),
  ]);

  return (
    <div>
      <CalendarHeader
        businessId={business.id}
        services={services ?? []}
        staffMembers={staffMembers ?? []}
      />

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => {
            const canManage = b.status === "confirmed";
            const clientName =
              (b.clients as unknown as { full_name: string } | null)?.full_name ??
              (b.contact as unknown as { name: string } | null)?.name ??
              "Client";
            return (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {(b.services as unknown as { name: string } | null)
                        ?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {clientName}
                      {" — "}
                      {(
                        b.staff as unknown as {
                          display_name: string;
                        } | null
                      )?.display_name ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-foreground">
                      {new Date(b.starts_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(b.starts_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-success/10 text-success"
                          : b.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.source === "manual" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        manual
                      </span>
                    )}
                    {canManage && (
                      <>
                        <RescheduleButton bookingId={b.id} />
                        <OwnerCancelButton bookingId={b.id} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No upcoming bookings"
          description="When clients book your services, they'll appear here."
        />
      )}
    </div>
  );
}
