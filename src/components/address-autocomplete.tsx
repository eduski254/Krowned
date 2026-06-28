"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export interface AddressResult {
  address: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  id?: string;
  /** Current address text */
  value: string;
  /** Called on every keystroke (plain text) */
  onChange: (value: string) => void;
  /** Called when a Place suggestion is selected */
  onPlaceSelect: (result: AddressResult) => void;
  placeholder?: string;
  required?: boolean;
  /** Name attribute for form submission */
  name?: string;
}

interface Prediction {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
}

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGooglePlaces(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (!API_KEY) return Promise.reject(new Error("No API key"));

  return new Promise((resolve, reject) => {
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    scriptLoading = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing an address...",
  required,
  name,
}: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placesReady, setPlacesReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Load the script on mount
  useEffect(() => {
    if (!API_KEY) return;
    loadGooglePlaces()
      .then(() => setPlacesReady(true))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getSessionToken = useCallback(() => {
    if (!sessionTokenRef.current && placesReady) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, [placesReady]);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!placesReady || !input || input.length < 3) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input,
          types: ["address"],
          sessionToken: getSessionToken() ?? undefined,
        },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(
              results.map((r) => ({
                placeId: r.place_id,
                text: r.description,
                mainText: r.structured_formatting.main_text,
                secondaryText: r.structured_formatting.secondary_text,
              })),
            );
            setIsOpen(true);
            setActiveIndex(-1);
          } else {
            setPredictions([]);
            setIsOpen(false);
          }
        },
      );
    },
    [placesReady, getSessionToken],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  }

  function selectPrediction(prediction: Prediction) {
    setIsOpen(false);
    setPredictions([]);
    onChange(prediction.text);

    // Get place details for lat/lng and address components
    const div = document.createElement("div");
    const service = new google.maps.places.PlacesService(div);

    service.getDetails(
      {
        placeId: prediction.placeId,
        fields: ["geometry", "address_components", "formatted_address"],
        sessionToken: getSessionToken() ?? undefined,
      },
      (place, status) => {
        // Reset session token after getDetails (billing boundary)
        sessionTokenRef.current = null;

        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          onPlaceSelect({
            address: prediction.text,
            city: "",
            country: "",
            lat: null,
            lng: null,
          });
          return;
        }

        const lat = place.geometry?.location?.lat() ?? null;
        const lng = place.geometry?.location?.lng() ?? null;
        const formattedAddress = place.formatted_address ?? prediction.text;

        let city = "";
        let country = "";
        for (const comp of place.address_components ?? []) {
          if (comp.types.includes("locality")) {
            city = comp.long_name;
          } else if (
            !city &&
            comp.types.includes("administrative_area_level_1")
          ) {
            city = comp.long_name;
          }
          if (comp.types.includes("country")) {
            country = comp.short_name;
          }
        }

        onChange(formattedAddress);
        onPlaceSelect({
          address: formattedAddress,
          city,
          country,
          lat,
          lng,
        });
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-activedescendant={
            activeIndex >= 0 && id
              ? `${id}-option-${activeIndex}`
              : undefined
          }
          className="mt-1 block w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isOpen && predictions.length > 0 && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg"
        >
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              id={id ? `${id}-option-${i}` : undefined}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => selectPrediction(p)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm transition-colors ${
                i === activeIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="font-medium">{p.mainText}</span>
                {p.secondaryText && (
                  <span className="ml-1 text-muted-foreground">
                    {p.secondaryText}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
