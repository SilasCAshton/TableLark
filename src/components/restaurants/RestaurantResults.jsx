"use client";

import { useRestaurantSearch } from "@/context/RestaurantSearchContext";
function formatPriceLevel(priceLevel) {
  const priceLabels = {
    FREE: "Free",
    INEXPENSIVE: "$",
    MODERATE: "$$",
    EXPENSIVE: "$$$",
    VERY_EXPENSIVE: "$$$$",
  };

  return priceLabels[priceLevel] ?? "";
}

function RestaurantCard({ restaurant }) {
  const {
    selectedRestaurantId,
    selectRestaurant,
    searchMode,
  } = useRestaurantSearch();

  const isSelected =
    selectedRestaurantId === restaurant.id;

  const priceLabel = formatPriceLevel(
    restaurant.priceLevel,
  );

  return (
    <article
      className={`restaurant-card ${
        isSelected
          ? "restaurant-card-selected"
          : ""
      }`}
    >
      <div className="restaurant-card-header">
        <div>
          <h3>{restaurant.name}</h3>

          {restaurant.primaryTypeDisplayName && (
            <p className="restaurant-type">
              {restaurant.primaryTypeDisplayName}
            </p>
          )}
        </div>

        {searchMode === "hidden" && (
          <span className="hidden-gem-label">
            Hidden gem
          </span>
        )}
      </div>

      <p className="restaurant-address">
        {restaurant.address}
      </p>

      <div className="restaurant-details">
        {restaurant.rating !== null && (
          <span>
            ★ {restaurant.rating.toFixed(1)}
          </span>
        )}

        {restaurant.reviewCount !== null && (
          <span>
            {restaurant.reviewCount.toLocaleString()}{" "}
            reviews
          </span>
        )}

        {priceLabel && (
          <span>{priceLabel}</span>
        )}
      </div>

      <div className="restaurant-card-actions">
        <button
          type="button"
          onClick={() =>
            selectRestaurant(restaurant.id)
          }
        >
          Show on map
        </button>

        {restaurant.googleMapsURI && (
          <a
            href={restaurant.googleMapsURI}
            target="_blank"
            rel="noreferrer"
          >
            View on Google Maps
          </a>
        )}
      </div>
    </article>
  );
}

function PlaceAttributions({ restaurants }) {
  const uniqueAttributions = new Map();

  for (const restaurant of restaurants) {
    for (
      const attribution of
      restaurant.attributions ?? []
    ) {
      if (!attribution.provider) {
        continue;
      }

      const key =
        attribution.providerURI ??
        attribution.provider;

      uniqueAttributions.set(
        key,
        attribution,
      );
    }
  }

  const attributions = [
    ...uniqueAttributions.values(),
  ];

  if (attributions.length === 0) {
    return null;
  }

  return (
    <div className="place-attributions">
      <span>
        Additional place data provided by{" "}
      </span>

      {attributions.map(
        (attribution, index) => (
          <span
            key={
              attribution.providerURI ??
              attribution.provider
            }
          >
            {index > 0 && ", "}

            {attribution.providerURI ? (
              <a
                href={attribution.providerURI}
                target="_blank"
                rel="noreferrer"
              >
                {attribution.provider}
              </a>
            ) : (
              attribution.provider
            )}
          </span>
        ),
      )}
    </div>
  );
}

function RestaurantResults() {
  const {
    restaurants,
    isLoading,
    errorMessage,
    hasSearched,
  } = useRestaurantSearch();

  if (isLoading) {
    return (
      <div className="restaurant-status">
        Searching nearby places...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="restaurant-status restaurant-error"
        role="alert"
      >
        {errorMessage}
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="restaurant-status">
        Choose your filters and start a search.
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="restaurant-status">
        No restaurants matched these settings.
        Try a larger radius or less restrictive
        filters.
      </div>
    );
  }

  return (
    <section
      className="restaurant-results"
      aria-label="Restaurant search results"
    >
      <div className="restaurant-results-heading">
        <h2>Results</h2>

        <span>
          {restaurants.length}{" "}
          {restaurants.length === 1
            ? "place"
            : "places"}
        </span>
      </div>

      <div className="restaurant-results-scroll">
        <div className="restaurant-card-list">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
            />
          ))}
        </div>
      </div>

      <PlaceAttributions
        restaurants={restaurants}
      />
    </section>
  );
}

export default RestaurantResults;
