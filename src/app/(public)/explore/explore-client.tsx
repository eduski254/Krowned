"use client";

import {
  useState,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
  forwardRef,
  useEffect,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Map as MapIcon,
  List,
  LayoutList,
  LayoutGrid,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { StarRating } from "@/components/star-rating";
import type { ExploreBusiness } from "@/lib/explore/actions";
import {
  SearchDropdown,
  type ServiceSuggestion,
} from "./search-dropdown";
import { LocationDropdown, addToLocationHistory } from "./location-dropdown";
import {
  WhenDropdown,
  formatWhenLabel,
  isOpenAt,
  type TimeOfDay,
} from "./when-filter";

const ExploreMap = lazy(() =>
  import("./explore-map").then((m) => ({ default: m.ExploreMap })),
);

type Category = { id: string; name: string; slug: string };
type BusinessHours = Record<
  string,
  Array<{ day_of_week: number; open_time: string; close_time: string }>
>;

// ── Smart filter + rank ──────────────────────────────────────────

function filterAndRank(
  all: ExploreBusiness[],
  q: string,
  city: string,
  categorySlug: string,
  whenDate: string | null,
  whenTime: TimeOfDay,
  businessHours: BusinessHours,
): ExploreBusiness[] {
  const qLower = q.toLowerCase().trim();
  const cityLower = city.toLowerCase().trim();

  const scored = all.map((biz) => {
    let score = 0;
    let passes = true;

    // Category — hard filter
    if (categorySlug && biz.categorySlug !== categorySlug) {
      passes = false;
    }

    // City — hard filter (fuzzy)
    if (cityLower) {
      const bizCity = (biz.city ?? "").toLowerCase();
      const bizCountry = (biz.country ?? "").toLowerCase();
      if (bizCity.includes(cityLower) || bizCountry.includes(cityLower)) {
        score += 10;
      } else {
        passes = false;
      }
    }

    // When — hard filter
    if (whenDate || whenTime !== "anytime") {
      const hours = businessHours[biz.id] ?? [];
      if (!isOpenAt(hours, whenDate, whenTime)) {
        passes = false;
      }
    }

    // Name/description search — soft boost
    if (qLower) {
      const name = biz.name.toLowerCase();
      const desc = (biz.description ?? "").toLowerCase();
      const cat = (biz.categoryName ?? "").toLowerCase();

      if (name === qLower) {
        score += 100;
      } else if (name.startsWith(qLower)) {
        score += 80;
      } else if (name.includes(qLower)) {
        score += 50;
      } else if (cat.includes(qLower)) {
        score += 20;
      } else if (desc.includes(qLower)) {
        score += 10;
      } else {
        score -= 50;
      }
    }

    if (biz.is_featured) score += 5;
    if (biz.avgRating) score += biz.avgRating;

    return { biz, score, passes };
  });

  const hasHardFilter = !!categorySlug || !!cityLower || !!whenDate || whenTime !== "anytime";

  let results: typeof scored;
  if (hasHardFilter) {
    results = scored.filter((s) => s.passes);
  } else if (qLower) {
    results = scored.filter((s) => s.score > -50);
    if (results.length === 0) results = scored;
  } else {
    results = scored;
  }

  results.sort((a, b) => b.score - a.score);
  return results.map((s) => s.biz);
}

// ── Main component ───────────────────────────────────────────────

export function ExploreClient({
  businesses: allBusinesses,
  categories,
  serviceNames,
  businessHours,
  initialFilters,
  isLoggedIn,
  hasMapKey,
}: {
  businesses: ExploreBusiness[];
  categories: Category[];
  serviceNames: ServiceSuggestion[];
  businessHours: BusinessHours;
  initialFilters: { q: string; category: string; city: string };
  isLoggedIn: boolean;
  hasMapKey: boolean;
}) {
  const router = useRouter();

  // Filter state
  const [q, setQ] = useState(initialFilters.q);
  const [qInput, setQInput] = useState(initialFilters.q); // what's typed (before Enter)
  const [city, setCity] = useState(initialFilters.city);
  const [cityInput, setCityInput] = useState(initialFilters.city);
  const [category, setCategory] = useState(initialFilters.category);
  const [whenDate, setWhenDate] = useState<string | null>(null);
  const [whenTime, setWhenTime] = useState<TimeOfDay>("anytime");

  // UI state
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [isFiltering, setIsFiltering] = useState(false);

  // Dropdown visibility
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showWhenDropdown, setShowWhenDropdown] = useState(false);

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const listPanelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const whenRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (whenRef.current && !whenRef.current.contains(e.target as Node)) {
        setShowWhenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Client-side filter + rank
  const filtered = useMemo(() => {
    setIsFiltering(true);
    const result = filterAndRank(
      allBusinesses,
      q,
      city,
      category,
      whenDate,
      whenTime,
      businessHours,
    );
    // Brief flash then clear
    setTimeout(() => setIsFiltering(false), 80);
    return result;
  }, [allBusinesses, q, city, category, whenDate, whenTime, businessHours]);

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

  // Search: apply on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setQ(qInput);
      setShowSearchDropdown(false);
    }
    if (e.key === "Escape") {
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSelect = (term: string) => {
    setQInput(term);
    setQ(term);
    setShowSearchDropdown(false);
  };

  const handleBusinessSelect = (slug: string) => {
    setShowSearchDropdown(false);
    router.push(`/b/${slug}`);
  };

  // Location: apply on Enter or selection
  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setCity(cityInput);
      if (cityInput.trim()) addToLocationHistory(cityInput.trim());
      setShowLocationDropdown(false);
    }
    if (e.key === "Escape") {
      setShowLocationDropdown(false);
    }
  };

  const handleLocationSelect = useCallback((loc: string) => {
    setCityInput(loc);
    setCity(loc);
    setShowLocationDropdown(false);
  }, []);

  const handlePinClick = useCallback((id: string) => {
    setHighlightedId(id);
    const el = cardRefs.current.get(id);
    const panel = listPanelRef.current;
    if (el && panel) {
      // Scroll within the list panel only — don't touch the page scroll
      const panelRect = panel.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - panelRect.top - panelRect.height / 2 + elRect.height / 2;
      panel.scrollBy({ top: offset, behavior: "smooth" });
    }
  }, []);

  const handleCardHover = useCallback((id: string | null) => {
    setHighlightedId(id);
  }, []);

  const activeFilterCount =
    (q ? 1 : 0) +
    (city ? 1 : 0) +
    (category ? 1 : 0) +
    (whenDate || whenTime !== "anytime" ? 1 : 0);

  const clearFilters = () => {
    setQ("");
    setQInput("");
    setCity("");
    setCityInput("");
    setCategory("");
    setWhenDate(null);
    setWhenTime("anytime");
  };

  const whenLabel = formatWhenLabel(whenDate, whenTime);

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* ── Filters bar ── */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search input + dropdown */}
          <div ref={searchRef} className="relative flex-1">
            <div className="group flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={qInput}
                onChange={(e) => {
                  setQInput(e.target.value);
                  setShowSearchDropdown(e.target.value.length > 0);
                }}
                onFocus={() => qInput.length > 0 && setShowSearchDropdown(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search services or businesses..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {qInput && (
                <button
                  onClick={() => {
                    setQInput("");
                    setQ("");
                    setShowSearchDropdown(false);
                  }}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showSearchDropdown && (
              <SearchDropdown
                query={qInput}
                businesses={allBusinesses}
                serviceNames={serviceNames}
                onSelectService={handleSearchSelect}
                onSelectBusiness={handleBusinessSelect}
              />
            )}
          </div>

          {/* Location input + dropdown */}
          <div ref={locationRef} className="relative sm:w-44">
            <div className="group flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                onKeyDown={handleCityKeyDown}
                placeholder="City"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {cityInput && (
                <button
                  onClick={() => {
                    setCityInput("");
                    setCity("");
                    setShowLocationDropdown(false);
                  }}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showLocationDropdown && (
              <LocationDropdown onSelectLocation={handleLocationSelect} />
            )}
          </div>

          {/* Category select */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

          {/* When filter */}
          <div ref={whenRef} className="relative">
            <button
              type="button"
              onClick={() => setShowWhenDropdown(!showWhenDropdown)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                whenLabel
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "border-input bg-background text-muted-foreground hover:text-foreground"
              } focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none`}
            >
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">{whenLabel ?? "When"}</span>
              {whenLabel && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhenDate(null);
                    setWhenTime("anytime");
                    setShowWhenDropdown(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      setWhenDate(null);
                      setWhenTime("anytime");
                      setShowWhenDropdown(false);
                    }
                  }}
                  className="rounded-full p-0.5 text-primary/60 hover:text-primary transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
            {showWhenDropdown && (
              <WhenDropdown
                selectedDate={whenDate}
                selectedTime={whenTime}
                onDateChange={(d) => setWhenDate(d)}
                onTimeChange={(t) => setWhenTime(t)}
                onClear={() => {
                  setWhenDate(null);
                  setWhenTime("anytime");
                  setShowWhenDropdown(false);
                }}
              />
            )}
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="group inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* List panel */}
        <div
          ref={listPanelRef}
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
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
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
