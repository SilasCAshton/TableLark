import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_RESTAURANT_SEARCH_PRESET_ID,
  getRestaurantSearchPreset,
  RESTAURANT_SEARCH_PRESETS,
} from "../../src/lib/restaurants/search-presets.js";

test("defines ordered built-in restaurant search presets", () => {
  assert.deepEqual(
    RESTAURANT_SEARCH_PRESETS.map((preset) => preset.name),
    [
      "All restaurants",
      "American & Casual",
      "Asian",
      "European & Mediterranean",
      "Latin & Caribbean",
    ],
  );
});

test("each search preset has a unique id, name, and Google types", () => {
  const ids = new Set();

  for (const preset of RESTAURANT_SEARCH_PRESETS) {
    assert.equal(typeof preset.id, "string");
    assert.ok(preset.id.length > 0);
    assert.equal(typeof preset.name, "string");
    assert.ok(preset.name.length > 0);
    assert.ok(preset.includedPrimaryTypes.length > 0);
    assert.equal(ids.has(preset.id), false);
    ids.add(preset.id);
  }
});

test("uses all restaurants as the default preset", () => {
  assert.equal(DEFAULT_RESTAURANT_SEARCH_PRESET_ID, "all");
  assert.deepEqual(
    getRestaurantSearchPreset("all").includedPrimaryTypes,
    ["restaurant"],
  );
});
