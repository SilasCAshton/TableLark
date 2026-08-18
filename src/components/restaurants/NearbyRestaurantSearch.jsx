import RestaurantSearchControls from "./RestaurantSearchControls";
import RestaurantResults from "./RestaurantResults";

function NearbyRestaurantSearch({ isCollapsed, onToggleCollapsed }) {
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

        <h1>Find somewhere nearby</h1>

        <p>
          Choose a search style and distance, then explore
          restaurants that fit the mood.
        </p>
      </header>

      <div
        id="restaurant-search-content"
        className="restaurant-search-content"
      >
        <RestaurantSearchControls />
        <RestaurantResults />
      </div>
    </section>
  );
}

export default NearbyRestaurantSearch;
