"use client";

import { useMemo } from "react";
import { Scissors, Building2 } from "lucide-react";
import type { ExploreBusiness } from "@/lib/explore/actions";

export type ServiceSuggestion = { name: string; count: number };

export function SearchDropdown({
  query,
  businesses,
  serviceNames,
  onSelectService,
  onSelectBusiness,
}: {
  query: string;
  businesses: ExploreBusiness[];
  serviceNames: ServiceSuggestion[];
  onSelectService: (name: string) => void;
  onSelectBusiness: (slug: string, name: string) => void;
}) {
  const q = query.toLowerCase().trim();

  const matchedServices = useMemo(() => {
    if (!q) return [];
    return serviceNames
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 4);
  }, [q, serviceNames]);

  const matchedBusinesses = useMemo(() => {
    if (!q) return [];
    return businesses
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.description ?? "").toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [q, businesses]);

  if (!q || (matchedServices.length === 0 && matchedBusinesses.length === 0)) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      {matchedServices.length > 0 && (
        <div>
          <div className="px-3 pb-1 pt-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Services
            </span>
          </div>
          {matchedServices.map((s) => (
            <button
              key={s.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectService(s.name)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Scissors className="h-3.5 w-3.5 text-primary" />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground">
                {s.count} {s.count === 1 ? "business" : "businesses"}
              </span>
            </button>
          ))}
        </div>
      )}

      {matchedServices.length > 0 && matchedBusinesses.length > 0 && (
        <div className="border-t border-border" />
      )}

      {matchedBusinesses.length > 0 && (
        <div>
          <div className="px-3 pb-1 pt-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Businesses
            </span>
          </div>
          {matchedBusinesses.map((b) => (
            <button
              key={b.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectBusiness(b.slug, b.name)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              {b.imageUrl ? (
                <img
                  src={b.imageUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {b.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {b.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[b.categoryName, b.city].filter(Boolean).join(" · ")}
                </p>
              </div>
              {b.avgRating && (
                <span className="text-xs font-medium text-warning">
                  {b.avgRating.toFixed(1)} ★
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
