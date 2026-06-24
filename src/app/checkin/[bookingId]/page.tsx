import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CheckInClient } from "./checkin-client";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, starts_at, ends_at, checked_in_at, staff_id, business_id, service_id, client_id, service_amount, currency")
    .eq("id", bookingId)
    .single();

  if (!booking) notFound();

  // Load related data in parallel
  const [bizRes, svcRes, clientRes, staffRes] = await Promise.all([
    supabase.from("businesses").select("id, name, owner_id").eq("id", booking.business_id).single(),
    supabase.from("services").select("name, duration_minutes").eq("id", booking.service_id).single(),
    supabase.from("profiles").select("full_name").eq("id", booking.client_id).single(),
    booking.staff_id
      ? supabase.from("staff").select("id, display_name, user_id").eq("id", booking.staff_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const biz = bizRes.data;
  const svc = svcRes.data;
  const client = clientRes.data;
  const staffRow = staffRes.data;

  // Authorization: must be business owner or assigned staff
  const isOwner = biz?.owner_id === user.id;
  const isAssignedStaff = staffRow?.user_id === user.id;

  if (!isOwner && !isAssignedStaff) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground font-heading">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          Only the business owner or assigned staff can check in clients.
        </p>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground font-heading">
        Client Check-in
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {biz?.name}
      </p>

      <CheckInClient
        bookingId={booking.id}
        status={booking.status}
        clientName={client?.full_name ?? "Unknown client"}
        serviceName={svc?.name ?? "Unknown service"}
        durationMinutes={svc?.duration_minutes ?? 0}
        staffName={staffRow?.display_name ?? "Unassigned"}
        startsAt={booking.starts_at}
        serviceAmount={booking.service_amount}
        currency={booking.currency}
        checkedInAt={booking.checked_in_at}
      />
    </div>
  );
}
