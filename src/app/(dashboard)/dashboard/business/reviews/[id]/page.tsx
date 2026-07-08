import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { ResponseForm } from "./response-form";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  // Verify this review belongs to the owner's business
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  const { data: review } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, status, created_at, booking_id, clients:client_id(full_name, avatar_url), staff(display_name)",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!review) notFound();

  // Get booking details if linked
  let bookingInfo: { service_name: string; starts_at: string } | null = null;
  if (review.booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("starts_at, services(name)")
      .eq("id", review.booking_id)
      .maybeSingle();
    if (booking) {
      bookingInfo = {
        service_name:
          (booking.services as unknown as { name: string } | null)?.name ?? "Unknown service",
        starts_at: booking.starts_at,
      };
    }
  }

  // Get existing response
  const { data: response } = await supabase
    .from("review_responses")
    .select("id, body, created_at, updated_at")
    .eq("review_id", review.id)
    .maybeSingle();

  const client = review.clients as unknown as { full_name: string | null; avatar_url: string | null } | null;
  const clientName = client?.full_name || "A client";
  const clientAvatar = client?.avatar_url ?? null;
  const staffName =
    (review.staff as unknown as { display_name: string } | null)?.display_name ?? "—";

  return (
    <div>
      <Link
        href="/dashboard/business/reviews"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reviews
      </Link>

      <div className="max-w-2xl space-y-6">
        {/* Review card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {clientAvatar ? (
                <img src={clientAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {clientName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Review from {clientName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Staff: {staffName}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating
                      ? "fill-warning text-warning"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>

          {review.comment && (
            <p className="mt-4 text-foreground">{review.comment}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{new Date(review.created_at).toLocaleDateString()}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                review.status === "published"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {review.status}
            </span>
          </div>

          {/* Linked booking info */}
          {bookingInfo && (
            <div className="mt-4 rounded-lg bg-muted px-4 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Booking:</span>{" "}
                {bookingInfo.service_name} on{" "}
                {new Date(bookingInfo.starts_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Existing response */}
        {response && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground">
              Your response
            </h2>
            <p className="mt-2 text-sm text-foreground">{response.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {response.updated_at !== response.created_at
                ? `Edited ${new Date(response.updated_at).toLocaleDateString()}`
                : new Date(response.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Response form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <ResponseForm
            reviewId={review.id}
            existingResponse={response?.body ?? null}
          />
        </div>
      </div>
    </div>
  );
}
