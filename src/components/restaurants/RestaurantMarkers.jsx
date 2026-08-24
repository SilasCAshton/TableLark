"use client";

import { useEffect, useMemo } from "react";
import {
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

import { useLocation } from "@/context/LocationContext";
import { useRestaurantSearch } from "@/context/RestaurantSearchContext";

function MapPositionController({
  searchCenter,
  selectedRestaurant,
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !searchCenter) {
      return;
    }

    map.panTo(searchCenter);
  }, [map, searchCenter]);

  useEffect(() => {
    if (!map || !selectedRestaurant?.location) {
      return;
    }

    map.panTo(selectedRestaurant.location);

    const currentZoom = map.getZoom() ?? 12;

    if (currentZoom < 14) {
      map.setZoom(14);
    }
  }, [map, selectedRestaurant]);

  return null;
}

function RestaurantMarkers() {
  const { location } = useLocation();

  const {
    restaurants,
    selectedRestaurant,
    selectRestaurant,
  } = useRestaurantSearch();

  const searchCenter = useMemo(
    () => ({
      lat: Number(location.lat),
      lng: Number(location.lng),
    }),
    [location.lat, location.lng],
  );

  return (
    <>
      <MapPositionController
        searchCenter={searchCenter}
        selectedRestaurant={selectedRestaurant}
      />

      <AdvancedMarker
        position={searchCenter}
        title="Your search location"
        zIndex={1000}
      >
        <Pin
          background="#ffe066"
          borderColor="#1a1d2e"
          glyphColor="#1a1d2e"
          glyphText="TL"
          scale={1.15}
        />
      </AdvancedMarker>

      {restaurants.map((restaurant) => {
        const isSelected =
          selectedRestaurant?.id === restaurant.id;

        return (
          <AdvancedMarker
            key={restaurant.id}
            position={restaurant.location}
            title={`${restaurant.name} — ${
              restaurant.primaryTypeDisplayName ?? "Restaurant"
            }`}
            zIndex={isSelected ? 100 : 1}
            onClick={() => selectRestaurant(restaurant.id)}
          >
            <Pin
              background="#ff6b6b"
              borderColor={isSelected ? "#1a1d2e" : "#ffffff"}
              glyphColor="#ffffff"
              glyphSrc={
                restaurant.iconMaskBaseURI
                  ? `${restaurant.iconMaskBaseURI}.svg`
                  : undefined
              }
              glyphText={
                restaurant.iconMaskBaseURI ? undefined : "R"
              }
              scale={isSelected ? 1.2 : 1}
            />
          </AdvancedMarker>
        );
      })}

      {selectedRestaurant?.location && (
        <InfoWindow
          position={selectedRestaurant.location}
          onCloseClick={() => selectRestaurant(null)}
        >
          <div className="restaurant-info-window">
            <h3>{selectedRestaurant.name}</h3>

            <p>{selectedRestaurant.address}</p>

            {selectedRestaurant.rating !== null && (
              <p>
                ★ {selectedRestaurant.rating.toFixed(1)}
                {selectedRestaurant.reviewCount !== null &&
                  ` · ${selectedRestaurant.reviewCount.toLocaleString()} reviews`}
              </p>
            )}

            {selectedRestaurant.googleMapsURI && (
              <a
                href={selectedRestaurant.googleMapsURI}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default RestaurantMarkers;
