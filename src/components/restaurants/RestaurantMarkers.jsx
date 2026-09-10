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

    const currentZoom = map.getZoom() ?? 12;
    const targetZoom = Math.max(currentZoom, 14);

    if (currentZoom < 14) {
      map.setZoom(targetZoom);
    }

    const mapElement = map.getDiv();
    const layout = mapElement.closest(".restaurant-finder-layout");
    const topbar = layout?.querySelector(".top-action-bar");
    const panel = layout?.querySelector(".restaurant-sidebar");

    function centerRestaurant() {
      const projection = map.getProjection();
      if (!window.matchMedia("(max-width: 720px)").matches ||
          !projection || !topbar || !panel) {
        map.panTo(selectedRestaurant.location);
        return;
      }

      const mapBounds = mapElement.getBoundingClientRect();
      const visibleTop = Math.max(mapBounds.top, topbar.getBoundingClientRect().bottom);
      const visibleBottom = Math.min(mapBounds.bottom, panel.getBoundingClientRect().top);
      if (visibleBottom <= visibleTop) {
        map.panTo(selectedRestaurant.location);
        return;
      }

      const point = projection.fromLatLngToPoint(
        new window.google.maps.LatLng(selectedRestaurant.location),
      );
      if (!point) return;

      // Move the camera below the restaurant so its pin lands in the visible gap.
      const targetY = (visibleTop + visibleBottom) / 2 - mapBounds.top;
      const scale = 2 ** (map.getZoom() ?? targetZoom);
      point.y += (mapBounds.height / 2 - targetY) / scale;
      const center = projection.fromPointToLatLng(point);
      if (center) map.panTo(center);
    }

    centerRestaurant();
    const projectionListener = map.addListener("projection_changed", centerRestaurant);
    // Also follow changes to the mobile panel height, including its transition.
    const observer = new ResizeObserver(centerRestaurant);
    observer.observe(mapElement);
    if (topbar) observer.observe(topbar);
    if (panel) observer.observe(panel);
    window.addEventListener("resize", centerRestaurant);

    return () => {
      projectionListener.remove();
      observer.disconnect();
      window.removeEventListener("resize", centerRestaurant);
    };
  }, [map, selectedRestaurant]);

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
