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
import { StarRating } from "@/components/star-rating";
import Link from "next/link";
import type { ExploreBusiness } from "@/lib/explore/actions";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

// Default center: Nairobi
const DEFAULT_CENTER = { lat: -1.2921, lng: 36.8219 };
const DEFAULT_ZOOM = 12;

export function ExploreMap({
  businesses,
  highlightedId,
  onPinClick,
  onBoundsChanged,
}: {
  businesses: ExploreBusiness[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
  onBoundsChanged: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}) {
  // Always open on Nairobi — businesses span multiple countries,
  // so averaging coordinates would center on the ocean.
  const center = DEFAULT_CENTER;

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        className="h-full w-full"
        defaultCenter={center}
        defaultZoom={DEFAULT_ZOOM}
        mapId={MAP_ID}
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
          onBoundsChanged={onBoundsChanged}
        />
      </Map>
    </APIProvider>
  );
}

function MapContent({
  businesses,
  highlightedId,
  onPinClick,
  onBoundsChanged,
}: {
  businesses: ExploreBusiness[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
  onBoundsChanged: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef(new window.Map<string, Marker>());
  const [selectedBiz, setSelectedBiz] = useState<ExploreBusiness | null>(null);
  const isInitialBoundsRef = useRef(true);

  // Initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: [] });
    }
  }, [map]);

  // Update clusterer when markers change
  const setMarkerRef = useCallback(
    (marker: Marker | null, id: string) => {
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
    },
    [],
  );

  // Listen for bounds changes (debounced)
  useEffect(() => {
    if (!map) return;
    let timeout: ReturnType<typeof setTimeout>;

    const listener = map.addListener("idle", () => {
      // Skip the initial bounds event
      if (isInitialBoundsRef.current) {
        isInitialBoundsRef.current = false;
        return;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged({
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng(),
          });
        }
      }, 300);
    });

    return () => {
      clearTimeout(timeout);
      google.maps.event.removeListener(listener);
    };
  }, [map, onBoundsChanged]);

  return (
    <>
      {businesses.map((biz) => (
        <AdvancedMarker
          key={biz.id}
          position={{ lat: biz.latitude!, lng: biz.longitude! }}
          ref={(marker) => setMarkerRef(marker as unknown as Marker, biz.id)}
          onClick={() => {
            setSelectedBiz(biz);
            onPinClick(biz.id);
          }}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md transition-transform ${
              highlightedId === biz.id
                ? "scale-125 border-primary bg-primary text-primary-foreground"
                : "border-background bg-primary text-primary-foreground"
            }`}
          >
            <span className="text-xs font-bold">
              {biz.name.charAt(0)}
            </span>
          </div>
        </AdvancedMarker>
      ))}

      {selectedBiz && (
        <InfoWindow
          position={{
            lat: selectedBiz.latitude!,
            lng: selectedBiz.longitude!,
          }}
          onCloseClick={() => setSelectedBiz(null)}
          pixelOffset={[0, -40]}
        >
          <div className="max-w-[220px] p-1">
            <p className="font-semibold text-sm text-gray-900">
              {selectedBiz.name}
            </p>
            {selectedBiz.categoryName && (
              <p className="text-xs text-gray-500">{selectedBiz.categoryName}</p>
            )}
            <div className="mt-1">
              <StarRating value={selectedBiz.avgRating} count={selectedBiz.reviewCount} size="xs" />
            </div>
            <Link
              href={`/b/${selectedBiz.slug}`}
              className="mt-2 inline-block text-xs font-semibold text-purple-600 hover:underline"
            >
              View &rarr;
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
