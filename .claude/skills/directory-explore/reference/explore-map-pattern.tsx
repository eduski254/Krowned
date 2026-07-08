// Reference pattern for Google Maps integration with directory listings
// Key techniques: lazy loading, SVG pins, InfoWindows, auto-fit bounds, marker clustering

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import Link from "next/link";

// --- Usage in parent (lazy load to avoid SSR crash) ---
// const ExploreMap = lazy(() =>
//   import("./explore-map").then((m) => ({ default: m.ExploreMap })),
// );
//
// <Suspense fallback={<MapSkeleton />}>
//   <ExploreMap businesses={mappable} highlightedId={id} onPinClick={fn} />
// </Suspense>

type Listing = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  categoryName: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  avgRating: number | null;
  reviewCount: number;
};

const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 }; // Adapt to your region
const DEFAULT_ZOOM = 12;

export function ExploreMap({
  businesses,
  highlightedId,
  onPinClick,
}: {
  businesses: Listing[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
}) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <Map
        className="h-full w-full"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        fullscreenControl
        clickableIcons={false}
      >
        <MapContent
          businesses={businesses}
          highlightedId={highlightedId}
          onPinClick={onPinClick}
        />
      </Map>
    </APIProvider>
  );
}

function MapContent({
  businesses,
  highlightedId,
  onPinClick,
}: {
  businesses: Listing[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef(new window.Map<string, Marker>());
  const [selectedBiz, setSelectedBiz] = useState<Listing | null>(null);
  const prevBizIdsRef = useRef<string>("");

  // Initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: [] });
    }
  }, [map]);

  // Auto-fit bounds when listings change
  useEffect(() => {
    if (!map || businesses.length === 0) return;

    const bizIds = businesses.map((b) => b.id).sort().join(",");
    if (bizIds === prevBizIdsRef.current) return;
    prevBizIdsRef.current = bizIds;

    if (businesses.length === 1) {
      map.panTo({ lat: businesses[0].latitude, lng: businesses[0].longitude });
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const biz of businesses) {
      bounds.extend({ lat: biz.latitude, lng: biz.longitude });
    }
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [map, businesses]);

  // Update clusterer when markers change
  const setMarkerRef = useCallback((marker: Marker | null, id: string) => {
    if (marker) {
      markersRef.current.set(id, marker);
    } else {
      markersRef.current.delete(id);
    }
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(
        Array.from(markersRef.current.values()),
      );
    }
  }, []);

  return (
    <>
      {businesses.map((biz) => (
        <AdvancedMarker
          key={biz.id}
          position={{ lat: biz.latitude, lng: biz.longitude }}
          ref={(marker) => setMarkerRef(marker as unknown as Marker, biz.id)}
          onClick={() => {
            setSelectedBiz(biz);
            onPinClick(biz.id);
          }}
        >
          {/* SVG location pin — adapt colors to your brand */}
          <div
            className={`transition-transform duration-200 ${
              highlightedId === biz.id ? "scale-125" : "hover:scale-110"
            }`}
          >
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" className="drop-shadow-md">
              <path
                d="M16 0C7.163 0 0 7.163 0 16c0 10 14.4 23.1 15 23.7.3.2.7.3 1 .3s.7-.1 1-.3c.6-.6 15-13.7 15-23.7C32 7.163 24.837 0 16 0z"
                fill={highlightedId === biz.id ? "#5604ad" : "#7c3aed"}
              />
              <circle cx="16" cy="15" r="7" fill="white" />
              <text x="16" y="19" textAnchor="middle" fontSize="10" fontWeight="700"
                fill={highlightedId === biz.id ? "#5604ad" : "#7c3aed"} fontFamily="system-ui">
                {biz.name.charAt(0)}
              </text>
            </svg>
          </div>
        </AdvancedMarker>
      ))}

      {/* InfoWindow card */}
      {selectedBiz && (
        <InfoWindow
          position={{ lat: selectedBiz.latitude, lng: selectedBiz.longitude }}
          onCloseClick={() => setSelectedBiz(null)}
          pixelOffset={[0, -44]}
        >
          <Link href={`/b/${selectedBiz.slug}`} className="block max-w-[240px] rounded-lg overflow-hidden">
            {selectedBiz.imageUrl ? (
              <div className="h-24 w-full overflow-hidden">
                <img src={selectedBiz.imageUrl} alt={selectedBiz.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-20 w-full items-center justify-center bg-purple-50 text-2xl font-bold text-purple-600">
                {selectedBiz.name.charAt(0)}
              </div>
            )}
            <div className="p-2.5">
              <p className="font-semibold text-sm">{selectedBiz.name}</p>
              {selectedBiz.categoryName && <p className="text-xs text-gray-500">{selectedBiz.categoryName}</p>}
              {selectedBiz.city && <p className="text-xs text-gray-400">{selectedBiz.city}</p>}
            </div>
          </Link>
        </InfoWindow>
      )}
    </>
  );
}
