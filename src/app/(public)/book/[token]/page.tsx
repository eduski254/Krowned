import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, plans(tier, features), subscription_status")
    .eq("booking_link_token", token)
    .eq("is_published", true)
    .maybeSingle();

  if (!business) notFound();

  const plan = business.plans as unknown as { tier: string } | null;
  const isBookable =
    plan?.tier === "premium" &&
    ["trialing", "active"].includes(business.subscription_status ?? "");

  if (!isBookable) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Booking not available
        </h1>
        <p className="mt-2 text-muted-foreground">
          This business is not currently accepting online bookings.
        </p>
        <Link
          href={`/b/${business.slug}`}
          className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          View business profile
        </Link>
      </div>
    );
  }

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_amount, currency, duration_minutes, payment_option")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  // Fetch staff
  const { data: staffMembers } = await supabase
    .from("staff")
    .select("id, display_name, avatar_url")
    .eq("business_id", business.id)
    .eq("status", "active");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href={`/b/${business.slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {business.name}
      </Link>

      <h1 className="text-2xl font-bold text-foreground">
        Book at {business.name}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Select a service and preferred time.
      </p>

      {/* Step 1: Select service */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          1. Choose a Service
        </h2>
        <div className="space-y-3">
          {services?.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  className="h-4 w-4 text-primary focus:ring-ring"
                />
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3" /> {s.duration_minutes} min
                  </p>
                </div>
              </div>
              <span className="font-semibold text-foreground">
                {(s.price_amount / 100).toFixed(2)} {s.currency?.toUpperCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Select staff (optional) */}
      {staffMembers && staffMembers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            2. Choose a Professional (Optional)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors">
              <input
                type="radio"
                name="staff"
                value=""
                defaultChecked
                className="h-4 w-4 text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">Any available</span>
            </label>
            {staffMembers.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
              >
                <input
                  type="radio"
                  name="staff"
                  value={s.id}
                  className="h-4 w-4 text-primary focus:ring-ring"
                />
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(s.display_name ?? "?").charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">{s.display_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select date/time */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          3. Pick a Date &amp; Time
        </h2>
        {/* // REVIEW: Availability engine needed here.
            // This should compute available slots from:
            //   business_hours ∩ staff_schedules − schedule_exceptions − existing bookings
            // Then render a date picker + time slot grid.
            // For now, show a placeholder. */}
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">
            Time slot selection coming soon
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The availability engine will compute open slots here.
          </p>
        </div>
      </div>

      {/* Confirm */}
      <div className="mt-8">
        <button
          disabled
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground opacity-50"
        >
          {/* // REVIEW: Booking submission + optional Stripe payment intent creation */}
          Confirm Booking
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Booking confirmation requires the availability engine.
        </p>
      </div>
    </div>
  );
}
