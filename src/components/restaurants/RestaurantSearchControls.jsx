import { useLocation } from "../../context/LocationContext.jsx";
import { useRestaurantSearch } from "../../context/RestaurantSearchContext.jsx";
import { useNearbyRestaurants } from "./useNearbyRestaurants.js";
const CATEGORY_OPTIONS = [
  ["restaurant", "All restaurants"],
  ["cafe", "Cafes"],
  ["bakery", "Bakeries"],
  ["pizza_restaurant", "Pizza"],
  ["italian_restaurant", "Italian"],
  ["mexican_restaurant", "Mexican"],
  ["chinese_restaurant", "Chinese"],
  ["seafood_restaurant", "Seafood"],
];

function CategoryInput({ id, value, onChange }) {
  return (
    <div className="restaurant-control">
      <label htmlFor={id}>Place category</label>

      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        {CATEGORY_OPTIONS.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MaxResultsInput({ id, value, onChange }) {
  return (
    <div className="restaurant-control">
      <label htmlFor={id}>Maximum results</label>

      <input
        id={id}
        type="number"
        min="1"
        max="20"
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />
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
    placesLibraryIsReady,
    searchNearbyRestaurants,
    clearRestaurants,
  } = useNearbyRestaurants();

  function handleSubmit(event) {
    event.preventDefault();
    searchNearbyRestaurants();
  }

  function handleModeChange(event) {
    setSearchMode(event.target.value);
    clearRestaurants();
  }

  return (
    <form
      className="restaurant-search-controls"
      onSubmit={handleSubmit}
    >
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
        <>
          <CategoryInput
            id="nearby-category"
            value={nearbySearch.category}
            onChange={(value) =>
              updateNearbySearch("category", value)
            }
          />

          <MaxResultsInput
            id="nearby-max-results"
            value={nearbySearch.maxResults}
            onChange={(value) =>
              updateNearbySearch("maxResults", value)
            }
          />
        </>
      )}

      {searchMode === "popular" && (
        <>
          <CategoryInput
            id="popular-category"
            value={popularSearch.category}
            onChange={(value) =>
              updatePopularSearch("category", value)
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

          <MaxResultsInput
            id="popular-max-results"
            value={popularSearch.maxResults}
            onChange={(value) =>
              updatePopularSearch("maxResults", value)
            }
          />
        </>
      )}

      {searchMode === "hidden" && (
        <>
          <CategoryInput
            id="hidden-category"
            value={hiddenGemSearch.category}
            onChange={(value) =>
              updateHiddenGemSearch("category", value)
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

          <MaxResultsInput
            id="hidden-max-results"
            value={hiddenGemSearch.maxResults}
            onChange={(value) =>
              updateHiddenGemSearch("maxResults", value)
            }
          />
        </>
      )}

      <div className="restaurant-search-actions">
        <button
          className="restaurant-search-button"
          type="submit"
          disabled={!placesLibraryIsReady || isLoading}
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
