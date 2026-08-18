"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

function AddressInput({ processLatitudeAndLongitude }) {
  const placesLibrary = useMapsLibrary("places");

  const autocompleteContainerRef = useRef(null);
  const processLocationRef = useRef(processLatitudeAndLongitude);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /*
   * Keep a reference to the newest version of the parent's
   * processLatitudeAndLongitude function.
   *
   * This prevents us from having to rebuild the autocomplete
   * widget every time SearchControls renders.
   */

  useEffect(() => {
    processLocationRef.current = processLatitudeAndLongitude;
  }, [processLatitudeAndLongitude]);

  useEffect(() => {
    if (!placesLibrary || !autocompleteContainerRef.current) {
      return;
    }

    const container = autocompleteContainerRef.current;

    /*
     * Google provides this input element.
     * It includes both the text input and suggestion dropdown.
     */
    const autocomplete =
      new placesLibrary.PlaceAutocompleteElement();

    autocomplete.placeholder = "Enter another address";
    autocomplete.description = "Search for an address";
    autocomplete.style.width = "100%";

    /*
     * Optional: restrict suggestions to the United States.
     *
     * Leave this commented out if your app should support
     * addresses worldwide.
     */
    // autocomplete.includedRegionCodes = ["us"];

    async function handlePlaceSelect(event) {
      setError("");
      setSelectedAddress("");
      setIsLoading(true);

      try {
        /*
         * The selected autocomplete prediction first needs to
         * be converted into a complete Place object.
         */
        const place = event.placePrediction.toPlace();

        /*
         * Request only the fields this application needs.
         */
        await place.fetchFields({
          fields: ["formattedAddress", "location"],
        });

        if (!place.location) {
          setError(
            "Google found the address but did not return coordinates."
          );
          return;
        }

        /*
         * place.location is a Google LatLng object.
         * lat() and lng() extract the numeric coordinates.
         */
        const lat = place.location.lat();
        const lng = place.location.lng();

        /*
         * Pass the new coordinates directly into the processing
         * function so it can update LocationContext immediately.
         */
        processLocationRef.current(lat, lng);

        setSelectedAddress(
          place.formattedAddress ?? "Address selected"
        );
      } catch (error) {
        console.error("Autocomplete selection failed:", error);

        setError(
          "The selected address could not be converted into coordinates."
        );
      } finally {
        setIsLoading(false);
      }
    }

    /*
     * gmp-select fires when the user chooses one of the
     * autocomplete suggestions.
     */
    autocomplete.addEventListener(
      "gmp-select",
      handlePlaceSelect
    );

    /*
     * Insert Google's autocomplete element into the React div.
     * replaceChildren also prevents duplicate inputs in
     * React Strict Mode.
     */
    container.replaceChildren(autocomplete);

    /*
     * Remove the listener and widget when this component
     * is unmounted.
     */
    return () => {
      autocomplete.removeEventListener(
        "gmp-select",
        handlePlaceSelect
      );

      if (container.contains(autocomplete)) {
        container.removeChild(autocomplete);
      }
    };
  }, [placesLibrary]);

  return (
    <div className="location-address-input">
      <div ref={autocompleteContainerRef} />

      {!placesLibrary && <p role="status">Loading address search...</p>}

      {isLoading && <p>Getting coordinates...</p>}

      {selectedAddress && (
        <p>
          Selected address: <strong>{selectedAddress}</strong>
        </p>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default AddressInput;
