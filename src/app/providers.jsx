"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

import { LocationProvider } from "@/context/LocationContext";
import { MapViewportProvider } from "@/context/MapViewportContext";
import PollBuilderProvider from "@/context/PollBuilderProvider";
import { RestaurantSearchProvider } from "@/context/RestaurantSearchContext";

export default function AppProviders({ children, initialLocation }) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    >
      <LocationProvider initialLocation={initialLocation}>
        <MapViewportProvider>
          <RestaurantSearchProvider>
            <PollBuilderProvider>
              {children}
            </PollBuilderProvider>
          </RestaurantSearchProvider>
        </MapViewportProvider>
      </LocationProvider>
    </APIProvider>
  );
}
