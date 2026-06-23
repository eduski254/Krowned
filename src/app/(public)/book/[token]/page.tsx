import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingFlow } from "./booking-flow";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { token } = await params;
  const { source: sourceParam } = await searchParams;
  const bookingSource: "marketplace" | "direct_link" =
    sourceParam === "marketplace" ? "marketplace" : "direct_link";
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, timezone, charges_enabled, plans(tier, features), subscription_status",
    )
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
        <h1 className="text-2xl font-bold text-foreground font-heading">
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

      <h1 className="text-2xl font-bold text-foreground font-heading">
        Book at {business.name}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Select a service and preferred time.
      </p>

      <div className="mt-8">
        <BookingFlow
          businessId={business.id}
          businessName={business.name}
          businessSlug={business.slug}
          timezone={business.timezone}
          chargesEnabled={business.charges_enabled}
          services={services ?? []}
          staffMembers={staffMembers ?? []}
          source={bookingSource}
        />
      </div>
    </div>
  );
}
