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

// Singleton flag to prevent multiple APIProvider script injections
let apiProviderMounted = false;

export function ExploreMap({
  businesses,
  highlightedId,
  onPinClick,
  onBoundsChanged,
  onSelectBiz,
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
  onSelectBiz?: (biz: ExploreBusiness) => void;
}) {
  useEffect(() => {
    apiProviderMounted = true;
    return () => { apiProviderMounted = false; };
  }, []);

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
          onBoundsChanged={onBoundsChanged}
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
  onBoundsChanged,
  onSelectBiz,
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
  onSelectBiz?: (biz: ExploreBusiness) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker> | null>(null);
  if (!markersRef.current) markersRef.current = new globalThis.Map();
  const [selectedBiz, setSelectedBiz] = useState<ExploreBusiness | null>(null);

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
          }}
        >
          {/* Location pin icon */}
          <div
            className={`transition-transform duration-200 ${
              highlightedId === biz.id ? "scale-125" : "hover:scale-110"
            }`}
          >
            <svg
              width="32"
              height="40"
              viewBox="0 0 32 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              {/* Pin body */}
              <path
                d="M16 0C7.163 0 0 7.163 0 16c0 10 14.4 23.1 15 23.7.3.2.7.3 1 .3s.7-.1 1-.3c.6-.6 15-13.7 15-23.7C32 7.163 24.837 0 16 0z"
                fill={highlightedId === biz.id ? "#8A6A2F" : "#D9B36C"}
              />
              {/* White inner circle */}
              <circle cx="16" cy="15" r="7" fill="white" />
              {/* Letter */}
              <text
                x="16"
                y="19"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={highlightedId === biz.id ? "#8A6A2F" : "#D9B36C"}
                fontFamily="system-ui, sans-serif"
              >
                {biz.name.charAt(0)}
              </text>
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
          pixelOffset={[0, -44]}
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
            className="block max-w-[240px] cursor-pointer overflow-hidden rounded-lg"
          >
            {/* Cover image */}
            {selectedBiz.imageUrl ? (
              <div className="h-24 w-full overflow-hidden">
                <img
                  src={selectedBiz.imageUrl}
                  alt={selectedBiz.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-full items-center justify-center bg-secondary text-2xl font-bold text-primary">
                {selectedBiz.name.charAt(0)}
              </div>
            )}
            <div className="p-2.5">
              <p className="font-semibold text-sm text-gray-900">
                {selectedBiz.name}
              </p>
              {selectedBiz.categoryName && (
                <p className="text-xs text-gray-500">
                  {selectedBiz.categoryName}
                </p>
              )}
              {selectedBiz.city && (
                <p className="text-xs text-gray-400">{selectedBiz.city}</p>
              )}
              <div className="mt-1.5 flex items-center justify-between">
                <StarRating
                  value={selectedBiz.avgRating}
                  count={selectedBiz.reviewCount}
                  size="xs"
                />
                <span className="text-xs font-semibold text-primary">
                  View &rarr;
                </span>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
