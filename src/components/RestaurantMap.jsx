import { Map } from "@vis.gl/react-google-maps";

import { useLocation } from "../context/LocationContext.jsx";
import RestaurantMarkers from "./restaurants/RestaurantMarkers.jsx";
function RestaurantMap() {
  const { location } = useLocation();

  const mapCenter = {
    lat: Number(location.lat),
    lng: Number(location.lng),
  };

  return (
    <section
      className="restaurant-map-container"
      aria-label="Restaurant map"
    >
      <Map
        defaultCenter={mapCenter}
        defaultZoom={13}
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <RestaurantMarkers />
      </Map>
    </section>
  );
}

export default RestaurantMap;
