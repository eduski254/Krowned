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
import type { ExploreBusiness } from "@/lib/explore/actions";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

const DEFAULT_CENTER = { lat: 38.9072, lng: -77.0369 };
const DEFAULT_ZOOM = 12;

export function ExploreMap({
  businesses,
  highlightedId,
  onPinClick,
  onSelectBiz,
}: {
  businesses: ExploreBusiness[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
  onSelectBiz?: (biz: ExploreBusiness) => void;
}) {
  if (!API_KEY) return null;

  return (
    <APIProvider apiKey={API_KEY} libraries={["marker"]}>
      <Map
        className="h-full w-full"
        defaultCenter={DEFAULT_CENTER}
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
          onSelectBiz={onSelectBiz}
        />
      </Map>
    </APIProvider>
  );
}

function MapContent({
  businesses,
  highlightedId,
  onPinClick,
  onSelectBiz,
}: {
  businesses: ExploreBusiness[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
  onSelectBiz?: (biz: ExploreBusiness) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker> | null>(null);
  if (markersRef.current == null) markersRef.current = new globalThis.Map();
  const [selectedBiz, setSelectedBiz] = useState<ExploreBusiness | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initialize clusterer
  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: [] });
    }
  }, [map]);

  // Auto-fit bounds when filtered businesses change
  const bizIds = businesses.map((b) => b.id).sort().join(",");
  useEffect(() => {
    if (!map || businesses.length === 0) return;

    if (businesses.length === 1) {
      map.panTo({
        lat: businesses[0].latitude!,
        lng: businesses[0].longitude!,
      });
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const biz of businesses) {
      bounds.extend({ lat: biz.latitude!, lng: biz.longitude! });
    }
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bizIds is derived from businesses
  }, [map, bizIds]);

  // Update clusterer when markers change
  const setMarkerRef = useCallback(
    (marker: Marker | null, id: string) => {
      if (marker) {
        markersRef.current!.set(id, marker);
      } else {
        markersRef.current!.delete(id);
      }

      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.addMarkers(
          Array.from(markersRef.current!.values()),
        );
      }
    },
    [],
  );

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
            // Quick zoom pulse effect
            if (map) {
              const current = map.getZoom() ?? 14;
              map.panTo({ lat: biz.latitude!, lng: biz.longitude! });
              map.setZoom(current + 1.5);
              setTimeout(() => map.setZoom(current + 0.5), 350);
            }
          }}
        >
          <div
            onMouseEnter={() => {
              clearTimeout(hoverTimeout.current);
              setSelectedBiz(biz);
            }}
            onMouseLeave={() => {
              hoverTimeout.current = setTimeout(() => setSelectedBiz(null), 200);
            }}
          >
            <svg
              width="26"
              height="34"
              viewBox="-2 -2 26 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))" }}
            >
              <path
                d="M11 0C4.925 0 0 4.925 0 11c0 7.5 10 18.1 10.5 18.6.14.12.32.18.5.18s.36-.06.5-.18C12 29.1 22 18.5 22 11 22 4.925 17.075 0 11 0z"
                fill={highlightedId === biz.id || selectedBiz?.id === biz.id ? "#000000" : "#1A1816"}
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx="11" cy="11" r="4" fill="white" />
            </svg>
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
          pixelOffset={[0, -32]}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (onSelectBiz) {
                onSelectBiz(selectedBiz);
                setSelectedBiz(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSelectBiz) {
                onSelectBiz(selectedBiz);
                setSelectedBiz(null);
              }
            }}
            className="block max-w-[220px] cursor-pointer overflow-hidden rounded-lg bg-card px-3 py-2.5"
          >
            <p className="text-[13px] font-bold text-foreground" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              {selectedBiz.name}
            </p>
            <div className="mt-0.5">
              <StarRating
                value={selectedBiz.avgRating}
                count={selectedBiz.reviewCount}
                size="xs"
              />
            </div>
            {selectedBiz.categoryName && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {[selectedBiz.categoryName, selectedBiz.city].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
