"use client";

import { useState } from "react";
import { Map } from "@vis.gl/react-google-maps";

import { useLocation } from "@/context/LocationContext";
import RestaurantMarkers from "./restaurants/RestaurantMarkers";
function RestaurantMap() {
  const { location } = useLocation();
  const [isMapReady, setIsMapReady] = useState(false);

  const mapCenter = {
    lat: Number(location.lat),
    lng: Number(location.lng),
  };

  return (
    <section
      className="restaurant-map-container"
      aria-label="Restaurant map"
    >
      {!isMapReady && (
        <div className="restaurant-map-loading" role="status">
          <span className="restaurant-map-loading__spinner" aria-hidden="true" />
          <p>Finding your location...</p>
        </div>
      )}

      <Map
        defaultCenter={mapCenter}
        defaultZoom={13}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        onTilesLoaded={() => setIsMapReady(true)}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <RestaurantMarkers />
      </Map>
    </section>
  );
}

export default RestaurantMap;
