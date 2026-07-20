import { APIProvider } from "@vis.gl/react-google-maps";
import RestaurantFinder from "./pages/RestaurantFinder.jsx";
import { LocationProvider } from "./Utility/LocationContext.jsx";

function App() {
  return (
    <div>

      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <LocationProvider>
          <RestaurantFinder />
        </LocationProvider> 
      </APIProvider>
    </div>
  );

}

export default App;