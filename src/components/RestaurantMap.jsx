"use client";

import { useEffect, useRef, useState } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";

import { useLocation } from "@/context/LocationContext";
import { useMapViewport } from "@/context/MapViewportContext";
import RestaurantMarkers from "./restaurants/RestaurantMarkers";

const MOBILE_MAP_QUERY = "(max-width: 720px)";

function VisibleMapCenterObserver({ containerRef }) {
  const { updateVisibleMapViewport } = useMapViewport();

  useEffect(() => {
    const mapElement = containerRef.current;
    const layout = mapElement?.closest(".restaurant-finder-layout");
    if (!mapElement || !layout) return undefined;

    let frame;
    function measureVisibleMap() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const mapBounds = mapElement.getBoundingClientRect();
        const topbar = layout.querySelector(".top-action-bar");
        const sidebar = layout.querySelector(".restaurant-sidebar");
        const mobile = window.matchMedia(MOBILE_MAP_QUERY).matches;
        let visibleTop = Math.max(
          mapBounds.top,
          topbar?.getBoundingClientRect().bottom ?? mapBounds.top,
        );
        let visibleBottom = mapBounds.bottom;
        let visibleLeft = mapBounds.left;
        const visibleRight = mapBounds.right;

        if (sidebar) {
          const sidebarBounds = sidebar.getBoundingClientRect();
          if (mobile) {
            visibleBottom = Math.min(visibleBottom, sidebarBounds.top);
          } else {
            visibleLeft = Math.max(visibleLeft, sidebarBounds.right);
          }
        }

        if (visibleBottom <= visibleTop) {
          visibleTop = mapBounds.top;
          visibleBottom = mapBounds.bottom;
        }
        if (visibleRight <= visibleLeft) {
          visibleLeft = mapBounds.left;
        }

        updateVisibleMapViewport({
          center: {
            x: (visibleLeft + visibleRight) / 2 - mapBounds.left,
            y: (visibleTop + visibleBottom) / 2 - mapBounds.top,
          },
          mapSize: {
            width: mapBounds.width,
            height: mapBounds.height,
          },
        });
      });
    }

    const resizeObserver = new ResizeObserver(measureVisibleMap);
    resizeObserver.observe(mapElement);
    const topbar = layout.querySelector(".top-action-bar");
    const sidebar = layout.querySelector(".restaurant-sidebar");
    if (topbar) resizeObserver.observe(topbar);
    if (sidebar) resizeObserver.observe(sidebar);

    const mutationObserver = new MutationObserver(measureVisibleMap);
    const mutationOptions = {
      attributes: true,
      attributeFilter: ["class", "hidden", "open"],
      childList: true,
      characterData: true,
      subtree: true,
    };
    if (topbar) mutationObserver.observe(topbar, mutationOptions);
    if (sidebar) mutationObserver.observe(sidebar, mutationOptions);

    measureVisibleMap();
    window.addEventListener("resize", measureVisibleMap);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measureVisibleMap);
      updateVisibleMapViewport(null);
    };
  }, [containerRef, updateVisibleMapViewport]);

  return null;
}

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
  const containerRef = useRef(null);

  const mapCenter = {
    lat: Number(location.lat),
    lng: Number(location.lng),
  };

  return (
    <section
      ref={containerRef}
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
        <VisibleMapCenterObserver containerRef={containerRef} />
        <ResponsiveMapControls />
        <RestaurantMarkers />
      </Map>
    </section>
  );
}

export default RestaurantMap;
