"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

const LocationContext = createContext();

const DEFAULT_LOCATION = {
  lat: 40.2973,
  lng: -75.0616,
  radiusMeters: 8047,
};

export function LocationProvider({ children, initialLocation }) {
  const [location, setLocation] = useState(() => ({
    ...DEFAULT_LOCATION,
    ...initialLocation,
  }));

  function updateLocation(lat, lng) {
    setLocation((currentLocation) => ({
      ...currentLocation,
      lat: Number(lat),
      lng: Number(lng),
    }));
  }

  function updateRadius(radiusMeters) {
    const numericRadius = Number(radiusMeters);

    if (!Number.isFinite(numericRadius)) {
      return;
    }

    setLocation((currentLocation) => ({
      ...currentLocation,
      radiusMeters: Math.min(
        Math.max(numericRadius, 1),
        50000,
      ),
    }));
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        updateLocation,
        updateRadius,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      "useLocation must be used inside a LocationProvider",
    );
  }

  return context;
}
