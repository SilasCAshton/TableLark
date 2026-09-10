"use client";

import { useLocation } from "@/context/LocationContext";

import AddressInput from "./locationComponents/AddressInput";
import CurrentLocationInput from "./locationComponents/CurrentLocationInput";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LocationControls({
  isOpen,
  onToggle,
  onRequestClose,
}) {
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
    onRequestClose();
  }

  return (
    <section
      className="location-controls"
      aria-label="Choose a search location"
    >
      <div className="location-menu">
        <button
          type="button"
          className="location-menu__trigger"
          data-menu-trigger="location"
          aria-expanded={isOpen}
          aria-controls="location-menu-panel"
          onClick={onToggle}
        >
          Location
        </button>

        {isOpen ? (
          <div
            id="location-menu-panel"
            className="location-menu__panel"
          >
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
        ) : null}
      </div>
    </section>
  );
}

export default LocationControls;
