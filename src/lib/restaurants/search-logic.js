import { isChainRestaurant } from "./chain-filter.js";

const METERS_PER_LATITUDE_DEGREE = 111320;

export function offsetCoordinate(
  center,
  northMeters,
  eastMeters,
) {
  const latitudeOffset =
    northMeters / METERS_PER_LATITUDE_DEGREE;
  const latitudeRadians = center.lat * (Math.PI / 180);
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

export function calculateDistanceMeters(pointA, pointB) {
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

function normalizePriceLevel(priceLevel) {
  if (
    typeof priceLevel !== "string" ||
    priceLevel === "PRICE_LEVEL_UNSPECIFIED"
  ) {
    return null;
  }

  return priceLevel.replace("PRICE_LEVEL_", "");
}

export function normalizePlace(place) {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  const hasLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return {
    id: place.id ?? null,
    name: place.displayName?.text ?? "Unnamed restaurant",
    address:
      place.formattedAddress ?? "Address unavailable",
    location: hasLocation
      ? { lat: latitude, lng: longitude }
      : null,
    rating:
      typeof place.rating === "number"
        ? place.rating
        : null,
    reviewCount:
      typeof place.userRatingCount === "number"
        ? place.userRatingCount
        : null,
    priceLevel: normalizePriceLevel(place.priceLevel),
    primaryType: place.primaryType ?? null,
    primaryTypeDisplayName:
      place.primaryTypeDisplayName?.text ?? null,
    iconMaskBaseURI: place.iconMaskBaseUri ?? null,
    googleMapsURI: place.googleMapsUri ?? null,
    attributions: (place.attributions ?? []).map(
      (attribution) => ({
        provider: attribution.provider ?? "",
        providerURI: attribution.providerUri ?? null,
      }),
    ),
  };
}

export function calculateHiddenGemScore(
  restaurant,
  { minReviews = 10, maxReviews = 300 } = {},
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

export function filterAndScoreHiddenGems(
  restaurants,
  filters,
) {
  return restaurants
    .filter((restaurant) => {
      if (isChainRestaurant(restaurant)) {
        return false;
      }

      if (
        restaurant.rating === null ||
        restaurant.reviewCount === null
      ) {
        return false;
      }

      return (
        restaurant.rating >= filters.minRating &&
        restaurant.reviewCount >= filters.minReviews &&
        restaurant.reviewCount <= filters.maxReviews
      );
    })
    .map((restaurant) => ({
      ...restaurant,
      hiddenGemScore: calculateHiddenGemScore(
        restaurant,
        filters,
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

export function deduplicateWithinRadius(
  restaurants,
  center,
  radiusMeters,
) {
  return [
    ...new Map(
      restaurants
        .filter(
          (restaurant) =>
            restaurant.id && restaurant.location,
        )
        .filter(
          (restaurant) =>
            calculateDistanceMeters(
              center,
              restaurant.location,
            ) <= radiusMeters,
        )
        .map((restaurant) => [
          restaurant.id,
          restaurant,
        ]),
    ).values(),
  ];
}
