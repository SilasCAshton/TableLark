"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

const MINIMUM_QUERY_LENGTH = 2;
const AUTOCOMPLETE_DELAY_MS = 250;

function AddressInput({
  processLatitudeAndLongitude,
  label = "Search by address",
  labelDescription = "",
  placeholder = "Enter another address",
  showSelectedAddress = true,
}) {
  const placesLibrary = useMapsLibrary("places");
  const processLocationRef = useRef(processLatitudeAndLongitude);
  const sessionTokenRef = useRef(null);
  const requestSequenceRef = useRef(0);

  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] =
    useState(-1);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    processLocationRef.current = processLatitudeAndLongitude;
  }, [processLatitudeAndLongitude]);

  useEffect(() => {
    const query = inputValue.trim();
    const requestId = ++requestSequenceRef.current;

    if (
      !placesLibrary ||
      query.length < MINIMUM_QUERY_LENGTH ||
      (selectedAddress && inputValue === selectedAddress)
    ) {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      setIsLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new placesLibrary.AutocompleteSessionToken();
        }

        const { suggestions: nextSuggestions } =
          await placesLibrary.AutocompleteSuggestion
            .fetchAutocompleteSuggestions({
              input: query,
              sessionToken: sessionTokenRef.current,
            });

        if (requestSequenceRef.current !== requestId) {
          return;
        }

        setSuggestions(
          nextSuggestions
            .map((suggestion) => suggestion.placePrediction)
            .filter(Boolean),
        );
        setActiveSuggestionIndex(-1);
        setError("");
      } catch (requestError) {
        if (requestSequenceRef.current !== requestId) {
          return;
        }

        console.error(
          "Address autocomplete failed:",
          requestError,
        );
        setSuggestions([]);
        setError(
          "Address suggestions are unavailable. Please try again.",
        );
      } finally {
        if (requestSequenceRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, AUTOCOMPLETE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);

      if (requestSequenceRef.current === requestId) {
        requestSequenceRef.current += 1;
      }
    };
  }, [inputValue, placesLibrary, selectedAddress]);

  async function selectPrediction(prediction) {
    setError("");
    setSelectedAddress("");
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setIsLoading(true);

    try {
      const place = prediction.toPlace();

      await place.fetchFields({
        fields: ["formattedAddress", "location"],
      });

      if (!place.location) {
        setError(
          "Google found the address but did not return coordinates.",
        );
        return;
      }

      const formattedAddress =
        place.formattedAddress ?? prediction.text.toString();

      processLocationRef.current(
        place.location.lat(),
        place.location.lng(),
      );
      setInputValue(formattedAddress);
      setSelectedAddress(formattedAddress);
    } catch (selectionError) {
      console.error(
        "Autocomplete selection failed:",
        selectionError,
      );
      setError(
        "The selected address could not be converted into coordinates.",
      );
    } finally {
      sessionTokenRef.current = null;
      setIsLoading(false);
    }
  }

  function handleInputChange(event) {
    setInputValue(event.target.value);
    setSelectedAddress("");
    setError("");
  }

  function handleKeyDown(event) {
    if (suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= suggestions.length - 1
          ? 0
          : currentIndex + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0
          ? suggestions.length - 1
          : currentIndex - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      void selectPrediction(suggestions[activeSuggestionIndex]);
      return;
    }

    if (event.key === "Escape") {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  }

  function handleBlur(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  }

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="location-address-input" onBlur={handleBlur}>
      <label htmlFor="location-address-search">
        {label}

        {labelDescription && <span>{labelDescription}</span>}
      </label>

      <input
        id="location-address-search"
        type="search"
        value={inputValue}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={hasSuggestions}
        aria-controls="location-address-suggestions"
        aria-activedescendant={
          activeSuggestionIndex >= 0
            ? `location-address-suggestion-${activeSuggestionIndex}`
            : undefined
        }
        disabled={!placesLibrary}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />

      {hasSuggestions && (
        <div className="location-address-suggestions-shell">
          <ul
            id="location-address-suggestions"
            className="location-address-suggestions"
            role="listbox"
          >
            {suggestions.map((prediction, index) => {
              const mainText =
                prediction.mainText?.toString() ??
                prediction.text.toString();
              const secondaryText =
                prediction.secondaryText?.toString();

              return (
                <li
                  key={prediction.placeId}
                  role="none"
                >
                  <button
                    id={`location-address-suggestion-${index}`}
                    className="location-address-suggestion"
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    onPointerDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => void selectPrediction(prediction)}
                  >
                    <span>{mainText}</span>

                    {secondaryText && (
                      <small>{secondaryText}</small>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="location-address-attribution">
            Powered by Google
          </div>
        </div>
      )}

      {!placesLibrary && (
        <p role="status">Loading address search...</p>
      )}

      {isLoading && <p role="status">Searching addresses...</p>}

      {showSelectedAddress && selectedAddress && (
        <p>
          Selected address: <strong>{selectedAddress}</strong>
        </p>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default AddressInput;
