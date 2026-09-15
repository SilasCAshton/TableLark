import assert from "node:assert/strict";
import test from "node:test";

import {
  ANY_PRICE_LEVEL,
  filterRestaurantsForDisplay,
  qualifiesForHiddenGemBadge,
} from "../../src/lib/restaurants/display-filters.js";

const restaurants = [
  { id: "free", rating: 4.1, priceLevel: "FREE" },
  { id: "one", rating: 4.5, priceLevel: "INEXPENSIVE" },
  { id: "two", rating: 3.8, priceLevel: "MODERATE" },
  { id: "three", rating: 4.2, priceLevel: "EXPENSIVE" },
  { id: "four", rating: 4.8, priceLevel: "VERY_EXPENSIVE" },
  { id: "unknown", rating: 4.3, priceLevel: null },
];

test("applies rating and maximum price filters without reordering", () => {
  assert.deepEqual(
    filterRestaurantsForDisplay(restaurants, {
      minRating: 4,
      maxPriceLevel: "EXPENSIVE",
      includeUnpriced: true,
    }).map((restaurant) => restaurant.id),
    ["free", "one", "three", "unknown"],
  );
});

test("can exclude places without pricing information", () => {
  assert.deepEqual(
    filterRestaurantsForDisplay(restaurants, {
      minRating: 0,
      maxPriceLevel: ANY_PRICE_LEVEL,
      includeUnpriced: false,
    }).map((restaurant) => restaurant.id),
    ["free", "one", "two", "three", "four"],
  );
});

test("requires a ranked hidden result rated at least 4.0 for the badge", () => {
  assert.equal(
    qualifiesForHiddenGemBadge({ rating: 4, hiddenGemScore: 0.75 }),
    true,
  );
  assert.equal(
    qualifiesForHiddenGemBadge({ rating: 3.9, hiddenGemScore: 0.8 }),
    false,
  );
  assert.equal(
    qualifiesForHiddenGemBadge({ rating: 4.8 }),
    false,
  );
});
