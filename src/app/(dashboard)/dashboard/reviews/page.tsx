import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Star } from "lucide-react";

export default async function ClientReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, businesses(name), staff(display_name)",
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Reviews</h1>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">
                  {(r.businesses as unknown as { name: string } | null)?.name}
                </p>
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
              {(r.staff as unknown as { display_name: string } | null)?.display_name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Staff: {(r.staff as unknown as { display_name: string }).display_name}
                </p>
              )}
              {r.comment && (
                <p className="mt-2 text-sm text-foreground">{r.comment}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="After completing a booking, you can leave a review for the service."
        />
      )}
    </div>
  );
}
