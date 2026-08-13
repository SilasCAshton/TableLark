"use client";

import { useState } from "react";
import { useLocation } from "@/context/LocationContext";

import AddressInput from "./locationComponents/AddressInput";
import LatAndLngInput from "./locationComponents/LatAndLngInput";
import CurrentLocationInput from "./locationComponents/CurrentLocationInput";
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LocationControls() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

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
      <span className="location-controls-label">Location</span>

      <details>
        <summary>Address</summary>

        <AddressInput
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          processLatitudeAndLongitude={
            processLatitudeAndLongitude
          }
        />
      </details>

      <details>
        <summary>Coordinates</summary>

        <LatAndLngInput
          latitude={latitude}
          setLatitude={setLatitude}
          longitude={longitude}
          setLongitude={setLongitude}
          processLatitudeAndLongitude={
            processLatitudeAndLongitude
          }
          clamp={clamp}
        />
      </details>

      <details>
        <summary>Current location</summary>

        <CurrentLocationInput
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          processLatitudeAndLongitude={
            processLatitudeAndLongitude
          }
        />
      </details>
    </section>
  );
}

export default LocationControls;
