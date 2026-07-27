import {
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

import { useLocation } from "../../context/LocationContext.jsx";
import { useRestaurantSearch } from "../../context/RestaurantSearchContext.jsx";

const PLACE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "primaryType",
  "primaryTypeDisplayName",
  "googleMapsURI",
];

function convertLocationToLiteral(location) {
  if (!location) {
    return null;
  }

  if (typeof location.toJSON === "function") {
    return location.toJSON();
  }

  const latitude =
    typeof location.lat === "function"
      ? location.lat()
      : location.lat;

  const longitude =
    typeof location.lng === "function"
      ? location.lng()
      : location.lng;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
}

function normalizePlace(place) {
  return {
    id: place.id,
    name: place.displayName ?? "Unnamed restaurant",
    address:
      place.formattedAddress ?? "Address unavailable",
    location: convertLocationToLiteral(place.location),
    rating:
      typeof place.rating === "number"
        ? place.rating
        : null,
    reviewCount:
      typeof place.userRatingCount === "number"
        ? place.userRatingCount
        : null,
    priceLevel: place.priceLevel ?? null,
    primaryType: place.primaryType ?? null,
    primaryTypeDisplayName:
      place.primaryTypeDisplayName ?? null,
    googleMapsURI: place.googleMapsURI ?? null,
    attributions: (place.attributions ?? []).map(
      (attribution) => ({
        provider: attribution.provider ?? "",
        providerURI: attribution.providerURI ?? null,
      }),
    ),
  };
}

export function calculateHiddenGemScore(
  restaurant,
  {
    minReviews = 10,
    maxReviews = 300,
  } = {},
) {
  const rating = restaurant.rating ?? 0;
  const reviewCount = restaurant.reviewCount ?? 0;

  if (reviewCount <= 0) {
    return 0;
  }

  const qualityScore = rating / 5;
  const confidenceTarget = Math.max(minReviews * 3, 30);
  const confidenceScore = Math.min(
    reviewCount / confidenceTarget,
    1,
  );

  const obscurityScore =
    1 -
    Math.min(
      Math.log10(reviewCount + 1) /
        Math.log10(maxReviews + 1),
      1,
    );

  return (
    qualityScore * 0.65 +
    confidenceScore * 0.1 +
    obscurityScore * 0.25
  );
}

export function useNearbyRestaurants() {
  const placesLibrary = useMapsLibrary("places");
  const { location } = useLocation();

  const {
    searchMode,
    activeSearch,
    beginSearch,
    completeSearch,
    failSearch,
    clearSearchResults,
  } = useRestaurantSearch();

  const latestRequestNumber = useRef(0);

  const clearRestaurants = useCallback(() => {
    latestRequestNumber.current += 1;
    clearSearchResults();
  }, [clearSearchResults]);

  useEffect(() => {
    clearRestaurants();
  }, [
    location.lat,
    location.lng,
    clearRestaurants,
  ]);

  const searchNearbyRestaurants = useCallback(async () => {
    if (!placesLibrary) {
      failSearch(
        "The Google Places library is still loading.",
      );
      return [];
    }

    const latitude = Number(location.lat);
    const longitude = Number(location.lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      failSearch(
        "A valid latitude and longitude are required.",
      );
      return [];
    }

    const requestNumber =
      latestRequestNumber.current + 1;

    latestRequestNumber.current = requestNumber;
    beginSearch();

    try {
      const {
        Place,
        SearchNearbyRankPreference,
      } = placesLibrary;

      const safeRadius = Math.min(
        Math.max(Number(location.radiusMeters) || 1, 1),
        50000,
      );

      const safeResultCount = Math.min(
        Math.max(Number(activeSearch.maxResults) || 1, 1),
        20,
      );

      const request = {
        fields: PLACE_FIELDS,
        locationRestriction: {
          center: {
            lat: latitude,
            lng: longitude,
          },
          radius: safeRadius,
        },
        includedPrimaryTypes: [
          activeSearch.category ?? "restaurant",
        ],
        maxResultCount: safeResultCount,
        rankPreference:
          searchMode === "popular"
            ? SearchNearbyRankPreference.POPULARITY
            : SearchNearbyRankPreference.DISTANCE,
        language: "en",
        region: "US",
      };

      const { places } = await Place.searchNearby(request);

      let processedRestaurants = (places ?? [])
        .map(normalizePlace)
        .filter((restaurant) => restaurant.location);

      if (searchMode === "popular") {
        const minimumRating = Number(
          activeSearch.minRating ?? 0,
        );

        processedRestaurants = processedRestaurants.filter(
          (restaurant) =>
            restaurant.rating !== null &&
            restaurant.rating >= minimumRating,
        );
      }

      if (searchMode === "hidden") {
        const minimumRating = Number(
          activeSearch.minRating ?? 4,
        );
        const minimumReviews = Number(
          activeSearch.minReviews ?? 10,
        );
        const maximumReviews = Number(
          activeSearch.maxReviews ?? 300,
        );

        processedRestaurants = processedRestaurants
          .filter((restaurant) => {
            if (
              restaurant.rating === null ||
              restaurant.reviewCount === null
            ) {
              return false;
            }

            return (
              restaurant.rating >= minimumRating &&
              restaurant.reviewCount >= minimumReviews &&
              restaurant.reviewCount <= maximumReviews
            );
          })
          .map((restaurant) => ({
            ...restaurant,
            hiddenGemScore: calculateHiddenGemScore(
              restaurant,
              {
                minReviews: minimumReviews,
                maxReviews: maximumReviews,
              },
            ),
          }))
          .sort((restaurantA, restaurantB) => {
            const scoreDifference =
              restaurantB.hiddenGemScore -
              restaurantA.hiddenGemScore;

            if (scoreDifference !== 0) {
              return scoreDifference;
            }

            return (
              (restaurantB.rating ?? 0) -
              (restaurantA.rating ?? 0)
            );
          });
      }

      if (
        requestNumber === latestRequestNumber.current
      ) {
        completeSearch(processedRestaurants);
      }

      return processedRestaurants;
    } catch (error) {
      console.error(
        "Nearby restaurant search failed:",
        error,
      );

      if (
        requestNumber === latestRequestNumber.current
      ) {
        failSearch(
          "The nearby restaurant search could not be completed.",
        );
      }

      return [];
    }
  }, [
    placesLibrary,
    location.lat,
    location.lng,
    location.radiusMeters,
    searchMode,
    activeSearch,
    beginSearch,
    completeSearch,
    failSearch,
  ]);

  return {
    placesLibraryIsReady: Boolean(placesLibrary),
    searchNearbyRestaurants,
    clearRestaurants,
  };
}
