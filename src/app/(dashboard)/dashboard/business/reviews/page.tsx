import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Star } from "lucide-react";

export default async function BusinessReviewsPage() {
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

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, status, created_at, clients:client_id(full_name), staff(display_name)",
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Reviews</h1>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {(r.clients as unknown as { full_name: string } | null)?.full_name ?? "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Staff: {(r.staff as unknown as { display_name: string } | null)?.display_name ?? "—"}
                  </p>
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
                <p className="mt-2 text-sm text-foreground">{r.comment}</p>
              )}
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
              </div>
            </div>
          ))}
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
