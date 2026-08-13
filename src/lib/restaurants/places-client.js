import "server-only";

import { normalizePlace } from "./search-logic";

const PLACES_NEARBY_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchNearby";

const PLACE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.googleMapsUri",
  "places.attributions",
].join(",");

const GOOGLE_REQUEST_TIMEOUT_MS = 15000;

export class PlacesServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

export async function searchNearbyPlaces({
  center,
  radiusMeters,
  category,
  maxResults,
  rankPreference,
  signal,
}) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new PlacesServiceError(
      "Restaurant search is not configured. Add GOOGLE_PLACES_API_KEY to the server environment.",
      503,
    );
  }

  const timeoutSignal = AbortSignal.timeout(
    GOOGLE_REQUEST_TIMEOUT_MS,
  );
  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let response;

  try {
    response = await fetch(PLACES_NEARBY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_FIELD_MASK,
      },
      body: JSON.stringify({
        languageCode: "en",
        regionCode: "US",
        includedPrimaryTypes: [category],
        maxResultCount: maxResults,
        rankPreference,
        locationRestriction: {
          circle: {
            center: {
              latitude: center.lat,
              longitude: center.lng,
            },
            radius: Math.min(radiusMeters, 50000),
          },
        },
      }),
      cache: "no-store",
      signal: requestSignal,
    });
  } catch (error) {
    if (
      error.name === "TimeoutError" ||
      (timeoutSignal.aborted && !signal?.aborted)
    ) {
      throw new PlacesServiceError(
        "Google Places took too long to respond.",
        504,
      );
    }

    if (signal?.aborted) {
      throw error;
    }

    throw new PlacesServiceError(
      "The server could not reach Google Places.",
      502,
    );
  }

  if (!response.ok) {
    const googleError = await response
      .json()
      .catch(() => null);

    console.error("Google Places request failed:", {
      status: response.status,
      code: googleError?.error?.status,
      message: googleError?.error?.message,
    });

    const publicMessage =
      response.status === 403
        ? "Google Places rejected the server request. Check the server API key and its API restrictions."
        : "Google Places could not complete the restaurant search.";

    throw new PlacesServiceError(publicMessage, 502);
  }

  const data = await response.json();

  return (data.places ?? [])
    .map(normalizePlace)
    .filter((restaurant) => restaurant.location);
}
