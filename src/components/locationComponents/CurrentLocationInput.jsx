"use client";

import { useState } from "react";

function CurrentLocationInput({ processLatitudeAndLongitude }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  function handleUseCurrentLocation() {
    setMessage("");
    setAccuracy(null);

    if (!navigator.geolocation) {
      setMessage(
        "Your browser does not support location services."
      );
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      // Runs when the browser finds the location.
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracyInMeters = position.coords.accuracy;

        // Immediately update LocationContext.
        processLatitudeAndLongitude(lat, lng);

        setAccuracy(accuracyInMeters);
        setMessage("Your current location was found.");
        setIsLoading(false);
      },

      // Runs when the location request fails.
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setMessage(
              "Location permission was denied. Please allow location access in your browser settings."
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setMessage(
              "Your current location could not be determined."
            );
            break;

          case error.TIMEOUT:
            setMessage(
              "The location request took too long. Please try again."
            );
            break;

          default:
            setMessage(
              "An unexpected error occurred while finding your location."
            );
        }

        setIsLoading(false);
      },

      // Location options.
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  return (
    <div className="location-current-input">
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isLoading}
      >
        {isLoading
          ? "Finding your location..."
          : "Use current location"}
      </button>

      {message && <p role="status">{message}</p>}

      {accuracy !== null && (
        <p>
          Estimated accuracy: approximately{" "}
          {Math.round(accuracy)} meters
        </p>
      )}
    </div>
  );
}

export default CurrentLocationInput;
