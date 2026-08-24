"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APIProvider } from "@vis.gl/react-google-maps";

import AddressInput from "@/components/locationComponents/AddressInput";

function buildFinderUrl(lat, lng) {
  const searchParams = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  return `/finder?${searchParams.toString()}`;
}

function AddressAutocomplete() {
  const router = useRouter();

  return (
    <div className="home-hero-search__address-panel">
      <AddressInput
        label="Enter an address"
        labelDescription="Choose one of Google's suggestions to continue."
        placeholder="Start typing an address..."
        showSelectedAddress={false}
        processLatitudeAndLongitude={(lat, lng) =>
          router.push(buildFinderUrl(lat, lng))
        }
      />
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
