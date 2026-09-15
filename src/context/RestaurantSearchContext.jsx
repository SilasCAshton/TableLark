"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { DEFAULT_RESTAURANT_SEARCH_PRESET_ID } from "@/lib/restaurants/search-presets";
import {
  DEFAULT_MAX_RESULTS,
  DEFAULT_MAX_REVIEWS,
  DEFAULT_MIN_RATING,
  DEFAULT_MIN_REVIEWS,
} from "@/lib/restaurants/search-config";
import {
  ANY_PRICE_LEVEL,
  filterRestaurantsForDisplay,
} from "@/lib/restaurants/display-filters";

const RestaurantSearchContext = createContext(null);

export function RestaurantSearchProvider({ children }) {
  const [searchMode, setSearchMode] = useState("popular");
  const [cuisinePresetId, setCuisinePresetId] = useState(
    DEFAULT_RESTAURANT_SEARCH_PRESET_ID,
  );
  const [minRating, setMinRating] = useState(DEFAULT_MIN_RATING);
  const [maxPriceLevel, setMaxPriceLevel] = useState(ANY_PRICE_LEVEL);
  const [includeUnpriced, setIncludeUnpriced] = useState(true);

  const [restaurantCandidates, setRestaurantCandidates] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState(null);
  const [highlightedRestaurantId, highlightRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchRequestVersion, setSearchRequestVersion] = useState(0);

  const searchFilters = useMemo(
    () => ({
      presetId: cuisinePresetId,
      minReviews: DEFAULT_MIN_REVIEWS,
      maxReviews: DEFAULT_MAX_REVIEWS,
      maxResults: DEFAULT_MAX_RESULTS,
    }),
    [cuisinePresetId],
  );

  const restaurants = useMemo(
    () =>
      filterRestaurantsForDisplay(restaurantCandidates, {
        minRating,
        maxPriceLevel,
        includeUnpriced,
      }),
    [
      restaurantCandidates,
      minRating,
      maxPriceLevel,
      includeUnpriced,
    ],
  );

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find(
        (restaurant) =>
          restaurant.id === selectedRestaurantId,
      ) ?? null,
    [restaurants, selectedRestaurantId],
  );

  const beginSearch = useCallback(() => {
    setIsLoading(true);
    setErrorMessage("");
    setHasSearched(true);
    setSelectedRestaurantId(null);
    highlightRestaurant(null);
    setSearchRequestVersion((version) => version + 1);
  }, []);

  const completeSearch = useCallback((newRestaurants) => {
    setRestaurantCandidates(newRestaurants);
    setIsLoading(false);
    setErrorMessage("");
  }, []);

  const failSearch = useCallback((message) => {
    setRestaurantCandidates([]);
    setSelectedRestaurantId(null);
    highlightRestaurant(null);
    setIsLoading(false);
    setHasSearched(true);
    setErrorMessage(message);
  }, []);

  const clearSearchResults = useCallback(() => {
    setRestaurantCandidates([]);
    setSelectedRestaurantId(null);
    highlightRestaurant(null);
    setIsLoading(false);
    setErrorMessage("");
    setHasSearched(false);
  }, []);

  const selectRestaurant = useCallback((restaurantOrId) => {
    if (!restaurantOrId) {
      setSelectedRestaurantId(null);
      highlightRestaurant(null);
      return;
    }

    const id = typeof restaurantOrId === "string"
      ? restaurantOrId
      : restaurantOrId.id;
    setSelectedRestaurantId(id);
    highlightRestaurant(id);
  }, []);

  return (
    <RestaurantSearchContext.Provider
      value={{
        searchMode,
        setSearchMode,
        cuisinePresetId,
        setCuisinePresetId,
        minRating,
        setMinRating,
        maxPriceLevel,
        setMaxPriceLevel,
        includeUnpriced,
        setIncludeUnpriced,
        minReviews: DEFAULT_MIN_REVIEWS,
        maxReviews: DEFAULT_MAX_REVIEWS,
        searchFilters,

        restaurants,
        selectedRestaurantId,
        highlightedRestaurantId,
        highlightRestaurant,
        selectedRestaurant,
        isLoading,
        errorMessage,
        hasSearched,
        searchRequestVersion,

        beginSearch,
        completeSearch,
        failSearch,
        clearSearchResults,
        selectRestaurant,
      }}
    >
      {children}
    </RestaurantSearchContext.Provider>
  );
}

export function useRestaurantSearch() {
  const context = useContext(RestaurantSearchContext);

  if (!context) {
    throw new Error(
      "useRestaurantSearch must be used inside a RestaurantSearchProvider",
    );
  }

  return context;
}
