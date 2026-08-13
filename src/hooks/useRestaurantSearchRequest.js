"use client";

import { useCallback, useEffect, useRef } from "react";

import { useLocation } from "@/context/LocationContext";
import { useRestaurantSearch } from "@/context/RestaurantSearchContext";

export function useRestaurantSearchRequest() {
  const { location } = useLocation();
  const {
    searchMode,
    activeSearch,
    beginSearch,
    completeSearch,
    failSearch,
    clearSearchResults,
  } = useRestaurantSearch();

  const activeRequest = useRef(null);

  const clearRestaurants = useCallback(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    clearSearchResults();
  }, [clearSearchResults]);

  useEffect(() => {
    clearRestaurants();
  }, [location.lat, location.lng, clearRestaurants]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    [],
  );

  const searchRestaurants = useCallback(async () => {
    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;
    beginSearch();

    try {
      const response = await fetch(
        "/api/restaurants/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: searchMode,
            center: {
              lat: location.lat,
              lng: location.lng,
            },
            radiusMeters: location.radiusMeters,
            filters: activeSearch,
          }),
          signal: controller.signal,
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "The restaurant search could not be completed.",
        );
      }

      if (activeRequest.current === controller) {
        completeSearch(payload.restaurants ?? []);
        activeRequest.current = null;
      }

      return payload.restaurants ?? [];
    } catch (error) {
      if (error.name === "AbortError") {
        return [];
      }

      console.error("Restaurant search failed:", error);

      if (activeRequest.current === controller) {
        failSearch(error.message);
        activeRequest.current = null;
      }

      return [];
    }
  }, [
    location.lat,
    location.lng,
    location.radiusMeters,
    searchMode,
    activeSearch,
    beginSearch,
    completeSearch,
    failSearch,
  ]);

  return {
    searchRestaurants,
    clearRestaurants,
  };
}
