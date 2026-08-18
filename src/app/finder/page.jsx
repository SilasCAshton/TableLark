import RestaurantMap from "@/components/RestaurantMap";
import TopActionBar from "@/components/TopActionBar";
import RestaurantDiscoveryPanel from "@/components/restaurants/RestaurantDiscoveryPanel";
import AppProviders from "../providers";

export const metadata = {
  title: "Find a Restaurant | TableLark",
};

function getInitialLocation(searchParams) {
  const lat = Number(searchParams.lat);
  const lng = Number(searchParams.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return undefined;
  }

  return { lat, lng };
}

export default async function RestaurantFinderPage({ searchParams }) {
  const initialLocation = getInitialLocation(await searchParams);

  return (
    <AppProviders initialLocation={initialLocation}>
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
