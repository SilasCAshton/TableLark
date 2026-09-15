import { DEFAULT_MIN_RATING } from "./search-config.js";

export const ANY_PRICE_LEVEL = "ANY";
export const HIDDEN_GEM_BADGE_MIN_RATING = 4;

const PRICE_LEVEL_RANKS = Object.freeze({
  FREE: 0,
  INEXPENSIVE: 1,
  MODERATE: 2,
  EXPENSIVE: 3,
  VERY_EXPENSIVE: 4,
});

export function filterRestaurantsForDisplay(
  restaurants,
  {
    minRating = DEFAULT_MIN_RATING,
    maxPriceLevel = ANY_PRICE_LEVEL,
    includeUnpriced = true,
  } = {},
) {
  const maximumPriceRank = PRICE_LEVEL_RANKS[maxPriceLevel];

  return restaurants.filter((restaurant) => {
    if (
      restaurant.rating === null ||
      restaurant.rating < minRating
    ) {
      return false;
    }

    const priceRank = PRICE_LEVEL_RANKS[restaurant.priceLevel];

    if (priceRank === undefined) {
      return includeUnpriced;
    }

    return (
      maximumPriceRank === undefined ||
      priceRank <= maximumPriceRank
    );
  });
}

export function qualifiesForHiddenGemBadge(restaurant) {
  return (
    Number.isFinite(restaurant.hiddenGemScore) &&
    restaurant.rating !== null &&
    restaurant.rating >= HIDDEN_GEM_BADGE_MIN_RATING
  );
}
