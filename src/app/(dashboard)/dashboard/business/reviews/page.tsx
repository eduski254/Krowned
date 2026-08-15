import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/empty-state";
import Image from "next/image";
import { Star, MessageSquare, Camera } from "lucide-react";

export default async function BusinessReviewsPage() {
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) redirect("/login");

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", effectiveUserId)
    .maybeSingle();

  if (!business) redirect("/dashboard/business");

  const { data: reviews } = await admin
    .from("reviews")
    .select(
      "id, rating, comment, photos, status, created_at, clients:client_id(full_name, avatar_url), staff(display_name)",
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get response status for each review
  const reviewIds = (reviews ?? []).map((r) => r.id);
  const { data: responses } = reviewIds.length > 0
    ? await admin
        .from("review_responses")
        .select("review_id")
        .in("review_id", reviewIds)
    : { data: [] };

  const respondedSet = new Set((responses ?? []).map((r) => r.review_id));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Reviews</h1>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => {
            const hasResponse = respondedSet.has(r.id);
            return (
              <Link
                key={r.id}
                href={`/dashboard/business/reviews/${r.id}`}
                className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const client = r.clients as unknown as { full_name: string | null; avatar_url: string | null } | null;
                      const name = client?.full_name || "A client";
                      return client?.avatar_url ? (
                        <img src={client.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      );
                    })()}
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {(r.clients as unknown as { full_name: string | null })?.full_name || "A client"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Staff: {(r.staff as unknown as { display_name: string } | null)?.display_name ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="mt-2 line-clamp-2 text-sm text-foreground">
                    {r.comment}
                  </p>
                )}
                {(() => {
                  const photos = Array.isArray(r.photos) ? (r.photos as string[]) : [];
                  if (photos.length === 0) return null;
                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {photos.slice(0, 3).map((url, i) => (
                          <div key={url} className="relative h-8 w-8 overflow-hidden rounded border-2 border-card">
                            <Image src={url} alt="" fill className="object-cover" sizes="32px" unoptimized />
                          </div>
                        ))}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Camera className="h-3 w-3" />
                        {photos.length} photo{photos.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })()}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "published"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {r.status}
                  </span>
                  {hasResponse ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <MessageSquare className="h-3 w-3" />
                      Responded
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Click to respond
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Client reviews will appear here after completed bookings."
        />
      )}
    </div>
  );
}
