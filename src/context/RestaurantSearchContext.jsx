"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { DEFAULT_RESTAURANT_SEARCH_PRESET_ID } from "@/lib/restaurants/search-presets";

const RestaurantSearchContext = createContext(null);

const DEFAULT_MIN_RATING = 4;
const DEFAULT_MIN_REVIEWS = 10;
const DEFAULT_MAX_REVIEWS = 300;
const MAX_RESULTS = 20;

export function RestaurantSearchProvider({ children }) {
  const [searchMode, setSearchMode] = useState("popular");
  const [cuisinePresetId, setCuisinePresetId] = useState(
    DEFAULT_RESTAURANT_SEARCH_PRESET_ID,
  );
  const [minRating, setMinRating] = useState(DEFAULT_MIN_RATING);
  const [minReviews, setMinReviews] = useState(DEFAULT_MIN_REVIEWS);
  const [maxReviews, setMaxReviews] = useState(DEFAULT_MAX_REVIEWS);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchFilters = useMemo(
    () => ({
      presetId: cuisinePresetId,
      minRating,
      minReviews,
      maxReviews,
      maxResults: MAX_RESULTS,
    }),
    [cuisinePresetId, minRating, minReviews, maxReviews],
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
  }, []);

  const completeSearch = useCallback((newRestaurants) => {
    setRestaurants(newRestaurants);
    setIsLoading(false);
    setErrorMessage("");
  }, []);

  const failSearch = useCallback((message) => {
    setRestaurants([]);
    setSelectedRestaurantId(null);
    setIsLoading(false);
    setHasSearched(true);
    setErrorMessage(message);
  }, []);

  const clearSearchResults = useCallback(() => {
    setRestaurants([]);
    setSelectedRestaurantId(null);
    setIsLoading(false);
    setErrorMessage("");
    setHasSearched(false);
  }, []);

  const selectRestaurant = useCallback((restaurantOrId) => {
    if (!restaurantOrId) {
      setSelectedRestaurantId(null);
      return;
    }

    setSelectedRestaurantId(
      typeof restaurantOrId === "string"
        ? restaurantOrId
        : restaurantOrId.id,
    );
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
        minReviews,
        setMinReviews,
        maxReviews,
        setMaxReviews,
        searchFilters,

        restaurants,
        selectedRestaurantId,
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
