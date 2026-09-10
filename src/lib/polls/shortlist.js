import { MAXIMUM_POLL_OPTIONS } from "./constants.js";

export function addRestaurantToShortlist(
  restaurants,
  restaurant,
) {
  if (
    !restaurant?.id ||
    restaurants.some((item) => item.id === restaurant.id) ||
    restaurants.length >= MAXIMUM_POLL_OPTIONS
  ) {
    return restaurants;
  }

  return [...restaurants, restaurant];
}

export function removeRestaurantFromShortlist(
  restaurants,
  restaurantId,
) {
  return restaurants.filter(
    (restaurant) => restaurant.id !== restaurantId,
  );
}
