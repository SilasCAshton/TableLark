import RestaurantMap from "@/components/RestaurantMap";
import TopActionBar from "@/components/TopActionBar";
import RestaurantDiscoveryPanel from "@/components/restaurants/RestaurantDiscoveryPanel";
import AppProviders from "../providers";

export const metadata = {
  title: "Find a Restaurant | TableLark",
};

export default function RestaurantFinderPage() {

  return (
    <AppProviders>
      <main className="restaurant-finder-layout">
        <section className="restaurant-map-panel" aria-label="Restaurant map">
          <RestaurantMap />
        </section>

        <TopActionBar />

        <RestaurantDiscoveryPanel />
      </main>
    </AppProviders>
  );
}
