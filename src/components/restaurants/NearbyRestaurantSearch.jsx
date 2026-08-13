import RestaurantSearchControls from "./RestaurantSearchControls";
import RestaurantResults from "./RestaurantResults";
function NearbyRestaurantSearch() {
  return (
    <section className="nearby-restaurant-search">
      <header className="restaurant-search-header">
        <p className="restaurant-eyebrow">
          Restaurant discovery
        </p>

        <h1>Find somewhere nearby</h1>

        <p>
          Search by distance, popularity, or hidden-gem
          criteria. All settings and results are shared
          through the restaurant search context.
        </p>
      </header>

      <RestaurantSearchControls />
      <RestaurantResults />
    </section>
  );
}

export default NearbyRestaurantSearch;
