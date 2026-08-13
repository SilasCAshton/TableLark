import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDistanceMeters,
  calculateHiddenGemScore,
  deduplicateWithinRadius,
  filterAndScoreHiddenGems,
  normalizePlace,
} from "../../src/lib/restaurants/search-logic.js";
import {
  findRestaurantChain,
  isChainRestaurant,
} from "../../src/lib/restaurants/chain-filter.js";

test("normalizes a Places API restaurant", () => {
  const restaurant = normalizePlace({
    id: "place-1",
    displayName: { text: "Test Kitchen" },
    formattedAddress: "100 Main Street",
    location: {
      latitude: 40.1,
      longitude: -75.2,
    },
    rating: 4.7,
    userRatingCount: 84,
    priceLevel: "PRICE_LEVEL_MODERATE",
    primaryType: "restaurant",
    primaryTypeDisplayName: { text: "Restaurant" },
    googleMapsUri: "https://maps.google.com/example",
    attributions: [
      {
        provider: "Example provider",
        providerUri: "https://example.com",
      },
    ],
  });

  assert.equal(restaurant.name, "Test Kitchen");
  assert.equal(restaurant.priceLevel, "MODERATE");
  assert.deepEqual(restaurant.location, {
    lat: 40.1,
    lng: -75.2,
  });
  assert.equal(
    restaurant.attributions[0].providerURI,
    "https://example.com",
  );
});

test("calculates geographic distance in meters", () => {
  const distance = calculateDistanceMeters(
    { lat: 40, lng: -75 },
    { lat: 40.01, lng: -75 },
  );

  assert.ok(distance > 1100);
  assert.ok(distance < 1125);
});

test("deduplicates restaurants and removes distant results", () => {
  const restaurants = deduplicateWithinRadius(
    [
      {
        id: "near",
        location: { lat: 40.001, lng: -75 },
      },
      {
        id: "near",
        location: { lat: 40.002, lng: -75 },
      },
      {
        id: "far",
        location: { lat: 41, lng: -75 },
      },
    ],
    { lat: 40, lng: -75 },
    1000,
  );

  assert.equal(restaurants.length, 1);
  assert.equal(restaurants[0].id, "near");
});

test("filters and ranks hidden gems", () => {
  const restaurants = filterAndScoreHiddenGems(
    [
      { id: "a", rating: 4.8, reviewCount: 40 },
      { id: "b", rating: 4.2, reviewCount: 250 },
      { id: "c", rating: 3.5, reviewCount: 20 },
    ],
    {
      minRating: 4,
      minReviews: 10,
      maxReviews: 300,
    },
  );

  assert.deepEqual(
    restaurants.map((restaurant) => restaurant.id),
    ["a", "b"],
  );
  assert.ok(
    restaurants[0].hiddenGemScore >
      restaurants[1].hiddenGemScore,
  );
});

test("recognizes chain aliases and branch suffixes", () => {
  assert.equal(
    findRestaurantChain("Dunkin' #1842")?.name,
    "Dunkin'",
  );
  assert.equal(
    findRestaurantChain("Applebee's - Doylestown")?.name,
    "Applebee's",
  );
  assert.equal(isChainRestaurant({ name: "Starbucks" }), true);
});

test("does not fuzzy-match similarly named independents", () => {
  assert.equal(
    isChainRestaurant({ name: "Sonic Sushi Kitchen" }),
    false,
  );
  assert.equal(
    isChainRestaurant({ name: "Subway Cafe & Market" }),
    false,
  );
});

test("removes known chains from hidden-gem results", () => {
  const restaurants = filterAndScoreHiddenGems(
    [
      {
        id: "local",
        name: "Silas Family Kitchen",
        rating: 4.8,
        reviewCount: 40,
      },
      {
        id: "chain",
        name: "Applebee's",
        rating: 4.7,
        reviewCount: 50,
      },
    ],
    {
      minRating: 4,
      minReviews: 10,
      maxReviews: 300,
    },
  );

  assert.deepEqual(
    restaurants.map((restaurant) => restaurant.id),
    ["local"],
  );
});

test("returns no score for a restaurant without reviews", () => {
  assert.equal(
    calculateHiddenGemScore({ rating: 5, reviewCount: 0 }),
    0,
  );
});
