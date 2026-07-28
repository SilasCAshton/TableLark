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

const METERS_PER_MILE = 1609.344;
const MIN_SUBDIVIDED_RADIUS_METERS =
  0.5 * METERS_PER_MILE;
const MAX_SUBDIVIDED_REQUESTS = 16;
const METERS_PER_LATITUDE_DEGREE = 111320;

function offsetCoordinate(center, northMeters, eastMeters) {
  const latitudeOffset =
    northMeters / METERS_PER_LATITUDE_DEGREE;
  const latitudeRadians =
    center.lat * (Math.PI / 180);
  const longitudeScale =
    METERS_PER_LATITUDE_DEGREE *
    Math.cos(latitudeRadians);

  return {
    lat: center.lat + latitudeOffset,
    lng:
      center.lng +
      eastMeters / Math.max(longitudeScale, 1),
  };
}

function calculateDistanceMeters(pointA, pointB) {
  const earthRadiusMeters = 6371008.8;
  const toRadians = (degrees) =>
    degrees * (Math.PI / 180);
  const latitudeA = toRadians(pointA.lat);
  const latitudeB = toRadians(pointB.lat);
  const latitudeDifference = toRadians(
    pointB.lat - pointA.lat,
  );
  const longitudeDifference = toRadians(
    pointB.lng - pointA.lng,
  );

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    )
  );
}

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

function filterAndScoreHiddenGems(
  restaurants,
  activeSearch,
) {
  const minimumRating = Number(
    activeSearch.minRating ?? 4,
  );
  const minimumReviews = Number(
    activeSearch.minReviews ?? 10,
  );
  const maximumReviews = Number(
    activeSearch.maxReviews ?? 300,
  );

  return restaurants
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
        processedRestaurants = filterAndScoreHiddenGems(
          processedRestaurants,
          activeSearch,
        );
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

  const searchSubdividedHiddenGems = useCallback(async () => {
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
      const originalCenter = {
        lat: latitude,
        lng: longitude,
      };
      const originalRadius = Math.min(
        Math.max(Number(location.radiusMeters) || 1, 1),
        50000,
      );
      const resultsPerSearch = Math.min(
        Math.max(Number(activeSearch.maxResults) || 1, 1),
        20,
      );
      const collectedPlaces = [];
      let requestCount = 0;

      async function searchCircle(center, radius) {
        if (
          requestNumber !== latestRequestNumber.current ||
          requestCount >= MAX_SUBDIVIDED_REQUESTS
        ) {
          return false;
        }

        requestCount += 1;

        const { places } = await Place.searchNearby({
          fields: PLACE_FIELDS,
          locationRestriction: {
            center,
            radius: Math.min(radius, 50000),
          },
          includedPrimaryTypes: [
            activeSearch.category ?? "restaurant",
          ],
          maxResultCount: resultsPerSearch,
          rankPreference:
            SearchNearbyRankPreference.DISTANCE,
          language: "en",
          region: "US",
        });

        const returnedPlaces = places ?? [];
        collectedPlaces.push(...returnedPlaces);

        return returnedPlaces.length >= resultsPerSearch;
      }

      async function searchSquare(center, halfSideMeters) {
        const circumscribedRadius =
          halfSideMeters * Math.SQRT2;
        const searchRadius = Math.max(
          circumscribedRadius,
          MIN_SUBDIVIDED_RADIUS_METERS,
        );
        const wasSaturated = await searchCircle(
          center,
          searchRadius,
        );

        if (
          !wasSaturated ||
          searchRadius <= MIN_SUBDIVIDED_RADIUS_METERS ||
          requestCount >= MAX_SUBDIVIDED_REQUESTS
        ) {
          return;
        }

        await searchSquareChildren(center, halfSideMeters);
      }

      async function searchSquareChildren(
        parentCenter,
        parentHalfSideMeters,
      ) {
        const childHalfSide = parentHalfSideMeters / 2;
        const offsets = [
          [-childHalfSide, -childHalfSide],
          [-childHalfSide, childHalfSide],
          [childHalfSide, -childHalfSide],
          [childHalfSide, childHalfSide],
        ];

        for (const [northOffset, eastOffset] of offsets) {
          if (
            requestNumber !== latestRequestNumber.current ||
            requestCount >= MAX_SUBDIVIDED_REQUESTS
          ) {
            return;
          }

          const childCenter = offsetCoordinate(
            parentCenter,
            northOffset,
            eastOffset,
          );

          await searchSquare(childCenter, childHalfSide);
        }
      }

      const originalSearchWasSaturated =
        await searchCircle(originalCenter, originalRadius);

      if (
        originalSearchWasSaturated &&
        originalRadius > MIN_SUBDIVIDED_RADIUS_METERS
      ) {
        await searchSquareChildren(
          originalCenter,
          originalRadius,
        );
      }

      if (requestCount >= MAX_SUBDIVIDED_REQUESTS) {
        console.warn(
          `Hidden-gem search stopped after ${MAX_SUBDIVIDED_REQUESTS} requests.`,
        );
      }

      const uniqueRestaurants = [
        ...new Map(
          collectedPlaces
            .map(normalizePlace)
            .filter(
              (restaurant) =>
                restaurant.id && restaurant.location,
            )
            .filter(
              (restaurant) =>
                calculateDistanceMeters(
                  originalCenter,
                  restaurant.location,
                ) <= originalRadius,
            )
            .map((restaurant) => [
              restaurant.id,
              restaurant,
            ]),
        ).values(),
      ];

      const processedRestaurants =
        filterAndScoreHiddenGems(
          uniqueRestaurants,
          activeSearch,
        );

      if (
        requestNumber === latestRequestNumber.current
      ) {
        completeSearch(processedRestaurants);
      }

      return processedRestaurants;
    } catch (error) {
      console.error(
        "Subdivided hidden-gem search failed:",
        error,
      );

      if (
        requestNumber === latestRequestNumber.current
      ) {
        failSearch(
          "The thorough hidden-gem search could not be completed.",
        );
      }

      return [];
    }
  }, [
    placesLibrary,
    location.lat,
    location.lng,
    location.radiusMeters,
    activeSearch,
    beginSearch,
    completeSearch,
    failSearch,
  ]);

  return {
    placesLibraryIsReady: Boolean(placesLibrary),
    searchNearbyRestaurants,
    searchSubdividedHiddenGems,
    clearRestaurants,
  };
}
