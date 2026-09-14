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
  const [visibleMapCenter, setVisibleMapCenter] = useState(null);

  const updateVisibleMapCenter = useCallback((nextCenter) => {
    setVisibleMapCenter((currentCenter) => {
      if (
        currentCenter?.x === nextCenter?.x &&
        currentCenter?.y === nextCenter?.y
      ) {
        return currentCenter;
      }

      return nextCenter;
    });
  }, []);

  const value = useMemo(
    () => ({ visibleMapCenter, updateVisibleMapCenter }),
    [visibleMapCenter, updateVisibleMapCenter],
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
