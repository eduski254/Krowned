import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DEFAULT_TIMEZONE } from "@/lib/format-date";
import { BookingsClient, type BookingItem } from "./bookings-client";

export default async function ClientBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, payment_method, service_amount, currency, services(name), businesses(name, timezone), staff(display_name)",
    )
    .eq("client_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(100);

  // Fetch existing reviews
  const bookingIds = (bookings ?? []).map((b) => b.id);
  const { data: reviews } = bookingIds.length
    ? await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds)
    : { data: [] };

  const items: BookingItem[] = (bookings ?? []).map((b) => ({
    id: b.id,
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    status: b.status,
    payment_method: b.payment_method,
    service_amount: b.service_amount,
    currency: b.currency,
    serviceName:
      (b.services as unknown as { name: string } | null)?.name ?? "Service",
    businessName:
      (b.businesses as unknown as { name: string } | null)?.name ?? "Business",
    businessTimezone:
      (b.businesses as unknown as { timezone: string } | null)?.timezone ??
      DEFAULT_TIMEZONE,
    staffName:
      (b.staff as unknown as { display_name: string } | null)?.display_name ??
      null,
  }));

  const reviewedIds = (reviews ?? []).map((r) => r.booking_id);

  return <BookingsClient bookings={items} reviewedIds={reviewedIds} />;
}
