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
    <div className="relative mx-auto w-full max-w-3xl px-2 sm:px-0">
      {/* Single-row search bar — glassmorphism */}
      <div className="relative z-10 flex flex-col gap-1.5 overflow-visible rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur-lg sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5">
        {/* Search field */}
        <div ref={searchRef} className="relative flex-1 min-w-0">
          <div className="group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all focus-within:bg-white/10 sm:rounded-full sm:px-4">
            <Search className="h-4 w-4 shrink-0 text-white/60 transition-colors group-focus-within:text-white" />
            <input
              type="text"
              value={qInput}
              onChange={(e) => {
                setQInput(e.target.value);
                setShowSearch(e.target.value.length > 0);
              }}
              onFocus={() => qInput.length > 0 && setShowSearch(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Knotless braids, retwist, silk press..."
              className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
            />
            {qInput && (
              <button
                type="button"
                onClick={() => {
                  setQInput("");
                  setShowSearch(false);
                }}
                className="shrink-0 rounded-full p-0.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
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
              variant="glass"
            />
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-white/20" />

        {/* Location field */}
        <div ref={locationRef} className="relative sm:w-40 md:w-44">
          <div className="group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all focus-within:bg-white/10 sm:rounded-full sm:px-4">
            <MapPin className="h-4 w-4 shrink-0 text-white/60 transition-colors group-focus-within:text-white" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onFocus={() => setShowLocation(true)}
              onKeyDown={handleCityKeyDown}
              placeholder="DMV, city or area"
              className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
            />
            {cityInput && (
              <button
                type="button"
                onClick={() => {
                  setCityInput("");
                  setShowLocation(false);
                }}
                className="shrink-0 rounded-full p-0.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {showLocation && (
            <LocationDropdown onSelectLocation={handleLocationSelect} variant="glass" />
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-white/20" />

        {/* When filter */}
        <div ref={whenRef} className="relative sm:w-36 md:w-40">
          <button
            type="button"
            onClick={() => setShowWhen(!showWhen)}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all sm:rounded-full sm:px-4 ${
              whenLabel
                ? "bg-white/15 font-medium text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">
              {whenLabel ?? <span className="text-white/50">Any date</span>}
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
                className="shrink-0 rounded-full p-0.5 text-white/50 hover:text-white transition-colors cursor-pointer"
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
              variant="glass"
            />
          )}
        </div>

        {/* Search button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/20 border border-white/30 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/30 hover:shadow-xl active:scale-[0.98] sm:rounded-full sm:px-5 sm:py-2.5"
        >
          <Search className="h-4 w-4" />
          <span className="sm:hidden">Search</span>
        </button>
      </div>

      {/* Popular searches — below with clear spacing */}
      <div className="relative z-0 mt-8 flex flex-wrap items-center justify-center gap-2 px-2">
        <span className="text-xs text-white/60">Popular:</span>
        {["Knotless braids", "Locs", "Silk press", "Sew-in", "Fade", "Retwist"].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQInput(term);
              handleSubmitWithQuery(term);
            }}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
