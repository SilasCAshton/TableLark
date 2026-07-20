import { useEffect } from "react";
import {
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";

import { useLocation } from "../Utility/LocationContext.jsx";

function MoveMapToLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.panTo(location);
  }, [map, location]);

  return null;
}

function RestaurantMap() {
  const { location } = useLocation();

  return (
    <Map
      defaultCenter={location}
      defaultZoom={13}
      mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
      style={{
        width: "100%",
        height: "500px",
      }}
    >
      <MoveMapToLocation location={location} />

     <AdvancedMarker position={location} />
    </Map>
  );
}

export default RestaurantMap;