import { getRestaurantSearchPreset } from "./search-presets.js";

const MEAL_SERVICES = [
  "servesBreakfast", "servesBrunch", "servesLunch", "servesDinner",
];
const BREAKFAST_TYPES = [
  "cafe", "coffee_shop", "breakfast_restaurant", "brunch_restaurant",
];
const DELI_TYPES = [
  "restaurant", "cafe", "sandwich_shop",
  "breakfast_restaurant", "brunch_restaurant",
];
const BAKERY_TYPES = [...DELI_TYPES, "coffee_shop"];

function checksBakeriesAndDelis(presetId) {
  if (presetId === "desserts") return false;
  const types = getRestaurantSearchPreset(presetId)?.includedPrimaryTypes ?? [];
  return types.includes("bakery") || types.includes("deli");
}

export function getBakeryDeliFields(presetId) {
  if (!checksBakeriesAndDelis(presetId)) return [];
  const services = presetId === "coffee-brunch"
    ? MEAL_SERVICES.slice(0, 2) : MEAL_SERVICES;
  return ["places.types", ...services.map((field) => `places.${field}`)];
}

export function normalizeMealServices(place) {
  return Object.fromEntries(MEAL_SERVICES.map((field) => [
    field, typeof place[field] === "boolean" ? place[field] : null,
  ]));
}

// Dedicated meal-destination check, not a configurable preset rule engine.
// Dessert browsing intentionally retains standalone bakeries.
export function filterBakeriesAndDelis(restaurants, presetId) {
  if (!checksBakeriesAndDelis(presetId)) return restaurants;
  return restaurants.filter((place) => {
    if (!["bakery", "deli"].includes(place.primaryType)) return true;
    const breakfastOnly = presetId === "coffee-brunch";
    const types = breakfastOnly ? BREAKFAST_TYPES
      : place.primaryType === "bakery" ? BAKERY_TYPES : DELI_TYPES;
    const services = breakfastOnly ? MEAL_SERVICES.slice(0, 2) : MEAL_SERVICES;
    return (place.types ?? []).some((type) =>
      type !== place.primaryType && types.includes(type)
    ) || services.some((field) => place.mealServices?.[field] === true);
  });
}
