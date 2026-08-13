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
- **Hidden gems** filters for highly rated restaurants within a configurable review-count range. The server can subdivide the search area and make multiple bounded Google Places requests to find more candidates before scoring and deduplicating them.

Users can also choose a restaurant category and a search radius from 1 to 20 miles. Selecting a result centers the map on that restaurant and opens a summary window. Links to the corresponding Google Maps listing are included when Google supplies them.

### Application structure

- `src/app/layout.jsx` defines the root document, metadata, global styles, and provider boundary.
- `src/app/page.jsx` defines the home route and composes the map, action bar, and results panel.
- `src/app/providers.jsx` configures the client-side Google Maps API provider and application contexts.
- `src/app/globals.css` is the global stylesheet entrypoint used by the root layout.
- `src/app/api/restaurants/search/route.js` validates restaurant requests, applies basic rate limiting, invokes the server search, and returns normalized JSON.
- `src/context/LocationContext.jsx` owns the search coordinates and radius.
- `src/context/RestaurantSearchContext.jsx` owns search settings, results, selection, loading state, and errors.
- `src/hooks/useRestaurantSearchRequest.js` sends lightweight browser requests to the restaurant API and manages cancellation and search state.
- `src/lib/restaurants/` contains server-side Google Places access, validation, subdivision, distance filtering, normalization, and hidden-gem scoring.
- `src/components/RestaurantMap.jsx` and `src/components/restaurants/RestaurantMarkers.jsx` render the map, search center, restaurant markers, and information windows.
- `src/components/LocationControls.jsx` and `src/components/restaurants/RestaurantSearchControls.jsx` provide the location and restaurant filters.
- `src/styles/` contains the global theme, responsive layout, and component styles.

## Requirements

- Node.js and npm
- A Google Maps Platform project with the Maps JavaScript API and Places API (New) enabled
- A Google Maps map ID for advanced markers

Use separate browser and server API keys. Restrict the browser key to the web origins that host the application and the Maps JavaScript API. Restrict the private server key to Places API (New) and server-side usage where the deployment platform supports it.
For local development, authorize `http://localhost:3000/*` in the key's website restrictions.

## Setup

Install dependencies:

```sh
npm install
```

Copy `.env.example` to `.env.local` and add your Google Maps values:

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_api_key
NEXT_PUBLIC_GOOGLE_MAP_ID=your_map_id
GOOGLE_PLACES_API_KEY=your_private_server_api_key
```

Environment files are ignored by Git except for `.env.example`. Variables prefixed with `NEXT_PUBLIC_` are embedded in the browser bundle at build time. `GOOGLE_PLACES_API_KEY` has no public prefix and is read only by the server-side Places client.

The application can render the map with only the public key, but restaurant searches return a configuration error until `GOOGLE_PLACES_API_KEY` is set.

Start the development server:

```sh
npm run dev
```

Open the local URL printed by Next.js, normally `http://localhost:3000`.

On Windows systems where PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`, for example `npm.cmd run dev`.

## Build

Create an optimized production build in `.next/`:

```sh
npm run build
```

Run the production server after a successful build:

```sh
npm run start
```

Next.js supports deployment as a Node.js server. A static-only host is not sufficient because `/api/restaurants/search` executes on the server for every search.

## Test and verify

Run the backend logic tests, linter, and production build as the repeatable validation checks:

```sh
npm test
npm run lint
npm run build
```

Then manually verify the behavior that depends on Google Maps and browser APIs:

1. Confirm the map loads without Google API errors.
2. Set the location using an address, coordinates, and current location.
3. Confirm missing or invalid server configuration produces a safe error message rather than exposing credentials or Google response details.
4. Run Nearby, Popular, and Hidden gems searches with multiple radii and categories.
5. Confirm result cards, markers, map centering, information windows, and Google Maps links correspond to the selected restaurant.
6. Check empty, loading, rate-limit, and error states, including denied location permission.
7. Check both desktop and narrow mobile layouts.

Oxlint should complete without errors or warnings. Treat new warnings as regressions.

## Technology

- React 19
- Next.js 16 with the App Router
- `@vis.gl/react-google-maps`
- Google Maps JavaScript API and Places API
- Oxlint
- React Compiler
