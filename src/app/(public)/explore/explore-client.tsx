"use client";

import {
  useState,
  useCallback,
  useRef,
  useTransition,
  lazy,
  Suspense,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Map as MapIcon, List, LayoutList, LayoutGrid } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { StarRating } from "@/components/star-rating";
import type { ExploreBusiness } from "@/lib/explore/actions";
import { searchByBounds } from "@/lib/explore/actions";

const ExploreMap = lazy(() =>
  import("./explore-map").then((m) => ({ default: m.ExploreMap })),
);

type Category = { id: string; name: string; slug: string };

export function ExploreClient({
  businesses: initialBusinesses,
  categories,
  initialFilters,
  isLoggedIn,
  hasMapKey,
}: {
  businesses: ExploreBusiness[];
  categories: Category[];
  initialFilters: { q: string; category: string; city: string };
  isLoggedIn: boolean;
  hasMapKey: boolean;
}) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [boundsChanged, setBoundsChanged] = useState(false);
  const [isPending, startTransition] = useTransition();
  const boundsRef = useRef<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const filtersRef = useRef(initialFilters);

  const handleBoundsChanged = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      boundsRef.current = bounds;
      setBoundsChanged(true);
    },
    [],
  );

  const handleRedoSearch = useCallback(() => {
    if (!boundsRef.current) return;
    setBoundsChanged(false);
    startTransition(async () => {
      const result = await searchByBounds({
        ...boundsRef.current!,
        q: filtersRef.current.q || undefined,
        category: filtersRef.current.category || undefined,
      });
      setBusinesses(result.businesses);
    });
  }, []);

  const handlePinClick = useCallback((id: string) => {
    setHighlightedId(id);
    const el = cardRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleCardHover = useCallback((id: string | null) => {
    setHighlightedId(id);
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const pushFilters = useCallback(
    (q: string, city: string, category: string) => {
      filtersRef.current = { q, city, category };
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (city) sp.set("city", city);
      if (category) sp.set("category", category);
      router.push(`/explore${sp.toString() ? `?${sp}` : ""}`);
    },
    [router],
  );

  const handleFilterSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const fd = new FormData(e.currentTarget);
      pushFilters(
        (fd.get("q") as string) || "",
        (fd.get("city") as string) || "",
        (fd.get("category") as string) || "",
      );
    },
    [pushFilters],
  );

  const handleLiveChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      pushFilters(
        (fd.get("q") as string) || "",
        (fd.get("city") as string) || "",
        (fd.get("category") as string) || "",
      );
    }, 400);
  }, [pushFilters]);

  // Businesses with valid coordinates (for map pins)
  const mappable = businesses.filter(
    (b) => b.latitude != null && b.longitude != null && (b.latitude !== 0 || b.longitude !== 0),
  );

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* Filters bar */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <form
          ref={formRef}
          onSubmit={handleFilterSubmit}
          className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              type="text"
              defaultValue={initialFilters.q}
              placeholder="Search businesses..."
              onChange={handleLiveChange}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <input
              name="city"
              type="text"
              defaultValue={initialFilters.city}
              placeholder="City"
              onChange={handleLiveChange}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <select
            name="category"
            defaultValue={initialFilters.category}
            onChange={handleLiveChange}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">All categories</option>
            {categories.filter((c) => c.slug !== "new-category").map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* List panel */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:w-1/2 lg:flex-none ${
            mobileMapOpen ? "hidden lg:block" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {businesses.length} result{businesses.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              {/* View toggle — desktop only */}
              <div className="hidden rounded-lg border border-border p-0.5 lg:flex">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              {/* Mobile map toggle */}
              {hasMapKey && (
                <button
                  type="button"
                  onClick={() => setMobileMapOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted lg:hidden"
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </button>
              )}
            </div>
          </div>

          {businesses.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
                  : "space-y-4"
              }
            >
              {businesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  biz={biz}
                  isLoggedIn={isLoggedIn}
                  isHighlighted={highlightedId === biz.id}
                  onHover={handleCardHover}
                  ref={(el) => {
                    if (el) cardRefs.current.set(biz.id, el);
                    else cardRefs.current.delete(biz.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">
                No businesses found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>

        {/* Map panel — desktop: visible in list mode, mobile: toggle */}
        {hasMapKey && (
          <div
            className={`${
              mobileMapOpen
                ? "absolute inset-0 z-20"
                : "hidden lg:block lg:w-1/2"
            }`}
          >
            {/* Mobile back button */}
            {mobileMapOpen && (
              <button
                type="button"
                onClick={() => setMobileMapOpen(false)}
                className="absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-md hover:bg-muted"
              >
                <List className="h-4 w-4" />
                List
              </button>
            )}

            {/* Redo search button */}
            {boundsChanged && (
              <button
                type="button"
                onClick={handleRedoSearch}
                disabled={isPending}
                className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg hover:bg-muted disabled:opacity-60"
              >
                {isPending ? "Searching..." : "Redo search in this area"}
              </button>
            )}

            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Loading map...
                  </p>
                </div>
              }
            >
              <ExploreMap
                businesses={mappable}
                highlightedId={highlightedId}
                onPinClick={handlePinClick}
                onBoundsChanged={handleBoundsChanged}
              />
            </Suspense>
          </div>
        )}

        {/* No API key fallback */}
        {!hasMapKey && (
          <div className="hidden items-center justify-center border-l border-border bg-muted lg:flex lg:w-1/2">
            <p className="text-sm text-muted-foreground">
              Map unavailable — API key not configured.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Business Card ---------- */

import { forwardRef } from "react";

const BusinessCard = forwardRef<
  HTMLElement,
  {
    biz: ExploreBusiness;
    isLoggedIn: boolean;
    isHighlighted: boolean;
    onHover: (id: string | null) => void;
  }
>(function BusinessCard({ biz, isLoggedIn, isHighlighted, onHover }, ref) {
  const hasCords = biz.latitude != null && biz.longitude != null && (biz.latitude !== 0 || biz.longitude !== 0);

  return (
    <Link
      href={`/b/${biz.slug}`}
      ref={ref as React.Ref<HTMLAnchorElement>}
      onMouseEnter={() => onHover(biz.id)}
      onMouseLeave={() => onHover(null)}
      className={`group relative block rounded-xl border bg-card p-5 transition-all hover:shadow-lg ${
        isHighlighted
          ? "border-primary ring-2 ring-primary/20"
          : "border-border"
      }`}
    >
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton
          businessId={biz.id}
          initialFavorited={biz.isFavorited}
          isLoggedIn={isLoggedIn}
          size="sm"
        />
      </div>

      <div className="flex items-start gap-4">
        {biz.logo_url ? (
          <img
            src={biz.logo_url}
            alt=""
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
            {biz.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
              {biz.name}
            </h3>
            {biz.is_featured && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Featured
              </span>
            )}
            {!hasCords && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                Mobile
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {biz.categoryName ?? ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {[biz.city, biz.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      {biz.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {biz.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <StarRating value={biz.avgRating} count={biz.reviewCount} />
        <span className="text-sm font-medium text-primary">View &rarr;</span>
      </div>
    </Link>
  );
});
