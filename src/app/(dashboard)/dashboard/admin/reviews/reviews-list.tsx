"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  business_name: string | null;
  client_name: string | null;
  client_avatar_url: string | null;
}

export default function ReviewsList({ reviews }: { reviews: ReviewItem[] }) {
  const [filter, setFilter] = useState(0);

  const counts = useMemo(() => {
    const map: Record<number, number> = { 0: reviews.length, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      map[r.rating] = (map[r.rating] || 0) + 1;
    }
    return map;
  }, [reviews]);

  const filtered = useMemo(
    () => (filter === 0 ? reviews : reviews.filter((r) => r.rating === filter)),
    [reviews, filter],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {[0, 5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => setFilter(star)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === star
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {star === 0 ? (
              `All (${counts[0]})`
            ) : (
              <span className="flex items-center gap-1">
                {star} <Star className="h-3 w-3 fill-current" /> ({counts[star]})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reviews match this filter.
          </p>
        )}
        {filtered.map((r) => {
          const name = r.client_name || "A client";
          return (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {r.client_avatar_url ? (
                    <img
                      src={r.client_avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {r.business_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {name}
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
          );
        })}
      </div>
    </>
  );
}
