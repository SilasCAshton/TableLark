"use client";

import { usePollBuilder } from "@/context/PollBuilderContext";
import { useRestaurantSearch } from "@/context/RestaurantSearchContext";
import { POLL_RESTAURANT_COLOR } from "@/lib/restaurants/poll-appearance";
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
    addRestaurant,
    removeRestaurant,
    hasRestaurant,
    isFull,
  } = usePollBuilder();
  const {
    selectedRestaurantId,
    selectRestaurant,
    minRating,
    minReviews,
    maxReviews,
  } = useRestaurantSearch();

  const isSelected =
    selectedRestaurantId === restaurant.id;
  const isInPoll = hasRestaurant(restaurant.id);
  const pollActionLabel = isInPoll
    ? "Remove from poll"
    : isFull
      ? "Poll is full"
      : "Add to poll";

  const priceLabel = formatPriceLevel(
    restaurant.priceLevel,
  );

  const isHiddenGem =
    restaurant.rating !== null &&
    restaurant.rating >= minRating &&
    restaurant.reviewCount !== null &&
    restaurant.reviewCount >= minReviews &&
    restaurant.reviewCount <= maxReviews;

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
          <h3 style={isInPoll ? { color: POLL_RESTAURANT_COLOR } : undefined}>
            {restaurant.name}
          </h3>

          {restaurant.primaryTypeDisplayName && (
            <p className="restaurant-type">
              {restaurant.primaryTypeDisplayName}
            </p>
          )}
        </div>

        {isHiddenGem && (
          <span className="hidden-gem-label">
            Hidden gem
          </span>
        )}
        <button
          type="button"
          className="restaurant-poll-action"
          aria-label={pollActionLabel}
          title={pollActionLabel}
          aria-disabled={!isInPoll && isFull}
          onClick={() => {
            if (isInPoll) {
              removeRestaurant(restaurant.id);
            } else if (!isFull) {
              addRestaurant(restaurant);
            }
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={isInPoll ? "M5 12l4 4L19 6" : "M12 5v14M5 12h14"} />
          </svg>
        </button>
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
      <div className="restaurant-status" role="status">
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
        Set your preferences, then search this area.
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
