function createSearchPreset(
  id,
  name,
  { includedTypes = [], includedPrimaryTypes = [] },
) {
  return Object.freeze({
    id,
    name,
    includedTypes: Object.freeze([...includedTypes]),
    includedPrimaryTypes: Object.freeze([...includedPrimaryTypes]),
  });
}

export const DEFAULT_RESTAURANT_SEARCH_PRESET_ID = "all";

export const RESTAURANT_SEARCH_PRESETS = Object.freeze([
  createSearchPreset("all", "Everything", {
    includedPrimaryTypes: [
      "restaurant",
      "cafe",
      "coffee_shop",
      "bakery",
      "breakfast_restaurant",
      "brunch_restaurant",
      "deli",
      "food_court",
      "meal_takeaway",
    ],
  }),
  createSearchPreset("coffee-brunch", "Coffee & Brunch", {
    includedPrimaryTypes: [
      "coffee_shop",
      "cafe",
      "bakery",
      "breakfast_restaurant",
      "brunch_restaurant",
      "bagel_shop",
      "donut_shop",
    ],
  }),
  createSearchPreset("american-casual", "American & Casual", {
    includedPrimaryTypes: [
      "american_restaurant",
      "barbecue_restaurant",
      "hamburger_restaurant",
      "pizza_restaurant",
      "steak_house",
      "diner",
      "soul_food_restaurant",
      "seafood_restaurant",
    ],
  }),
  createSearchPreset("asian", "Asian", {
    includedPrimaryTypes: [
      "asian_restaurant",
      "chinese_restaurant",
      "japanese_restaurant",
      "korean_restaurant",
      "thai_restaurant",
      "vietnamese_restaurant",
      "indian_restaurant",
      "sushi_restaurant",
      "ramen_restaurant",
    ],
  }),
  createSearchPreset(
    "european-mediterranean",
    "European & Mediterranean",
    {
      includedPrimaryTypes: [
        "italian_restaurant",
        "french_restaurant",
        "greek_restaurant",
        "spanish_restaurant",
        "mediterranean_restaurant",
        "turkish_restaurant",
        "lebanese_restaurant",
        "middle_eastern_restaurant",
      ],
    },
  ),
  createSearchPreset("latin-caribbean", "Latin & Caribbean", {
    includedPrimaryTypes: [
      "mexican_restaurant",
      "tex_mex_restaurant",
      "brazilian_restaurant",
      "peruvian_restaurant",
      "cuban_restaurant",
      "caribbean_restaurant",
      "latin_american_restaurant",
      "south_american_restaurant",
    ],
  }),
]);

const SEARCH_PRESETS_BY_ID = new Map(
  RESTAURANT_SEARCH_PRESETS.map((preset) => [preset.id, preset]),
);

export function getRestaurantSearchPreset(id) {
  return SEARCH_PRESETS_BY_ID.get(id);
}
