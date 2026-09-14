"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AdvancedMarker,
  InfoWindow,
  Pin,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";

import { useLocation } from "@/context/LocationContext";
import { useMapViewport } from "@/context/MapViewportContext";
import { usePollBuilder } from "@/context/PollBuilderContext";
import { POLL_RESTAURANT_COLOR } from "@/lib/restaurants/poll-appearance";
import { useRestaurantSearch } from "@/context/RestaurantSearchContext";

function AnimatedRestaurantPin({ restaurant, isInPoll, isSelected }) {
  const targetColor = isInPoll ? POLL_RESTAURANT_COLOR : "#ff6b6b";
  const targetScale = isInPoll ? 1.5 : isSelected ? 1.2 : 1;
  const [appearance, setAppearance] = useState({ color: targetColor, scale: targetScale });
  const currentAppearance = useRef(appearance);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = currentAppearance.current;
    if (start.color === targetColor && start.scale === targetScale) return;
    const startedAt = performance.now();
    let frame;
    const channels = (color) => color.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16));
    const from = channels(start.color);
    const to = channels(targetColor);

    function update(next) {
      currentAppearance.current = next;
      setAppearance(next);
    }

    function finish() {
      cancelAnimationFrame(frame);
      update({ color: targetColor, scale: targetScale });
    }

    function animate(now) {
      if (motionPreference.matches) {
        finish();
        return;
      }
      const progress = Math.min((now - startedAt) / 250, 1);
      const eased = 1 - (1 - progress) ** 3;
      const color = "#" + from.map((value, index) =>
        Math.round(value + (to[index] - value) * eased).toString(16).padStart(2, "0"),
      ).join("");
      update({ color, scale: start.scale + (targetScale - start.scale) * eased });
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    motionPreference.addEventListener("change", finish);
    return () => {
      cancelAnimationFrame(frame);
      motionPreference.removeEventListener("change", finish);
    };
  }, [targetColor, targetScale]);

  return (
    <Pin
      background={appearance.color}
      borderColor={isSelected ? "#1a1d2e" : "#ffffff"}
      glyphColor="#ffffff"
      glyphSrc={restaurant.iconMaskBaseURI ? `${restaurant.iconMaskBaseURI}.svg` : undefined}
      glyphText={restaurant.iconMaskBaseURI ? undefined : "R"}
      scale={appearance.scale}
    />
  );
}

function MapPositionController({
  searchCenter,
  selectedRestaurant,
}) {
  const map = useMap();
  const { visibleMapCenter } = useMapViewport();
  const lastCameraTarget = useRef(null);

  function panToVisibleCenter(location) {
    if (!map || !location) return;

    lastCameraTarget.current = location;
    const projection = map.getProjection();
    if (!projection || !visibleMapCenter) {
      map.panTo(location);
      return;
    }

    const mapBounds = map.getDiv().getBoundingClientRect();
    const point = projection.fromLatLngToPoint(
      new window.google.maps.LatLng(location),
    );
    if (!point) return;

    const scale = 2 ** (map.getZoom() ?? 12);
    point.x += (mapBounds.width / 2 - visibleMapCenter.x) / scale;
    point.y += (mapBounds.height / 2 - visibleMapCenter.y) / scale;
    const center = projection.fromPointToLatLng(point);
    if (center) map.panTo(center);
  }

  useEffect(() => {
    if (!map || !searchCenter) {
      return;
    }

    panToVisibleCenter(searchCenter);
    // This effect represents a new search-location camera request. Viewport
    // changes are handled separately using the last requested target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, searchCenter]);

  useEffect(() => {
    if (!map || !selectedRestaurant?.location) {
      return;
    }

    const currentZoom = map.getZoom() ?? 12;
    const targetZoom = Math.max(currentZoom, 14);

    if (currentZoom < 14) {
      map.setZoom(targetZoom);
    }

    panToVisibleCenter(selectedRestaurant.location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedRestaurant]);

  useEffect(() => {
    if (!map || !visibleMapCenter || !lastCameraTarget.current) return;
    panToVisibleCenter(lastCameraTarget.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visibleMapCenter]);

  return null;
}

function RestaurantMarkers() {
  const [selectedMarkerRef, selectedMarker] = useAdvancedMarkerRef();
  const { hasRestaurant } = usePollBuilder();
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
        <div className="map-user-marker" aria-label="Your search location">
          <Image
            className="map-user-marker__logo"
            src="/tablelark-logo-classic.png"
            alt=""
            width={48}
            height={48}
          />
        </div>
      </AdvancedMarker>

      {restaurants.map((restaurant) => {
        const isInPoll = hasRestaurant(restaurant.id);
        const isSelected =
          selectedRestaurant?.id === restaurant.id;

        return (
          <AdvancedMarker
            key={restaurant.id}
            ref={isSelected ? selectedMarkerRef : undefined}
            position={restaurant.location}
            title={`${restaurant.name} — ${
              restaurant.primaryTypeDisplayName ?? "Restaurant"
            }`}
            zIndex={isSelected ? 100 : isInPoll ? 50 : 1}
            onClick={() => selectRestaurant(restaurant.id)}
          >
            <AnimatedRestaurantPin
              restaurant={restaurant}
              isInPoll={isInPoll}
              isSelected={isSelected}
            />
          </AdvancedMarker>
        );
      })}

      {selectedRestaurant?.location && (
        <InfoWindow
          key={selectedRestaurant.id}
          anchor={selectedMarker}
          pixelOffset={[0, -8]}
          disableAutoPan
          headerContent={
            <h3 className="restaurant-info-window__title">{selectedRestaurant.name}</h3>
          }
          onCloseClick={() => selectRestaurant(null)}
        >
          <div className="restaurant-info-window">
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
