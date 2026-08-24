import assert from "node:assert/strict";
import test from "node:test";

import {
  SearchValidationError,
  validateRestaurantSearch,
} from "../../src/lib/restaurants/validation.js";

const validPopularSearch = {
  mode: "popular",
  center: {
    lat: 40.2973,
    lng: -75.0616,
  },
  radiusMeters: 8047,
  filters: {
    presetId: "all",
    minRating: 4,
    maxResults: 20,
  },
};

test("validates and normalizes a popular search", () => {
  const search = validateRestaurantSearch(validPopularSearch);

  assert.equal(search.filters.presetId, "all");
  assert.ok(
    search.filters.includedPrimaryTypes.includes("restaurant"),
  );
  assert.ok(search.filters.includedPrimaryTypes.includes("cafe"));
  assert.equal(search.filters.includedTypes, undefined);
  assert.equal(search.filters.minRating, 4);
  assert.equal(search.filters.maxResults, 20);
});

test("ignores review-count filters for a popular search", () => {
  const search = validateRestaurantSearch({
    ...validPopularSearch,
    filters: {
      ...validPopularSearch.filters,
      minReviews: 500,
      maxReviews: 100,
    },
  });

  assert.equal(search.filters.minReviews, undefined);
  assert.equal(search.filters.maxReviews, undefined);
});

test("rejects search modes outside the current UI model", () => {
  assert.throws(
    () =>
      validateRestaurantSearch({
        ...validPopularSearch,
        mode: "nearby",
      }),
    /Search mode must be popular or hidden/,
  );
});

test("validates hidden-gem filters", () => {
  const search = validateRestaurantSearch({
    ...validPopularSearch,
    mode: "hidden",
    filters: {
      ...validPopularSearch.filters,
      minRating: 4.2,
      minReviews: 20,
      maxReviews: 250,
    },
  });

  assert.equal(search.filters.minRating, 4.2);
  assert.equal(search.filters.minReviews, 20);
  assert.equal(search.filters.maxReviews, 250);
});

test("resolves a cuisine preset to trusted Google types", () => {
  const search = validateRestaurantSearch({
    ...validPopularSearch,
    filters: {
      ...validPopularSearch.filters,
      presetId: "asian",
    },
  });

  assert.ok(
    search.filters.includedPrimaryTypes.includes(
      "chinese_restaurant",
    ),
  );
  assert.ok(
    search.filters.includedPrimaryTypes.includes(
      "sushi_restaurant",
    ),
  );
});

test("rejects unsupported search presets", () => {
  assert.throws(
    () =>
      validateRestaurantSearch({
        ...validPopularSearch,
        filters: {
          ...validPopularSearch.filters,
          presetId: "anything",
        },
      }),
    SearchValidationError,
  );
});

test("rejects coordinates outside their valid range", () => {
  assert.throws(
    () =>
      validateRestaurantSearch({
        ...validPopularSearch,
        center: {
          ...validPopularSearch.center,
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
        ...validPopularSearch,
        mode: "hidden",
        filters: {
          ...validPopularSearch.filters,
          minRating: 4,
          minReviews: 500,
          maxReviews: 100,
        },
      }),
    /Minimum reviews cannot exceed maximum reviews/,
  );
});
