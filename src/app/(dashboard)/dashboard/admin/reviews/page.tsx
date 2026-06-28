import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, status, created_at, businesses(name), clients:client_id(full_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Reviews</h1>

      <div className="space-y-3">
        {reviews?.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const client = r.clients as unknown as { full_name: string | null; avatar_url: string | null } | null;
                  const name = client?.full_name || "A client";
                  return client?.avatar_url ? (
                    <img src={client.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <p className="font-medium text-foreground">
                    {(r.businesses as unknown as { name: string } | null)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by {(r.clients as unknown as { full_name: string | null })?.full_name || "A client"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < r.rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "published"
                      ? "bg-success/10 text-success"
                      : r.status === "flagged"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            </div>
            {r.comment && (
              <p className="mt-2 text-sm text-foreground">{r.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
