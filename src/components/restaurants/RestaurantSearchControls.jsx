"use client";

import { useLocation } from "@/context/LocationContext";
import { useRestaurantSearch } from "@/context/RestaurantSearchContext";
import { useRestaurantSearchRequest } from "@/hooks/useRestaurantSearchRequest";
import {
  DEFAULT_RESTAURANT_SEARCH_PRESET_ID,
  getRestaurantSearchPreset,
  RESTAURANT_SEARCH_PRESETS,
} from "@/lib/restaurants/search-presets";

const SEARCH_MODE_LABELS = {
  nearby: "Nearby",
  popular: "Popular",
  hidden: "Hidden gems",
};

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
      <label htmlFor={id}>Cuisine</label>

      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
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

    nearbySearch,
    updateNearbySearch,

    popularSearch,
    updatePopularSearch,

    hiddenGemSearch,
    updateHiddenGemSearch,

    resetActiveSearch,
    isLoading,
  } = useRestaurantSearch();

  const {
    searchRestaurants,
    clearRestaurants,
  } = useRestaurantSearchRequest();

  function handleSubmit(event) {
    event.preventDefault();
    searchRestaurants();
  }

  function handleModeChange(event) {
    setSearchMode(event.target.value);
    clearRestaurants();
  }

  const activePresetId =
    searchMode === "popular"
      ? popularSearch.presetId
      : searchMode === "hidden"
        ? hiddenGemSearch.presetId
        : nearbySearch.presetId;

  const presetLabel =
    getRestaurantSearchPreset(activePresetId)?.name ??
    getRestaurantSearchPreset(
      DEFAULT_RESTAURANT_SEARCH_PRESET_ID,
    ).name;

  const radiusLabel =
    RADIUS_LABELS[location.radiusMeters] ??
    `${Math.round(location.radiusMeters / 1609.344)} miles`;

  return (
    <form
      className="restaurant-search-controls"
      onSubmit={handleSubmit}
    >
      <details className="restaurant-settings">
        <summary>
          <span className="restaurant-settings-title">
            Search settings
          </span>

          <span className="restaurant-settings-summary">
            {SEARCH_MODE_LABELS[searchMode]} · {radiusLabel} ·{" "}
            {presetLabel}
          </span>
        </summary>

        <div className="restaurant-settings-grid">
          <div className="restaurant-control">
            <label htmlFor="search-mode">Search mode</label>

            <select
              id="search-mode"
              value={searchMode}
              onChange={handleModeChange}
            >
              <option value="nearby">Nearby</option>
              <option value="popular">Popular</option>
              <option value="hidden">Hidden gems</option>
            </select>
          </div>

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

          {searchMode === "nearby" && (
            <SearchPresetInput
              id="nearby-preset"
              value={nearbySearch.presetId}
              onChange={(value) =>
                updateNearbySearch("presetId", value)
              }
            />
          )}

          {searchMode === "popular" && (
            <>
              <SearchPresetInput
                id="popular-preset"
                value={popularSearch.presetId}
                onChange={(value) =>
                  updatePopularSearch("presetId", value)
                }
              />

              <div className="restaurant-control">
                <label htmlFor="popular-min-rating">
                  Minimum rating
                </label>

                <select
                  id="popular-min-rating"
                  value={popularSearch.minRating}
                  onChange={(event) =>
                    updatePopularSearch(
                      "minRating",
                      Number(event.target.value),
                    )
                  }
                >
                  <option value={0}>Any rating</option>
                  <option value={3.5}>3.5+</option>
                  <option value={4}>4.0+</option>
                  <option value={4.2}>4.2+</option>
                  <option value={4.5}>4.5+</option>
                </select>
              </div>
            </>
          )}

          {searchMode === "hidden" && (
            <>
              <SearchPresetInput
                id="hidden-preset"
                value={hiddenGemSearch.presetId}
                onChange={(value) =>
                  updateHiddenGemSearch("presetId", value)
                }
              />

              <div className="hidden-gem-filters">
                <div className="restaurant-control">
                  <label htmlFor="hidden-min-rating">
                    Minimum rating
                  </label>

                  <select
                    id="hidden-min-rating"
                    value={hiddenGemSearch.minRating}
                    onChange={(event) =>
                      updateHiddenGemSearch(
                        "minRating",
                        Number(event.target.value),
                      )
                    }
                  >
                    <option value={3.5}>3.5+</option>
                    <option value={4}>4.0+</option>
                    <option value={4.2}>4.2+</option>
                    <option value={4.5}>4.5+</option>
                  </select>
                </div>

                <div className="restaurant-control">
                  <label htmlFor="hidden-min-reviews">
                    Minimum reviews
                  </label>

                  <input
                    id="hidden-min-reviews"
                    type="number"
                    min="1"
                    max={hiddenGemSearch.maxReviews}
                    value={hiddenGemSearch.minReviews}
                    onChange={(event) =>
                      updateHiddenGemSearch(
                        "minReviews",
                        Number(event.target.value),
                      )
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
                    min={hiddenGemSearch.minReviews}
                    value={hiddenGemSearch.maxReviews}
                    onChange={(event) =>
                      updateHiddenGemSearch(
                        "maxReviews",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      <div className="restaurant-search-actions">
        <button
          className="restaurant-search-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? "Searching..."
            : "Search this area"}
        </button>

        <button
          type="button"
          onClick={resetActiveSearch}
          disabled={isLoading}
        >
          Reset this mode
        </button>
      </div>
    </form>
  );
}

export default RestaurantSearchControls;
