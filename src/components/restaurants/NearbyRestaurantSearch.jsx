"use client";

import { useEffect, useRef } from "react";

import { useRestaurantSearch } from "@/context/RestaurantSearchContext";

import RestaurantSearchControls from "./RestaurantSearchControls";
import RestaurantResults from "./RestaurantResults";

function NearbyRestaurantSearch({
  isCollapsed,
  onToggleCollapsed,
  activeMobileTab,
  onMobileTabChange,
}) {
  const {
    restaurants,
    hasSearched,
    isLoading,
    errorMessage,
  } = useRestaurantSearch();
  const searchTabRef = useRef(null);
  const resultsTabRef = useRef(null);
  const wasLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && hasSearched) {
      onMobileTabChange("results");
    }

    wasLoadingRef.current = isLoading;
  }, [hasSearched, isLoading, onMobileTabChange]);

  function handleTabKeyDown(event) {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextTab =
      activeMobileTab === "search" ? "results" : "search";

    onMobileTabChange(nextTab);
    (nextTab === "search" ? searchTabRef : resultsTabRef).current?.focus();
  }

  return (
    <section
      className={`nearby-restaurant-search ${
        isCollapsed ? "nearby-restaurant-search--collapsed" : ""
      }`}
    >
      <button
        className="restaurant-panel-toggle"
        type="button"
        aria-label={
          isCollapsed
            ? "Expand restaurant discovery"
            : "Minimize restaurant discovery"
        }
        aria-controls="restaurant-search-content"
        aria-expanded={!isCollapsed}
        onClick={onToggleCollapsed}
      />

      <header className="restaurant-search-header">
        <p className="restaurant-eyebrow">
          Restaurant discovery
        </p>

        <h1>Explore nearby restaurants</h1>
      </header>

      <div
        id="restaurant-search-content"
        className="restaurant-search-content"
      >
        <div
          className="restaurant-mobile-tabs"
          role="tablist"
          aria-label="Restaurant discovery"
          onKeyDown={handleTabKeyDown}
        >
          <button
            ref={searchTabRef}
            id="restaurant-search-tab"
            type="button"
            role="tab"
            aria-selected={activeMobileTab === "search"}
            aria-controls="restaurant-search-panel"
            tabIndex={activeMobileTab === "search" ? 0 : -1}
            onClick={() => onMobileTabChange("search")}
          >
            Search
          </button>

          <button
            ref={resultsTabRef}
            id="restaurant-results-tab"
            type="button"
            role="tab"
            aria-selected={activeMobileTab === "results"}
            aria-controls="restaurant-results-panel"
            tabIndex={activeMobileTab === "results" ? 0 : -1}
            onClick={() => onMobileTabChange("results")}
          >
            Results
          </button>
        </div>

        {activeMobileTab === "results" &&
          hasSearched &&
          !isLoading &&
          !errorMessage && (
            <p className="restaurant-mobile-results-summary">
              ({restaurants.length}{" "}
              {restaurants.length === 1 ? "place" : "places"} found)
            </p>
          )}

        <div
          id="restaurant-search-panel"
          className={`restaurant-mobile-tab-panel ${
            activeMobileTab === "search"
              ? "restaurant-mobile-tab-panel--active"
              : ""
          }`}
          role="tabpanel"
          aria-labelledby="restaurant-search-tab"
        >
          <RestaurantSearchControls />
        </div>

        <div
          id="restaurant-results-panel"
          className={`restaurant-mobile-tab-panel ${
            activeMobileTab === "results"
              ? "restaurant-mobile-tab-panel--active"
              : ""
          }`}
          role="tabpanel"
          aria-labelledby="restaurant-results-tab"
        >
          <RestaurantResults />
        </div>
      </div>
    </section>
  );
}

export default NearbyRestaurantSearch;
