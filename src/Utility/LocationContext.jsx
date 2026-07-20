import { createContext, useContext, useState } from "react";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState({
    lat: 40.2973,
    lng: -75.0616,
  });

  function updateLocation(lat, lng) {
    setLocation({
      lat: lat,
      lng: lng,
    });
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        updateLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
    const context = useContext(LocationContext);

    if (!context) {
        throw new Error("useLocation must be used inside a locationProvider")
    }

    return context;
}