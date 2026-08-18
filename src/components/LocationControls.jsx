"use client";

import { useLocation } from "@/context/LocationContext";

import AddressInput from "./locationComponents/AddressInput";
import CurrentLocationInput from "./locationComponents/CurrentLocationInput";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LocationControls() {
  const { updateLocation } = useLocation();

  function processLatitudeAndLongitude(
    requestedLatitude,
    requestedLongitude,
  ) {
    if (
      requestedLatitude === "" ||
      requestedLongitude === ""
    ) {
      return;
    }

    const lat = Number(requestedLatitude);
    const lng = Number(requestedLongitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const clampedLatitude = clamp(lat, -90, 90);
    const clampedLongitude = clamp(lng, -180, 180);

    updateLocation(clampedLatitude, clampedLongitude);
  }

  return (
    <section
      className="location-controls"
      aria-label="Choose a search location"
    >
      <details className="location-menu">
        <summary>Location</summary>

        <div className="location-menu__panel">
          <CurrentLocationInput
            processLatitudeAndLongitude={
              processLatitudeAndLongitude
            }
          />

          <div className="location-method-divider" aria-hidden="true">
            <span>or</span>
          </div>

          <AddressInput
            processLatitudeAndLongitude={
              processLatitudeAndLongitude
            }
          />
        </div>
      </details>
    </section>
  );
}

export default LocationControls;
