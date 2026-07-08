"use client";

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
  forwardRef,
} from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Map as MapIcon,
  List,
  LayoutList,
  LayoutGrid,
  X,
  Loader2,
} from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { StarRating } from "@/components/star-rating";
import type { ExploreBusiness } from "@/lib/explore/actions";

const ExploreMap = lazy(() =>
  import("./explore-map").then((m) => ({ default: m.ExploreMap })),
);

type Category = { id: string; name: string; slug: string };

// ── Smart filter + rank ──────────────────────────────────────────

function filterAndRank(
  all: ExploreBusiness[],
  q: string,
  city: string,
  categorySlug: string,
): ExploreBusiness[] {
  const qLower = q.toLowerCase().trim();
  const cityLower = city.toLowerCase().trim();

  // Score each business
  const scored = all.map((biz) => {
    let score = 0;
    let passes = true;

    // Category filter is hard — must match if set
    if (categorySlug && biz.categorySlug !== categorySlug) {
      passes = false;
    }

    // City filter — fuzzy match (partial)
    if (cityLower) {
      const bizCity = (biz.city ?? "").toLowerCase();
      const bizCountry = (biz.country ?? "").toLowerCase();
      if (bizCity.includes(cityLower) || bizCountry.includes(cityLower)) {
        score += 10;
      } else {
        passes = false;
      }
    }

    // Name/description search — soft, boosts ranking
    if (qLower) {
      const name = biz.name.toLowerCase();
      const desc = (biz.description ?? "").toLowerCase();
      const cat = (biz.categoryName ?? "").toLowerCase();

      if (name === qLower) {
        score += 100; // exact name match
      } else if (name.startsWith(qLower)) {
        score += 80; // starts with query
      } else if (name.includes(qLower)) {
        score += 50; // contains query in name
      } else if (cat.includes(qLower)) {
        score += 20; // matches category name
      } else if (desc.includes(qLower)) {
        score += 10; // matches description
      } else {
        // No match at all — downrank but still show if city/category match
        score -= 50;
      }
    }

    // Featured boost
    if (biz.is_featured) score += 5;

    // Rating boost
    if (biz.avgRating) score += biz.avgRating;

    return { biz, score, passes };
  });

  // If we have hard filters (category/city), only show matching
  // If only q (search text), show all sorted by relevance
  const hasHardFilter = !!categorySlug || !!cityLower;

  let results: typeof scored;
  if (hasHardFilter) {
    results = scored.filter((s) => s.passes);
  } else if (qLower) {
    // Show all, but with name matches boosted to top
    results = scored.filter((s) => s.score > -50);
    // If nothing matches well, show everything
    if (results.length === 0) results = scored;
  } else {
    results = scored;
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.map((s) => s.biz);
}

// ── Main component ───────────────────────────────────────────────

export function ExploreClient({
  businesses: allBusinesses,
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
  const [q, setQ] = useState(initialFilters.q);
  const [city, setCity] = useState(initialFilters.city);
  const [category, setCategory] = useState(initialFilters.category);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isFiltering, setIsFiltering] = useState(false);

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Client-side filter + rank (instant, no server round-trip)
  const filtered = useMemo(
    () => filterAndRank(allBusinesses, q, city, category),
    [allBusinesses, q, city, category],
  );

  // Businesses with valid coordinates for map
  const mappable = useMemo(
    () =>
      filtered.filter(
        (b) =>
          b.latitude != null &&
          b.longitude != null &&
          (b.latitude !== 0 || b.longitude !== 0),
      ),
    [filtered],
  );

  // Debounced filter update with brief loading flash
  const updateFilter = useCallback(
    (setter: (v: string) => void, value: string) => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
      setIsFiltering(true);
      filterTimeoutRef.current = setTimeout(() => {
        setter(value);
        setIsFiltering(false);
      }, 150);
    },
    [],
  );

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

  const activeFilterCount =
    (q ? 1 : 0) + (city ? 1 : 0) + (category ? 1 : 0);

  const clearFilters = () => {
    setQ("");
    setCity("");
    setCategory("");
    setIsFiltering(false);
  };

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* Filters bar */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="group relative flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={q}
              onChange={(e) => updateFilter(setQ, e.target.value)}
              placeholder="Search businesses..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* City input */}
          <div className="group relative flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 sm:w-44">
            <MapPin className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={city}
              onChange={(e) => updateFilter(setCity, e.target.value)}
              placeholder="City"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {city && (
              <button
                onClick={() => setCity("")}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category select */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setIsFiltering(false);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories
              .filter((c) => c.slug !== "new-category")
              .map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
          </select>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {filtered.length} result
                {filtered.length !== 1 ? "s" : ""}
              </p>
              {isFiltering && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle — desktop only */}
              <div className="hidden rounded-lg border border-border p-0.5 lg:flex">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition-all active:scale-90 ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-all active:scale-90 ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-muted hover:shadow-sm active:scale-95 lg:hidden"
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </button>
              )}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
                  : "space-y-4"
              }
            >
              {filtered.map((biz, i) => (
                <BusinessCard
                  key={biz.id}
                  biz={biz}
                  isLoggedIn={isLoggedIn}
                  isHighlighted={highlightedId === biz.id}
                  onHover={handleCardHover}
                  viewMode={viewMode}
                  index={i}
                  ref={(el) => {
                    if (el) cardRefs.current.set(biz.id, el);
                    else cardRefs.current.delete(biz.id);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center animate-fade-in">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                No businesses found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Map panel */}
        {hasMapKey && (
          <div
            className={`${
              mobileMapOpen
                ? "absolute inset-0 z-20"
                : "hidden lg:block lg:w-1/2"
            }`}
          >
            {mobileMapOpen && (
              <button
                type="button"
                onClick={() => setMobileMapOpen(false)}
                className="absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-md transition-all hover:bg-muted active:scale-95"
              >
                <List className="h-4 w-4" />
                List
              </button>
            )}

            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
            >
              <ExploreMap
                businesses={mappable}
                highlightedId={highlightedId}
                onPinClick={handlePinClick}
                onBoundsChanged={() => {}}
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

/* ── Business Card ──────────────────────────────────────────────── */

const BusinessCard = forwardRef<
  HTMLElement,
  {
    biz: ExploreBusiness;
    isLoggedIn: boolean;
    isHighlighted: boolean;
    onHover: (id: string | null) => void;
    viewMode: "list" | "grid";
    index: number;
  }
>(function BusinessCard(
  { biz, isLoggedIn, isHighlighted, onHover, viewMode, index },
  ref,
) {
  const hasCords =
    biz.latitude != null &&
    biz.longitude != null &&
    (biz.latitude !== 0 || biz.longitude !== 0);
  const imageUrl = biz.imageUrl;

  // Staggered animation delay (cap at 200ms)
  const delay = Math.min(index * 30, 200);

  const badges = (
    <>
      {biz.is_featured && (
        <span className="rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
          Featured
        </span>
      )}
      {!hasCords && (
        <span className="rounded-full bg-accent/90 px-2 py-0.5 text-xs font-medium text-accent-foreground shadow-sm">
          Mobile
        </span>
      )}
    </>
  );

  const letterAvatar = (
    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-bold text-primary">
      {biz.name.charAt(0)}
    </div>
  );

  // --- GRID VIEW ---
  if (viewMode === "grid") {
    return (
      <Link
        href={`/b/${biz.slug}`}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onMouseEnter={() => onHover(biz.id)}
        onMouseLeave={() => onHover(null)}
        style={{ animationDelay: `${delay}ms` }}
        className={`group relative block overflow-hidden rounded-xl border bg-card transition-all duration-200 animate-card-in hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${
          isHighlighted
            ? "border-primary ring-2 ring-primary/20 shadow-md"
            : "border-border"
        }`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={biz.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            letterAvatar
          )}
          <div className="absolute left-2 top-2 flex gap-1.5">{badges}</div>
          <div className="absolute right-2 top-2">
            <FavoriteButton
              businessId={biz.id}
              initialFavorited={biz.isFavorited}
              isLoggedIn={isLoggedIn}
              size="sm"
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {biz.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {biz.categoryName ?? ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {[biz.city, biz.country].filter(Boolean).join(", ")}
          </p>
          {biz.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {biz.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <StarRating value={biz.avgRating} count={biz.reviewCount} />
            <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
              View &rarr;
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // --- LIST VIEW ---
  return (
    <Link
      href={`/b/${biz.slug}`}
      ref={ref as React.Ref<HTMLAnchorElement>}
      onMouseEnter={() => onHover(biz.id)}
      onMouseLeave={() => onHover(null)}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex overflow-hidden rounded-xl border bg-card transition-all duration-200 animate-card-in hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] ${
        isHighlighted
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border"
      }`}
    >
      <div className="relative hidden w-40 shrink-0 overflow-hidden bg-muted sm:block">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={biz.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          letterAvatar
        )}
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
          {badges}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                {biz.name}
              </h3>
              <div className="flex gap-1.5 sm:hidden">{badges}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              {biz.categoryName ?? ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {[biz.city, biz.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="shrink-0">
            <FavoriteButton
              businessId={biz.id}
              initialFavorited={biz.isFavorited}
              isLoggedIn={isLoggedIn}
              size="sm"
            />
          </div>
        </div>

        {biz.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {biz.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <StarRating value={biz.avgRating} count={biz.reviewCount} />
          <span className="text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
});
