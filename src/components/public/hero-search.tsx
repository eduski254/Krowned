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
  variant = "pill",
}: {
  businesses: SearchBusiness[];
  serviceNames: ServiceSuggestion[];
  variant?: "pill" | "card";
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

  if (variant === "card") {
    return (
      <div className="relative w-full max-w-[600px]">
        {/* Search card — dark with gold accents */}
        <div className="relative z-10 overflow-visible rounded-[5px] border border-[#D9B36C]/25 bg-[#1C1A17]/70 p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.35)] sm:p-2.5">
          {/* Service field — full width */}
          <div ref={searchRef} className="relative">
            <div className="group flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-[18px] sm:py-3.5">
              <Search className="h-4 w-4 shrink-0 text-[#E4C783] sm:h-[19px] sm:w-[19px]" />
              <input
                type="text"
                value={qInput}
                onChange={(e) => {
                  setQInput(e.target.value);
                  setShowSearch(e.target.value.length > 0);
                }}
                onFocus={() => qInput.length > 0 && setShowSearch(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Knotless braids, retwist, silk press…"
                className="w-full min-w-0 bg-transparent text-[13px] text-[#F2E7D3] placeholder:text-[#F2E7D3]/55 outline-none sm:text-[15px]"
              />
              {qInput && (
                <button
                  type="button"
                  onClick={() => { setQInput(""); setShowSearch(false); }}
                  className="shrink-0 rounded-full p-0.5 text-[#F2E7D3]/50 hover:text-[#F2E7D3] transition-colors"
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

          {/* Horizontal divider */}
          <div className="mx-3.5 h-px bg-[#E4C783]/15" />

          {/* Location + Date row */}
          <div className="flex flex-col sm:flex-row">
            <div ref={locationRef} className="relative flex-1 min-w-0">
              <div className="group flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-[18px] sm:py-3.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#E4C783] sm:h-[19px] sm:w-[19px]" />
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onFocus={() => setShowLocation(true)}
                  onKeyDown={handleCityKeyDown}
                  placeholder="DMV, city or area"
                  className="w-full min-w-0 bg-transparent text-[13px] text-[#F2E7D3] placeholder:text-[#F2E7D3]/55 outline-none sm:text-[15px]"
                />
                {cityInput && (
                  <button
                    type="button"
                    onClick={() => { setCityInput(""); setShowLocation(false); }}
                    className="shrink-0 rounded-full p-0.5 text-[#F2E7D3]/50 hover:text-[#F2E7D3] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {showLocation && (
                <LocationDropdown onSelectLocation={handleLocationSelect} variant="glass" />
              )}
            </div>

            {/* Vertical divider (desktop) / Horizontal divider (mobile) */}
            <div className="mx-3.5 h-px bg-[#E4C783]/15 sm:hidden" />
            <div className="hidden sm:block w-px my-2.5 bg-[#E4C783]/15" />

            <div ref={whenRef} className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setShowWhen(!showWhen)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-all sm:gap-3 sm:px-[18px] sm:py-3.5 sm:text-[15px] ${
                  whenLabel
                    ? "font-medium text-[#F2E7D3]"
                    : "text-[#F2E7D3]/55 hover:text-[#F2E7D3]"
                }`}
              >
                <Calendar className="h-4 w-4 shrink-0 text-[#E4C783] sm:h-[19px] sm:w-[19px]" />
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
                    className="shrink-0 rounded-full p-0.5 text-[#F2E7D3]/50 hover:text-[#F2E7D3] transition-colors cursor-pointer"
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
          </div>

          {/* Full-width search button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="group/btn relative mt-1.5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-[5px] bg-[linear-gradient(150deg,rgba(228,199,131,0.25)_0%,rgba(228,199,131,0.15)_50%,rgba(198,161,91,0.25)_100%)] border border-[#E4C783]/30 px-3 py-3 text-[13px] font-semibold text-white backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_0_0_rgba(0,0,0,0.1),0_0_0_1px_rgba(228,199,131,0.08),0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-300 hover:bg-[linear-gradient(150deg,rgba(228,199,131,0.35)_0%,rgba(228,199,131,0.25)_50%,rgba(198,161,91,0.35)_100%)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_-1px_0_0_rgba(0,0,0,0.1),0_0_0_1px_rgba(228,199,131,0.15),0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-px active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(228,199,131,0.08)] sm:mt-2 sm:gap-2.5 sm:px-4 sm:py-4 sm:text-base"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "glare 3s ease-in-out infinite" }} />
            <Search className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" />
            Search stylists
          </button>
        </div>

        {/* Popular chips */}
        <div className="relative z-0 mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-2.5 sm:flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scrollbar-hide max-sm:pb-1">
          <span className="shrink-0 text-[11px] text-[#F2E7D3]/55 sm:text-[13px]">Popular</span>
          {["Knotless braids", "Locs", "Silk press", "Sew-in", "Retwist"].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQInput(term);
                handleSubmitWithQuery(term);
              }}
              className="shrink-0 rounded-[5px] border border-[#D9B36C]/40 bg-transparent px-3 py-1 text-[11px] text-[#F2E7D3] transition-all hover:bg-[#D9B36C]/12 hover:border-[#D9B36C] active:scale-95 sm:px-4 sm:py-1.5 sm:text-[13px]"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-2 sm:px-0">
      {/* Single-row search bar — glassmorphism */}
      <div className="relative z-10 flex flex-col gap-1.5 overflow-visible rounded-[5px] border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur-lg sm:flex-row sm:items-center sm:gap-0 sm:p-1.5">
        {/* Search field */}
        <div ref={searchRef} className="relative flex-1 min-w-0">
          <div className="group flex items-center gap-2 rounded-[5px] px-3 py-2.5 transition-all focus-within:bg-white/10 sm:px-4">
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
          <div className="group flex items-center gap-2 rounded-[5px] px-3 py-2.5 transition-all focus-within:bg-white/10 sm:px-4">
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
            className={`flex w-full items-center gap-2 rounded-[5px] px-3 py-2.5 text-left text-sm transition-all sm:px-4 ${
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
          className="flex shrink-0 items-center justify-center gap-2 rounded-[5px] bg-white/20 border border-white/30 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/30 hover:shadow-xl active:scale-[0.98] sm:px-5 sm:py-2.5"
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
            className="rounded-[5px] border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
