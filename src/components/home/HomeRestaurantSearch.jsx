"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APIProvider,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

function buildFinderUrl(lat, lng) {
  const searchParams = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  return `/finder?${searchParams.toString()}`;
}

function AddressAutocomplete() {
  const router = useRouter();
  const placesLibrary = useMapsLibrary("places");
  const containerRef = useRef(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!placesLibrary || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const autocomplete = new placesLibrary.PlaceAutocompleteElement();

    autocomplete.placeholder = "Start typing an address...";
    autocomplete.description = "Search for a starting address";
    autocomplete.style.width = "100%";

    async function handlePlaceSelect(event) {
      setMessage("Opening the restaurant finder...");

      try {
        const place = event.placePrediction.toPlace();

        await place.fetchFields({ fields: ["location"] });

        if (!place.location) {
          setMessage("That address did not include a usable location.");
          return;
        }

        router.push(
          buildFinderUrl(
            place.location.lat(),
            place.location.lng(),
          ),
        );
      } catch (error) {
        console.error("Home address selection failed:", error);
        setMessage("That address could not be opened. Please try again.");
      }
    }

    autocomplete.addEventListener("gmp-select", handlePlaceSelect);
    container.replaceChildren(autocomplete);

    return () => {
      autocomplete.removeEventListener("gmp-select", handlePlaceSelect);

      if (container.contains(autocomplete)) {
        container.removeChild(autocomplete);
      }
    };
  }, [placesLibrary, router]);

  return (
    <div className="home-hero-search__address-panel">
      <label className="home-hero-search__address-label">
        Enter an address
        <span>Choose one of Google&apos;s suggestions to continue.</span>
      </label>
      <div ref={containerRef} />
      {!placesLibrary && <p role="status">Loading address search...</p>}
      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default function HomeRestaurantSearch() {
  const router = useRouter();
  const [isLocating, setIsLocating] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  function handleCurrentLocation() {
    setLocationMessage("");
    setIsAddressOpen(false);

    if (!navigator.geolocation) {
      setLocationMessage(
        "Location needs to be enabled in a supported browser.",
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        router.push(
          buildFinderUrl(
            position.coords.latitude,
            position.coords.longitude,
          ),
        );
      },
      () => {
        setIsLocating(false);
        setLocationMessage(
          "Location needs to be enabled. Allow access in your browser, then try again.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function handleAddressToggle() {
    setLocationMessage("");
    setIsAddressOpen((isOpen) => !isOpen);
  }

  return (
    <div className="home-hero-search">
      <div className="home-hero__actions" aria-label="Restaurant search options">
        <button
          className="home-button home-button--primary"
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? "Finding your location..." : "Find a restaurant nearby"}
        </button>
        <button
          className="home-button home-button--secondary"
          type="button"
          onClick={handleAddressToggle}
          aria-expanded={isAddressOpen}
          aria-controls="home-address-search"
        >
          Search by address
        </button>
      </div>

      {locationMessage && (
        <p className="home-hero-search__message" role="alert">
          {locationMessage}
        </p>
      )}

      {isAddressOpen && (
        <div id="home-address-search">
          <APIProvider
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
          >
            <AddressAutocomplete />
          </APIProvider>
        </div>
      )}
    </div>
  );
}
