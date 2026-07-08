"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation, Clock, Trash2, Loader2 } from "lucide-react";

const HISTORY_KEY = "zawadi_location_history";
const MAX_HISTORY = 5;

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {}
}

export function addToLocationHistory(city: string) {
  if (!city.trim()) return;
  const history = getHistory();
  const filtered = history.filter((h) => h.toLowerCase() !== city.toLowerCase());
  saveHistory([city.trim(), ...filtered]);
}

export function LocationDropdown({
  onSelectLocation,
  variant = "default",
}: {
  onSelectLocation: (city: string) => void;
  variant?: "default" | "glass";
}) {
  const [history, setHistory] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`,
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Unknown";
          onSelectLocation(city);
          addToLocationHistory(city);
          setHistory(getHistory());
        } catch {
          setGeoError("Could not determine city");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setGeoError("Location access denied");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, [onSelectLocation]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return (
    <div
      className={`absolute left-0 top-full z-50 mt-2 w-full min-w-[220px] overflow-hidden rounded-xl shadow-xl sm:w-[280px] ${
        variant === "glass"
          ? "border border-white/20 bg-black/60 backdrop-blur-xl"
          : "border border-border bg-card"
      }`}
    >
      {/* Your Location */}
      <div>
        <div className="px-3 pb-1 pt-2.5">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              variant === "glass" ? "text-white/50" : "text-muted-foreground"
            }`}
          >
            Your location
          </span>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleGeolocate}
          disabled={locating}
          className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-60 ${
            variant === "glass" ? "hover:bg-white/10" : "hover:bg-muted"
          }`}
        >
          {locating ? (
            <Loader2 className={`h-4 w-4 animate-spin ${variant === "glass" ? "text-white/70" : "text-primary"}`} />
          ) : (
            <Navigation className={`h-4 w-4 ${variant === "glass" ? "text-white/70" : "text-primary"}`} />
          )}
          <span className={`font-medium ${variant === "glass" ? "text-white" : "text-primary"}`}>
            {locating ? "Detecting location..." : "Use my current location"}
          </span>
        </button>
        {geoError && (
          <p className="px-3 pb-2 text-xs text-destructive">{geoError}</p>
        )}
      </div>

      {/* Location History */}
      {history.length > 0 && (
        <>
          <div className={variant === "glass" ? "border-t border-white/10" : "border-t border-border"} />
          <div>
            <div className="flex items-center justify-between px-3 pb-1 pt-2.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  variant === "glass" ? "text-white/50" : "text-muted-foreground"
                }`}
              >
                Recent locations
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearHistory}
                className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-destructive ${
                  variant === "glass" ? "text-white/40" : "text-muted-foreground"
                }`}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
            {history.map((loc) => (
              <button
                key={loc}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectLocation(loc)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  variant === "glass"
                    ? "text-white hover:bg-white/10"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Clock className={`h-3.5 w-3.5 ${variant === "glass" ? "text-white/40" : "text-muted-foreground"}`} />
                <span>{loc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
