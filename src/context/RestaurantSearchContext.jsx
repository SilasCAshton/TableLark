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

const RestaurantSearchContext = createContext(null);

export function RestaurantSearchProvider({ children }) {
  const [searchMode, setSearchMode] = useState("popular");
  const [cuisinePresetId, setCuisinePresetId] = useState(
    DEFAULT_RESTAURANT_SEARCH_PRESET_ID,
  );
  const [minRating, setMinRating] = useState(DEFAULT_MIN_RATING);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState(null);
  const [highlightedRestaurantId, highlightRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchFilters = useMemo(
    () => ({
      presetId: cuisinePresetId,
      minRating,
      minReviews: DEFAULT_MIN_REVIEWS,
      maxReviews: DEFAULT_MAX_REVIEWS,
      maxResults: DEFAULT_MAX_RESULTS,
    }),
    [cuisinePresetId, minRating],
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
  }, []);

  const completeSearch = useCallback((newRestaurants) => {
    setRestaurants(newRestaurants);
    setIsLoading(false);
    setErrorMessage("");
  }, []);

  const failSearch = useCallback((message) => {
    setRestaurants([]);
    setSelectedRestaurantId(null);
    highlightRestaurant(null);
    setIsLoading(false);
    setHasSearched(true);
    setErrorMessage(message);
  }, []);

  const clearSearchResults = useCallback(() => {
    setRestaurants([]);
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
