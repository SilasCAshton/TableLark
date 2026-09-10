import assert from "node:assert/strict";
import test from "node:test";

import { MAXIMUM_POLL_OPTIONS } from "../../src/lib/polls/constants.js";
import {
  addRestaurantToShortlist,
  removeRestaurantFromShortlist,
} from "../../src/lib/polls/shortlist.js";

function restaurant(id) {
  return {
    id,
    name: `Restaurant ${id}`,
    address: `${id} Main Street`,
    location: { lat: 29.95, lng: -90.07 },
    rating: 4.7,
    reviewCount: 84,
    googleMapsURI: `https://maps.google.com/?cid=${id}`,
    attributions: [{ provider: "Example" }],
  };
}

test("adds the complete restaurant object to the shortlist", () => {
  const selectedRestaurant = restaurant("a");
  const shortlist = addRestaurantToShortlist(
    [],
    selectedRestaurant,
  );

  assert.equal(shortlist.length, 1);
  assert.strictEqual(shortlist[0], selectedRestaurant);
  assert.deepEqual(shortlist[0].location, {
    lat: 29.95,
    lng: -90.07,
  });
  assert.deepEqual(shortlist[0].attributions, [
    { provider: "Example" },
  ]);
});

test("does not add a restaurant more than once", () => {
  const selectedRestaurant = restaurant("a");
  const existing = [selectedRestaurant];
  const shortlist = addRestaurantToShortlist(
    existing,
    selectedRestaurant,
  );

  assert.strictEqual(shortlist, existing);
});

test("does not exceed the backend option limit", () => {
  const existing = Array.from(
    { length: MAXIMUM_POLL_OPTIONS },
    (_, index) => restaurant(String(index)),
  );
  const shortlist = addRestaurantToShortlist(
    existing,
    restaurant("extra"),
  );

  assert.strictEqual(shortlist, existing);
});

test("removes a restaurant without changing the remaining objects", () => {
  const first = restaurant("a");
  const second = restaurant("b");
  const shortlist = removeRestaurantFromShortlist(
    [first, second],
    first.id,
  );

  assert.deepEqual(shortlist, [second]);
  assert.strictEqual(shortlist[0], second);
});
