"use client";

import { useEffect, useState } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";

import { useLocation } from "@/context/LocationContext";
import RestaurantMarkers from "./restaurants/RestaurantMarkers";

const MOBILE_MAP_QUERY = "(max-width: 720px)";

function ResponsiveMapControls() {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const mobileQuery = window.matchMedia(MOBILE_MAP_QUERY);

    function updateCameraControl() {
      map.setOptions({
        cameraControl: !mobileQuery.matches,
      });
    }

    updateCameraControl();
    mobileQuery.addEventListener("change", updateCameraControl);

    return () => {
      mobileQuery.removeEventListener("change", updateCameraControl);
    };
  }, [map]);

  return null;
}

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
          <p>Loading the map...</p>
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
        <ResponsiveMapControls />
        <RestaurantMarkers />
      </Map>
    </section>
  );
}

export default RestaurantMap;
