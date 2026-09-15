"use client";

/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const MapViewportContext = createContext(null);

export function MapViewportProvider({ children }) {
  const [visibleMapViewport, setVisibleMapViewport] = useState(null);

  const updateVisibleMapViewport = useCallback((nextViewport) => {
    setVisibleMapViewport((currentViewport) => {
      if (
        currentViewport?.center.x === nextViewport?.center.x &&
        currentViewport?.center.y === nextViewport?.center.y &&
        currentViewport?.mapSize.width === nextViewport?.mapSize.width &&
        currentViewport?.mapSize.height === nextViewport?.mapSize.height
      ) {
        return currentViewport;
      }

      return nextViewport;
    });
  }, []);

  const value = useMemo(
    () => ({ visibleMapViewport, updateVisibleMapViewport }),
    [visibleMapViewport, updateVisibleMapViewport],
  );

  return (
    <MapViewportContext.Provider value={value}>
      {children}
    </MapViewportContext.Provider>
  );
}

export function useMapViewport() {
  const context = useContext(MapViewportContext);

  if (!context) {
    throw new Error("useMapViewport must be used inside a MapViewportProvider");
  }

  return context;
}
