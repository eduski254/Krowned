"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Navigation } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

export function BusinessMiniMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-3">
      <div className="h-[250px] w-full overflow-hidden rounded-lg">
        <APIProvider apiKey={API_KEY}>
          <Map
            className="h-full w-full"
            defaultCenter={{ lat, lng }}
            defaultZoom={15}
            mapId={MAP_ID}
            gestureHandling="cooperative"
            disableDefaultUI
            zoomControl
            clickableIcons={false}
          >
            <AdvancedMarker position={{ lat, lng }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md">
                <span className="text-xs font-bold">{name.charAt(0)}</span>
              </div>
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <Navigation className="h-4 w-4" />
        Get Directions
      </a>
    </div>
  );
}
