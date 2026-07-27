import { useEffect } from "react";
import {
  AdvancedMarker,
  InfoWindow,
  useMap,
  Pin,
} from "@vis.gl/react-google-maps";

import { useLocation } from "../../context/LocationContext.jsx";
import { useRestaurantSearch } from "../../context/RestaurantSearchContext.jsx";

function MapPositionController({
  searchCenter,
  selectedRestaurant,
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !searchCenter) {
      return;
    }

    map.panTo(searchCenter);
  }, [map, searchCenter.lat, searchCenter.lng]);

  useEffect(() => {
    if (!map || !selectedRestaurant?.location) {
      return;
    }

    map.panTo(selectedRestaurant.location);

    const currentZoom = map.getZoom() ?? 12;

    if (currentZoom < 14) {
      map.setZoom(14);
    }
  }, [map, selectedRestaurant]);

  return null;
}

function RestaurantMarkers() {
  const { location } = useLocation();

  const {
    restaurants,
    selectedRestaurant,
    selectRestaurant,
  } = useRestaurantSearch();

  const searchCenter = {
    lat: Number(location.lat),
    lng: Number(location.lng),
  };

  return (
    <>
      <MapPositionController
        searchCenter={searchCenter}
        selectedRestaurant={selectedRestaurant}
      />

      <AdvancedMarker
        position={searchCenter}
        title="Search center"
        zIndex={1000}
      />

      {restaurants.map((restaurant) => (
        <AdvancedMarker
          key={restaurant.id}
          position={restaurant.location}
          title={restaurant.name}
          zIndex={
            selectedRestaurant?.id === restaurant.id
              ? 100
              : 1
          }
          onClick={() => selectRestaurant(restaurant.id)}
          >
          
          </AdvancedMarker>
      ))}

      {selectedRestaurant?.location && (
        <InfoWindow
          position={selectedRestaurant.location}
          onCloseClick={() => selectRestaurant(null)}
        >
          <div className="restaurant-info-window">
            <h3>{selectedRestaurant.name}</h3>

            <p>{selectedRestaurant.address}</p>

            {selectedRestaurant.rating !== null && (
              <p>
                ★ {selectedRestaurant.rating.toFixed(1)}
                {selectedRestaurant.reviewCount !== null &&
                  ` · ${selectedRestaurant.reviewCount.toLocaleString()} reviews`}
              </p>
            )}

            {selectedRestaurant.googleMapsURI && (
              <a
                href={selectedRestaurant.googleMapsURI}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default RestaurantMarkers;
