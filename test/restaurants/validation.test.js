import assert from "node:assert/strict";
import test from "node:test";

import {
  SearchValidationError,
  validateRestaurantSearch,
} from "../../src/lib/restaurants/validation.js";

const validNearbySearch = {
  mode: "nearby",
  center: {
    lat: 40.2973,
    lng: -75.0616,
  },
  radiusMeters: 8047,
  filters: {
    category: "restaurant",
    maxResults: 20,
  },
};

test("validates and normalizes a nearby search", () => {
  assert.deepEqual(
    validateRestaurantSearch(validNearbySearch),
    validNearbySearch,
  );
});

test("validates hidden-gem filters", () => {
  const search = validateRestaurantSearch({
    ...validNearbySearch,
    mode: "hidden",
    filters: {
      ...validNearbySearch.filters,
      minRating: 4.2,
      minReviews: 20,
      maxReviews: 250,
    },
  });

  assert.equal(search.filters.minRating, 4.2);
  assert.equal(search.filters.minReviews, 20);
  assert.equal(search.filters.maxReviews, 250);
});

test("rejects unsupported categories", () => {
  assert.throws(
    () =>
      validateRestaurantSearch({
        ...validNearbySearch,
        filters: {
          ...validNearbySearch.filters,
          category: "anything",
        },
      }),
    SearchValidationError,
  );
});

test("rejects coordinates outside their valid range", () => {
  assert.throws(
    () =>
      validateRestaurantSearch({
        ...validNearbySearch,
        center: {
          ...validNearbySearch.center,
          lat: 91,
        },
      }),
    /Latitude must be between -90 and 90/,
  );
});

test("rejects inverted hidden-gem review limits", () => {
  assert.throws(
    () =>
      validateRestaurantSearch({
        ...validNearbySearch,
        mode: "hidden",
        filters: {
          ...validNearbySearch.filters,
          minRating: 4,
          minReviews: 500,
          maxReviews: 100,
        },
      }),
    /Minimum reviews cannot exceed maximum reviews/,
  );
});
