"use client";

import { useLocation } from "@/context/LocationContext";
import { useRestaurantSearch } from "@/context/RestaurantSearchContext";
import { useRestaurantSearchRequest } from "@/hooks/useRestaurantSearchRequest";
import { RESTAURANT_SEARCH_PRESETS } from "@/lib/restaurants/search-presets";

const RADIUS_LABELS = {
  1609: "1 mile",
  4828: "3 miles",
  8047: "5 miles",
  16093: "10 miles",
  32187: "20 miles",
};

function SearchPresetInput({ id, value, onChange }) {
  return (
    <div className="restaurant-control">
      <label htmlFor={id}>
        What're you feeling?
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {RESTAURANT_SEARCH_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function RestaurantSearchControls() {
  const { location, updateRadius } = useLocation();
  const {
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
    isLoading,
  } = useRestaurantSearch();
  const { searchRestaurants } = useRestaurantSearchRequest();

  function handleSubmit(event) {
    event.preventDefault();
    searchRestaurants();
  }

  function handleModeChange(event) {
    setSearchMode(event.target.value);
  }

  const radiusLabel =
    RADIUS_LABELS[location.radiusMeters] ??
    `${Math.round(location.radiusMeters / 1609.344)} miles`;

  return (
    <form
      className="restaurant-search-controls"
      onSubmit={handleSubmit}
    >
      <div className="restaurant-primary-filters">
        <div className="restaurant-control">
          <label htmlFor="search-mode">Search mode</label>

          <select
            id="search-mode"
            value={searchMode}
            onChange={handleModeChange}
          >
            <option value="popular">Popular</option>
            <option value="hidden">Hidden gems</option>
          </select>
        </div>

        <SearchPresetInput
          id="active-cuisine-preset"
          value={cuisinePresetId}
          onChange={setCuisinePresetId}
        />
      </div>

      <details className="restaurant-settings restaurant-settings-compact">
        <summary>
          <span className="restaurant-settings-title">
            Search settings
          </span>

          <span className="restaurant-settings-summary">
            {radiusLabel}
          </span>
        </summary>

        <div className="restaurant-settings-grid">
          <div className="restaurant-control">
            <label htmlFor="restaurant-radius">
              Search radius
            </label>

            <select
              id="restaurant-radius"
              value={location.radiusMeters}
              onChange={(event) =>
                updateRadius(event.target.value)
              }
            >
              <option value={1609}>1 mile</option>
              <option value={4828}>3 miles</option>
              <option value={8047}>5 miles</option>
              <option value={16093}>10 miles</option>
              <option value={32187}>20 miles</option>
            </select>
          </div>

          <div className="restaurant-control">
            <label htmlFor="minimum-rating">
              Minimum rating
            </label>

            <select
              id="minimum-rating"
              value={minRating}
              onChange={(event) =>
                setMinRating(Number(event.target.value))
              }
            >
              <option value={0}>Any rating</option>
              <option value={3.5}>3.5+</option>
              <option value={4}>4.0+</option>
              <option value={4.2}>4.2+</option>
              <option value={4.5}>4.5+</option>
            </select>
          </div>

          {searchMode === "hidden" && (
            <div className="hidden-gem-filters">
              <div className="restaurant-control">
                <label htmlFor="hidden-min-reviews">
                  Minimum reviews
                </label>

                <input
                  id="hidden-min-reviews"
                  type="number"
                  min="1"
                  max={maxReviews}
                  value={minReviews}
                  onChange={(event) =>
                    setMinReviews(Number(event.target.value))
                  }
                />
              </div>

              <div className="restaurant-control">
                <label htmlFor="hidden-max-reviews">
                  Maximum reviews
                </label>

                <input
                  id="hidden-max-reviews"
                  type="number"
                  min={minReviews}
                  value={maxReviews}
                  onChange={(event) =>
                    setMaxReviews(Number(event.target.value))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </details>

      <div className="restaurant-search-submit">
        <button
          className="restaurant-search-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>
    </form>
  );
}

export default RestaurantSearchControls;
