import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useLocation } from "../Utility/LocationContext.jsx";

import AddressInput from "./searchComponents/AddressInput.jsx"
import LatAndLngInput from "./searchComponents/LatAndLngInput.jsx"
import CurrentLocationInput from "./searchComponents/CurrentLocationInput.jsx";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function SearchControls() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const { updateLocation } = useLocation();

  function processLatitudeAndLongitude(
    requestedLatitude,
    requestedLongitude
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
    <div>
      <h1>Search Controls</h1>

      <details>
        <summary>Search using an address</summary>

        <AddressInput
          setLatitude={setLatitude}
          setLongitude={setLongitude}
          processLatitudeAndLongitude={
            processLatitudeAndLongitude
          }
        />
      </details>

      <details>
        <summary>Enter coordinates manually</summary>

        <LatAndLngInput
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            processLatitudeAndLongitude={
            processLatitudeAndLongitude}
            clamp={clamp}
        />
      </details>

      <details>
        <summary>Use your current location</summary>

        <CurrentLocationInput
            setLatitude={setLatitude}
            setLongitude={setLongitude}
            processLatitudeAndLongitude={
            processLatitudeAndLongitude
            }
        />
        </details>

      {/* Type of restaurant */}

      {/* Search radius */}
    </div>
  );
}

export default SearchControls;