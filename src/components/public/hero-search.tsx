"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, X } from "lucide-react";
import {
  SearchDropdown,
  type ServiceSuggestion,
  type SearchBusiness,
} from "@/components/search/search-dropdown";
import {
  LocationDropdown,
  addToLocationHistory,
} from "@/components/search/location-dropdown";
import {
  WhenDropdown,
  formatWhenLabel,
  type TimeOfDay,
} from "@/components/search/when-filter";

export function HeroSearch({
  businesses,
  serviceNames,
}: {
  businesses: SearchBusiness[];
  serviceNames: ServiceSuggestion[];
}) {
  const router = useRouter();

  // Input state
  const [qInput, setQInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [whenDate, setWhenDate] = useState<string | null>(null);
  const [whenTime, setWhenTime] = useState<TimeOfDay>("anytime");

  // Dropdown visibility
  const [showSearch, setShowSearch] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showWhen, setShowWhen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const whenRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocation(false);
      }
      if (whenRef.current && !whenRef.current.contains(e.target as Node)) {
        setShowWhen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const whenLabel = formatWhenLabel(whenDate, whenTime);

  // Navigate to explore with all filters
  const handleSubmit = useCallback(() => {
    const params = new URLSearchParams();
    if (qInput.trim()) params.set("q", qInput.trim());
    if (cityInput.trim()) {
      params.set("city", cityInput.trim());
      addToLocationHistory(cityInput.trim());
    }
    if (whenDate) params.set("date", whenDate);
    if (whenTime !== "anytime") params.set("time", whenTime);
    router.push(`/explore${params.toString() ? `?${params}` : ""}`);
  }, [qInput, cityInput, whenDate, whenTime, router]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSearch(false);
      handleSubmit();
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowLocation(false);
      handleSubmit();
    }
  };

  const handleSearchSelect = useCallback((name: string) => {
    setQInput(name);
    setShowSearch(false);
  }, []);

  const handleBusinessSelect = useCallback(
    (slug: string) => {
      router.push(`/b/${slug}`);
    },
    [router],
  );

  const handleLocationSelect = useCallback((loc: string) => {
    setCityInput(loc);
    setShowLocation(false);
  }, []);

  function handleSubmitWithQuery(searchTerm: string) {
    const params = new URLSearchParams();
    params.set("q", searchTerm);
    if (cityInput.trim()) {
      params.set("city", cityInput.trim());
      addToLocationHistory(cityInput.trim());
    }
    if (whenDate) params.set("date", whenDate);
    if (whenTime !== "anytime") params.set("time", whenTime);
    router.push(`/explore?${params}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-2 sm:px-0">
      {/* Main search bar container */}
      <div className="rounded-2xl bg-background/95 p-2 shadow-2xl backdrop-blur-sm ring-1 ring-white/10 sm:p-3">
        {/* Row 1: Search + Location — stack on mobile, side-by-side on sm+ */}
        <div className="flex flex-col gap-1.5 sm:flex-row">
          {/* Search field */}
          <div ref={searchRef} className="relative flex-1 min-w-0">
            <div className="group flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/30 sm:px-4 sm:py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary sm:h-5 sm:w-5" />
              <input
                type="text"
                value={qInput}
                onChange={(e) => {
                  setQInput(e.target.value);
                  setShowSearch(e.target.value.length > 0);
                }}
                onFocus={() => qInput.length > 0 && setShowSearch(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Hair, nails, massage..."
                className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {qInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQInput("");
                    setShowSearch(false);
                  }}
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showSearch && (
              <SearchDropdown
                query={qInput}
                businesses={businesses}
                serviceNames={serviceNames}
                onSelectService={handleSearchSelect}
                onSelectBusiness={handleBusinessSelect}
              />
            )}
          </div>

          {/* Divider — hidden on mobile */}
          <div className="hidden sm:flex sm:items-center">
            <div className="h-8 w-px bg-border" />
          </div>

          {/* Location field */}
          <div ref={locationRef} className="relative sm:w-44 md:w-48">
            <div className="group flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/30 sm:px-4 sm:py-3">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary sm:h-5 sm:w-5" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onFocus={() => setShowLocation(true)}
                onKeyDown={handleCityKeyDown}
                placeholder="City or area"
                className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {cityInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCityInput("");
                    setShowLocation(false);
                  }}
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {showLocation && (
              <LocationDropdown onSelectLocation={handleLocationSelect} />
            )}
          </div>
        </div>

        {/* Row 2: When + Search button */}
        <div className="mt-1.5 flex items-center gap-1.5">
          {/* When filter */}
          <div ref={whenRef} className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setShowWhen(!showWhen)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all sm:px-4 sm:py-3 ${
                whenLabel
                  ? "bg-primary/5 font-medium text-primary ring-1 ring-primary/20"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="flex-1 truncate">
                {whenLabel ?? "Any date"}
              </span>
              {whenLabel && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhenDate(null);
                    setWhenTime("anytime");
                    setShowWhen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      setWhenDate(null);
                      setWhenTime("anytime");
                      setShowWhen(false);
                    }
                  }}
                  className="shrink-0 rounded-full p-0.5 text-primary/60 hover:text-primary transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
            {showWhen && (
              <WhenDropdown
                selectedDate={whenDate}
                selectedTime={whenTime}
                onDateChange={(d) => setWhenDate(d)}
                onTimeChange={(t) => setWhenTime(t)}
                onClear={() => {
                  setWhenDate(null);
                  setWhenTime("anytime");
                  setShowWhen(false);
                }}
              />
            )}
          </div>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] sm:px-6 sm:py-3"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Popular searches — below with clear spacing */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 px-2">
        <span className="text-xs text-white/60">Popular:</span>
        {["Braids", "Nails", "Massage", "Barber", "Facial"].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQInput(term);
              handleSubmitWithQuery(term);
            }}
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
