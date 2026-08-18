import { searchNearbyPlaces } from "./places-client";
import {
  deduplicateWithinRadius,
  filterAndScoreHiddenGems,
  offsetCoordinate,
} from "./search-logic";

const METERS_PER_MILE = 1609.344;
const MIN_SUBDIVIDED_RADIUS_METERS =
  0.5 * METERS_PER_MILE;
const MAX_SUBDIVIDED_REQUESTS = 16;

async function searchSingleArea(search, signal) {
  const restaurants = await searchNearbyPlaces({
    center: search.center,
    radiusMeters: search.radiusMeters,
    includedPrimaryTypes: search.filters.includedPrimaryTypes,
    maxResults: search.filters.maxResults,
    rankPreference:
      search.mode === "popular"
        ? "POPULARITY"
        : "DISTANCE",
    signal,
  });

  if (search.mode !== "popular") {
    return restaurants;
  }

  return restaurants.filter(
    (restaurant) =>
      restaurant.rating !== null &&
      restaurant.rating >= search.filters.minRating,
  );
}

async function searchHiddenGems(search, signal) {
  const collectedRestaurants = [];
  let requestCount = 0;

  async function searchCircle(center, radiusMeters) {
    if (
      signal?.aborted ||
      requestCount >= MAX_SUBDIVIDED_REQUESTS
    ) {
      return false;
    }

    requestCount += 1;

    const restaurants = await searchNearbyPlaces({
      center,
      radiusMeters,
      includedPrimaryTypes: search.filters.includedPrimaryTypes,
      maxResults: search.filters.maxResults,
      rankPreference: "DISTANCE",
      signal,
    });

    collectedRestaurants.push(...restaurants);

    return restaurants.length >= search.filters.maxResults;
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
        signal?.aborted ||
        requestCount >= MAX_SUBDIVIDED_REQUESTS
      ) {
        return;
      }

      await searchSquare(
        offsetCoordinate(
          parentCenter,
          northOffset,
          eastOffset,
        ),
        childHalfSide,
      );
    }
  }

  const originalSearchWasSaturated = await searchCircle(
    search.center,
    search.radiusMeters,
  );

  if (
    originalSearchWasSaturated &&
    search.radiusMeters > MIN_SUBDIVIDED_RADIUS_METERS
  ) {
    await searchSquareChildren(
      search.center,
      search.radiusMeters,
    );
  }

  const uniqueRestaurants = deduplicateWithinRadius(
    collectedRestaurants,
    search.center,
    search.radiusMeters,
  );

  return {
    restaurants: filterAndScoreHiddenGems(
      uniqueRestaurants,
      search.filters,
    ),
    requestCount,
  };
}

export async function searchRestaurants(search, signal) {
  if (search.mode === "hidden") {
    return searchHiddenGems(search, signal);
  }

  return {
    restaurants: await searchSingleArea(search, signal),
    requestCount: 1,
  };
}
