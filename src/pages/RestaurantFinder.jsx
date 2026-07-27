import TopActionBar from "../components/TopActionBar.jsx";
import NearbyRestaurantSearch from "../components/restaurants/NearbyRestaurantSearch.jsx";
import RestaurantMap from "../components/RestaurantMap.jsx";

function RestaurantFinder() {
  return (
    <main className="restaurant-finder-layout">
      <section
        className="restaurant-map-panel"
        aria-label="Restaurant map"
      >
        <RestaurantMap />
      </section>

      <TopActionBar />

      <aside
        className="restaurant-sidebar"
        aria-label="Restaurant search and results"
      >
        <NearbyRestaurantSearch />
      </aside>
    </main>
  );
}

export default RestaurantFinder;
