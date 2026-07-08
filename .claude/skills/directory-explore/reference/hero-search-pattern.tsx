// Reference pattern for a Booksy-style hero search bar on a landing page
// Reuses the shared search components (search-dropdown, location-dropdown, when-filter)

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
  const [qInput, setQInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [whenDate, setWhenDate] = useState<string | null>(null);
  const [whenTime, setWhenTime] = useState<TimeOfDay>("anytime");
  const [showSearch, setShowSearch] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showWhen, setShowWhen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const whenRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocation(false);
      if (whenRef.current && !whenRef.current.contains(e.target as Node)) setShowWhen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const whenLabel = formatWhenLabel(whenDate, whenTime);

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

  // Key layout pattern:
  // - Rounded container with backdrop blur on hero image
  // - Row 1: Search field + divider + Location field (stack on mobile)
  // - Row 2: When button + Search submit button
  // - Below: Popular quick-search chips
  // - All responsive: px-3 py-2.5 on mobile, sm:px-4 sm:py-3 on larger

  return (
    <div className="mx-auto w-full max-w-2xl px-2 sm:px-0">
      <div className="rounded-2xl bg-background/95 p-2 shadow-2xl backdrop-blur-sm ring-1 ring-white/10 sm:p-3">
        {/* Row 1 */}
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <div ref={searchRef} className="relative flex-1 min-w-0">
            {/* Search input + SearchDropdown */}
          </div>
          <div className="hidden sm:flex sm:items-center">
            <div className="h-8 w-px bg-border" />
          </div>
          <div ref={locationRef} className="relative sm:w-44 md:w-48">
            {/* Location input + LocationDropdown */}
          </div>
        </div>
        {/* Row 2 */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div ref={whenRef} className="relative flex-1 min-w-0">
            {/* When button + WhenDropdown */}
          </div>
          <button onClick={handleSubmit} className="shrink-0 rounded-xl bg-primary px-4 py-2.5 sm:px-6 sm:py-3">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
      {/* Popular chips */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 px-2">
        <span className="text-xs text-white/60">Popular:</span>
        {["Term1", "Term2", "Term3"].map((term) => (
          <button key={term} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white">
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
