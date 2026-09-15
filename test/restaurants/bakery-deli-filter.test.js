import assert from "node:assert/strict";
import test from "node:test";
import {
  filterBakeriesAndDelis,
  getBakeryDeliFields,
} from "../../src/lib/restaurants/bakery-deli-filter.js";
import { normalizePlace } from "../../src/lib/restaurants/search-logic.js";

const places = [
  { id: "cakes", primaryType: "bakery", types: ["bakery", "food", "store"] },
  { id: "cafe", primaryType: "bakery", types: ["bakery", "cafe"] },
  { id: "lunch", primaryType: "deli", servesLunch: true },
  { id: "breakfast", primaryType: "deli", servesBreakfast: true },
  { id: "counter", primaryType: "deli", types: ["deli", "food"] },
  { id: "sandwich", primaryType: "deli", types: ["deli", "sandwich_shop"] },
  { id: "unknown", primaryType: "bakery" },
  { id: "false", primaryType: "bakery", servesBreakfast: false, servesLunch: "true" },
  { id: "restaurant", primaryType: "italian_restaurant" },
].map(normalizePlace);

test("keeps bakeries and delis with qualifying associated types OR meal service", () => {
  for (const preset of ["all", "pizza-sandwiches"]) {
    assert.deepEqual(filterBakeriesAndDelis(places, preset).map(p => p.id),
      ["cafe", "lunch", "breakfast", "sandwich", "restaurant"]);
  }
});

test("breakfast browsing does not accept lunch-only or sandwich-only evidence", () => {
  assert.deepEqual(filterBakeriesAndDelis(places, "coffee-brunch").map(p => p.id),
    ["cafe", "breakfast", "restaurant"]);
});

test("unrelated presets are unchanged", () => {
  assert.deepEqual(filterBakeriesAndDelis(places, "italian"), places);
  assert.deepEqual(filterBakeriesAndDelis(places, "asian"), places);
});

test("requests only relevant extra fields and preserves unknown values", () => {
  assert.deepEqual(getBakeryDeliFields("italian"), []);
  assert.deepEqual(getBakeryDeliFields("asian"), []);
  assert.deepEqual(getBakeryDeliFields("coffee-brunch"), [
    "places.types", "places.servesBreakfast", "places.servesBrunch",
  ]);
  assert.deepEqual(getBakeryDeliFields("all"), [
    "places.types", "places.servesBreakfast", "places.servesBrunch",
    "places.servesLunch", "places.servesDinner",
  ]);
  assert.equal(places[7].mealServices.servesBreakfast, false);
  assert.equal(places[7].mealServices.servesLunch, null);
  assert.equal(places[6].mealServices.servesDinner, null);
});
