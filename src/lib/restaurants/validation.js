const SEARCH_MODES = new Set(["nearby", "popular", "hidden"]);

const RESTAURANT_CATEGORIES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "pizza_restaurant",
  "italian_restaurant",
  "mexican_restaurant",
  "chinese_restaurant",
  "seafood_restaurant",
]);

export class SearchValidationError extends Error {}

function readNumber(value, name) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    throw new SearchValidationError(`${name} is required.`);
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new SearchValidationError(
      `${name} must be a finite number.`,
    );
  }

  return number;
}

function readNumberInRange(value, name, minimum, maximum) {
  const number = readNumber(value, name);

  if (number < minimum || number > maximum) {
    throw new SearchValidationError(
      `${name} must be between ${minimum} and ${maximum}.`,
    );
  }

  return number;
}

function readIntegerInRange(
  value,
  name,
  minimum,
  maximum,
) {
  const number = readNumberInRange(
    value,
    name,
    minimum,
    maximum,
  );

  if (!Number.isInteger(number)) {
    throw new SearchValidationError(
      `${name} must be an integer.`,
    );
  }

  return number;
}

export function validateRestaurantSearch(payload) {
  if (!payload || typeof payload !== "object") {
    throw new SearchValidationError(
      "A restaurant search request is required.",
    );
  }

  const mode = payload.mode;

  if (!SEARCH_MODES.has(mode)) {
    throw new SearchValidationError(
      "Search mode must be nearby, popular, or hidden.",
    );
  }

  const center = payload.center;

  if (!center || typeof center !== "object") {
    throw new SearchValidationError(
      "A search center is required.",
    );
  }

  const filters = payload.filters;

  if (!filters || typeof filters !== "object") {
    throw new SearchValidationError(
      "Search filters are required.",
    );
  }

  const category = filters.category;

  if (!RESTAURANT_CATEGORIES.has(category)) {
    throw new SearchValidationError(
      "The selected restaurant category is not supported.",
    );
  }

  const validatedSearch = {
    mode,
    center: {
      lat: readNumberInRange(
        center.lat,
        "Latitude",
        -90,
        90,
      ),
      lng: readNumberInRange(
        center.lng,
        "Longitude",
        -180,
        180,
      ),
    },
    radiusMeters: readNumberInRange(
      payload.radiusMeters,
      "Search radius",
      1,
      50000,
    ),
    filters: {
      category,
      maxResults: readIntegerInRange(
        filters.maxResults ?? 20,
        "Maximum results",
        1,
        20,
      ),
    },
  };

  if (mode === "popular" || mode === "hidden") {
    validatedSearch.filters.minRating = readNumberInRange(
      filters.minRating ?? 0,
      "Minimum rating",
      0,
      5,
    );
  }

  if (mode === "hidden") {
    const minReviews = readIntegerInRange(
      filters.minReviews ?? 10,
      "Minimum reviews",
      1,
      1000000,
    );
    const maxReviews = readIntegerInRange(
      filters.maxReviews ?? 300,
      "Maximum reviews",
      1,
      1000000,
    );

    if (minReviews > maxReviews) {
      throw new SearchValidationError(
        "Minimum reviews cannot exceed maximum reviews.",
      );
    }

    validatedSearch.filters.minReviews = minReviews;
    validatedSearch.filters.maxReviews = maxReviews;
  }

  return validatedSearch;
}
