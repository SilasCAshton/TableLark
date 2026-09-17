"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

import { MapViewportProvider } from "@/context/MapViewportContext";
import PollBuilderProvider from "@/context/PollBuilderProvider";
import { RestaurantSearchProvider } from "@/context/RestaurantSearchContext";

export default function AppProviders({ children }) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    >
      <MapViewportProvider>
        <RestaurantSearchProvider>
          <PollBuilderProvider>
            {children}
          </PollBuilderProvider>
        </RestaurantSearchProvider>
      </MapViewportProvider>
    </APIProvider>
  );
}
