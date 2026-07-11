import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingsTable } from "@/components/admin/BookingsTable";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, status, source, service_amount, currency, services(name), businesses(name, timezone), clients:client_id(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (bookings ?? []).map((b) => ({
    id: b.id,
    starts_at: b.starts_at,
    status: b.status,
    source: b.source,
    service_amount: b.service_amount,
    currency: b.currency,
    services: b.services as unknown as { name: string } | null,
    businesses: b.businesses as unknown as { name: string; timezone?: string } | null,
    clients: b.clients as unknown as { full_name: string } | null,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">All Bookings</h1>
      <BookingsTable rows={rows} />
    </div>
  );
}
