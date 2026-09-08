"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { MAXIMUM_POLL_OPTIONS } from "@/lib/polls/constants";
import {
  addRestaurantToShortlist,
  removeRestaurantFromShortlist,
} from "@/lib/polls/shortlist";

import { PollBuilderContext } from "./PollBuilderContext";

export default function PollBuilderProvider({ children }) {
  const [pollRestaurants, setPollRestaurants] = useState([]);

  const addRestaurant = useCallback((restaurant) => {
    setPollRestaurants((currentRestaurants) =>
      addRestaurantToShortlist(
        currentRestaurants,
        restaurant,
      ),
    );
  }, []);

  const removeRestaurant = useCallback((restaurantId) => {
    setPollRestaurants((currentRestaurants) =>
      removeRestaurantFromShortlist(
        currentRestaurants,
        restaurantId,
      ),
    );
  }, []);

  const clearRestaurants = useCallback(() => {
    setPollRestaurants([]);
  }, []);

  const restaurantIds = useMemo(
    () =>
      new Set(
        pollRestaurants.map((restaurant) => restaurant.id),
      ),
    [pollRestaurants],
  );

  const value = useMemo(
    () => ({
      pollRestaurants,
      addRestaurant,
      removeRestaurant,
      clearRestaurants,
      hasRestaurant: (restaurantId) =>
        restaurantIds.has(restaurantId),
      isFull:
        pollRestaurants.length >= MAXIMUM_POLL_OPTIONS,
    }),
    [
      pollRestaurants,
      addRestaurant,
      removeRestaurant,
      clearRestaurants,
      restaurantIds,
    ],
  );

  return (
    <PollBuilderContext.Provider value={value}>
      {children}
    </PollBuilderContext.Provider>
  );
}
