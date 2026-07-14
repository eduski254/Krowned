import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import { CalendarClient, type CalendarBooking } from "./calendar-client";

export default async function BusinessCalendarPage() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, timezone")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  const tz = business.timezone ?? "America/New_York";

  // Fetch upcoming bookings for the next 60 days
  const now = new Date();
  const sixtyDays = new Date(now);
  sixtyDays.setDate(sixtyDays.getDate() + 60);

  const [{ data: bookings }, { data: services }, { data: staffMembers }] =
    await Promise.all([
      admin
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
        .lte("starts_at", sixtyDays.toISOString())
        .order("starts_at", { ascending: true })
        .limit(200),
      admin
        .from("services")
        .select("id, name, duration_minutes, price_amount, currency")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("name"),
      admin
        .from("staff")
        .select("id, display_name")
        .eq("business_id", business.id)
        .eq("status", "active")
        .order("display_name"),
    ]);

  const items: CalendarBooking[] = (bookings ?? []).map((b) => ({
    id: b.id,
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    status: b.status,
    source: b.source,
    serviceName:
      (b.services as unknown as { name: string } | null)?.name ?? "Service",
    staffName:
      (b.staff as unknown as { display_name: string } | null)?.display_name ??
      "Unassigned",
    clientName:
      (b.clients as unknown as { full_name: string } | null)?.full_name ??
      (b.contact as unknown as { name: string } | null)?.name ??
      "Client",
  }));

  return (
    <CalendarClient
      businessId={business.id}
      timezone={tz}
      initialBookings={items}
      services={services ?? []}
      staffMembers={staffMembers ?? []}
    />
  );
}
