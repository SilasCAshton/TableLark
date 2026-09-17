"use client";

import {
  createContext,
  useEffect,
  useContext,
  useState,
} from "react";

import { readSearchLocation, saveSearchLocation } from "@/lib/restaurants/location-session";

const LocationContext = createContext();

const DEFAULT_LOCATION = {
  lat: 29.9511,
  lng: -90.0715,
  radiusMeters: 8047,
};

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setLocation({ ...DEFAULT_LOCATION, ...readSearchLocation() });
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) saveSearchLocation(location);
  }, [location, isReady]);

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
      {isReady ? children : <p role="status">Loading your search location...</p>}
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
