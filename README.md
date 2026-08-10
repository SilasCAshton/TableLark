# TableLark Restaurant Finder

TableLark is a React application for finding restaurants around a chosen location. It displays Google Places results in a searchable sidebar and on an interactive Google map.

## How it works

The application starts with a default search location and lets the user replace it in three ways:

- Select an address with Google Places autocomplete.
- Enter latitude and longitude coordinates.
- Grant the browser access to the current device location.

The restaurant search supports three modes:

- **Nearby** ranks places by distance.
- **Popular** ranks places by popularity and can enforce a minimum rating.
- **Hidden gems** filters for highly rated restaurants within a configurable review-count range. This mode can subdivide the search area and make multiple Google Places requests to find more candidates before scoring and deduplicating them.

Users can also choose a restaurant category and a search radius from 1 to 20 miles. Selecting a result centers the map on that restaurant and opens a summary window. Links to the corresponding Google Maps listing are included when Google supplies them.

### Application structure

- `src/App.jsx` configures the Google Maps API provider and the application contexts.
- `src/context/LocationContext.jsx` owns the search coordinates and radius.
- `src/context/RestaurantSearchContext.jsx` owns search settings, results, selection, loading state, and errors.
- `src/components/restaurants/useNearbyRestaurants.js` performs Google Places searches and normalizes the returned places.
- `src/components/RestaurantMap.jsx` and `src/components/restaurants/RestaurantMarkers.jsx` render the map, search center, restaurant markers, and information windows.
- `src/components/LocationControls.jsx` and `src/components/restaurants/RestaurantSearchControls.jsx` provide the location and restaurant filters.
- `src/styles/` contains the global theme, responsive layout, and component styles.

## Requirements

- Node.js and npm
- A Google Maps Platform project with the Maps JavaScript API and Places API enabled
- A Google Maps map ID for advanced markers

Restrict the browser API key to the web origins that host the application and to only the Google APIs the application needs.

## Setup

Install dependencies:

```sh
npm install
```

Create `.env.local` in the project root:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_browser_api_key
VITE_GOOGLE_MAP_ID=your_map_id
```

Files matching `*.local`, including `.env.local`, are ignored by Git. Variables prefixed with `VITE_` are embedded in the browser bundle, so the API key must be protected with Google Cloud restrictions rather than treated as a server-side secret.

Start the development server:

```sh
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

On Windows systems where PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`, for example `npm.cmd run dev`.

## Build

Create an optimized production bundle in `dist/`:

```sh
npm run build
```

Preview that bundle locally:

```sh
npm run preview
```

The preview server is for local verification, not production hosting.

## Test and verify

There is currently no automated test suite. Use the linter and production build as the repeatable validation checks:

```sh
npm run lint
npm run build
```

Then manually verify the behavior that depends on Google Maps and browser APIs:

1. Confirm the map loads without Google API errors.
2. Set the location using an address, coordinates, and current location.
3. Run Nearby, Popular, and Hidden gems searches with multiple radii and categories.
4. Confirm result cards, markers, map centering, information windows, and Google Maps links correspond to the selected restaurant.
5. Check empty, loading, and error states, including denied location permission.
6. Check both desktop and narrow mobile layouts.

Oxlint may report warnings even when it exits successfully. Treat new warnings as regressions and review existing warnings before enabling a stricter CI check.

## Technology

- React 19
- Vite 8
- `@vis.gl/react-google-maps`
- Google Maps JavaScript API and Places API
- Oxlint
- React Compiler
