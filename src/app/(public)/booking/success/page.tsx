import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import { formatBookingDateTime, DEFAULT_TIMEZONE } from "@/lib/format-date";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>;
}) {
  const { booking_id } = await searchParams;
  if (!booking_id) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, starts_at, ends_at, status, service_amount, currency,
      services(name, duration_minutes),
      staff(display_name),
      businesses(name, slug, timezone)
    `)
    .eq("id", booking_id)
    .eq("client_id", user.id)
    .single();

  if (!booking) redirect("/");

  const service = booking.services as any;
  const staff = booking.staff as any;
  const biz = booking.businesses as any;
  const ref = "KR-" + booking.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const tz = biz?.timezone ?? DEFAULT_TIMEZONE;
  const dateTimeStr = formatBookingDateTime(booking.starts_at, tz);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>

      <h1 className="text-2xl font-bold text-foreground font-heading sm:text-3xl">
        Payment Successful!
      </h1>
      <p className="mt-2 text-muted-foreground">
        Your booking at <span className="font-medium text-foreground">{biz?.name}</span> is confirmed.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Reference</span>
          <span className="font-mono text-sm font-bold text-foreground">{ref}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Service</span>
          <span className="text-sm font-medium text-foreground">{service?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Professional</span>
          <span className="text-sm text-foreground">{staff?.display_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Date & Time</span>
          <span className="text-sm text-foreground">{dateTimeStr}</span>
        </div>
        {booking.service_amount != null && (
          <>
            <hr className="border-border" />
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Paid</span>
              <span className="font-semibold text-foreground">
                {(booking.service_amount / 100).toFixed(2)} {(booking.currency ?? "USD").toUpperCase()}
              </span>
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        A confirmation email with calendar invite has been sent to your email.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/dashboard/bookings"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          View My Bookings
        </Link>
        {biz?.slug && (
          <Link
            href={`/b/${biz.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Back to {biz.name}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
