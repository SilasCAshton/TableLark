import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const RestaurantSearchContext = createContext(null);

const DEFAULT_NEARBY_SEARCH = {
  category: "restaurant",
  maxResults: 20,
};

const DEFAULT_POPULAR_SEARCH = {
  category: "restaurant",
  minRating: 4,
  maxResults: 20,
};

const DEFAULT_HIDDEN_GEM_SEARCH = {
  category: "restaurant",
  minRating: 4,
  minReviews: 10,
  maxReviews: 300,
  maxResults: 20,
};

export function RestaurantSearchProvider({ children }) {
  const [searchMode, setSearchMode] = useState("nearby");

  const [nearbySearch, setNearbySearch] = useState(
    DEFAULT_NEARBY_SEARCH,
  );

  const [popularSearch, setPopularSearch] = useState(
    DEFAULT_POPULAR_SEARCH,
  );

  const [hiddenGemSearch, setHiddenGemSearch] = useState(
    DEFAULT_HIDDEN_GEM_SEARCH,
  );

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const updateNearbySearch = useCallback((name, value) => {
    setNearbySearch((previousSearch) => ({
      ...previousSearch,
      [name]: value,
    }));
  }, []);

  const updatePopularSearch = useCallback((name, value) => {
    setPopularSearch((previousSearch) => ({
      ...previousSearch,
      [name]: value,
    }));
  }, []);

  const updateHiddenGemSearch = useCallback((name, value) => {
    setHiddenGemSearch((previousSearch) => ({
      ...previousSearch,
      [name]: value,
    }));
  }, []);

  const resetNearbySearch = useCallback(() => {
    setNearbySearch(DEFAULT_NEARBY_SEARCH);
  }, []);

  const resetPopularSearch = useCallback(() => {
    setPopularSearch(DEFAULT_POPULAR_SEARCH);
  }, []);

  const resetHiddenGemSearch = useCallback(() => {
    setHiddenGemSearch(DEFAULT_HIDDEN_GEM_SEARCH);
  }, []);

  const resetActiveSearch = useCallback(() => {
    if (searchMode === "nearby") {
      resetNearbySearch();
      return;
    }

    if (searchMode === "popular") {
      resetPopularSearch();
      return;
    }

    resetHiddenGemSearch();
  }, [
    searchMode,
    resetNearbySearch,
    resetPopularSearch,
    resetHiddenGemSearch,
  ]);

  const activeSearch = useMemo(() => {
    if (searchMode === "popular") {
      return popularSearch;
    }

    if (searchMode === "hidden") {
      return hiddenGemSearch;
    }

    return nearbySearch;
  }, [
    searchMode,
    nearbySearch,
    popularSearch,
    hiddenGemSearch,
  ]);

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
        activeSearch,

        nearbySearch,
        updateNearbySearch,
        resetNearbySearch,

        popularSearch,
        updatePopularSearch,
        resetPopularSearch,

        hiddenGemSearch,
        updateHiddenGemSearch,
        resetHiddenGemSearch,

        resetActiveSearch,

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
