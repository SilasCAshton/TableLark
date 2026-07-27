import { APIProvider } from "@vis.gl/react-google-maps";

import RestaurantFinder from "./pages/RestaurantFinder.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import { RestaurantSearchProvider } from "./context/RestaurantSearchContext.jsx";

function App() {
  return (
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
    >
      <LocationProvider>
        <RestaurantSearchProvider>
          <RestaurantFinder />
        </RestaurantSearchProvider>
      </LocationProvider>
    </APIProvider>
  );
}

export default App;
