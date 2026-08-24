# TableLark Ideas Backlog

This document holds potential product and development ideas that are worth revisiting later. An idea appearing here is not a commitment to build it.

## Status guide

- **New** — Captured but not yet discussed in detail.
- **Considering** — Being evaluated.
- **Tabled** — Intentionally paused for possible future consideration.
- **Planned** — Approved for future implementation.
- **Completed** — Implemented and retained here for historical context.
- **Declined** — Considered but not currently a fit.

## Ideas

### Persist the user's selected location

- **Status:** Tabled
- **Added:** August 24, 2026
- **Idea:** Preserve a user's selected location when they move between the Finder and homepage.
- **Potential benefit:** Users could return to the Finder without selecting their location again.
- **Potential concerns:** Precise coordinates are sensitive, saved locations can become stale, and shared-device users could inherit someone else's location.
- **Possible approach:** Store explicitly selected locations in `sessionStorage` so they persist within the current browser tab but disappear when the tab closes. Use location priority in this order: URL coordinates, saved session location, then the New Orleans default. Do not request location automatically.
- **Decision:** Revisit later.

### Meet in the Middle

- **Status:** New
- **Added:** August 24, 2026
- **Idea:** Accept two starting locations, calculate one or more practical midpoint areas, and search for restaurants around those areas.
- **Potential benefit:** Makes it easier for two people or groups coming from different places to choose a fair meeting spot.
- **Potential concerns:** A geographic midpoint may not be equally convenient because of roads, traffic, transit routes, water, or other travel barriers. Handling two locations also increases map and search complexity.
- **Possible approach:** Begin with a geographic midpoint and nearby restaurant search. A later version could offer several midpoint candidates or use estimated travel time to find a fairer meeting area.
- **Decision:** Explore the desired midpoint and travel-time behavior before planning implementation.

### Custom search presets

- **Status:** New
- **Added:** August 24, 2026
- **Idea:** Let users choose restaurant categories and save those selections as custom presets that remain easily available for future searches.
- **Potential benefit:** Frequent category combinations could be reused without rebuilding the same filters each time.
- **Potential concerns:** Presets need clear naming, editing, deletion, storage, and fallback behavior if supported restaurant categories change.
- **Possible approach:** Allow users to select one or more supported categories, name the preset, and save it locally. Display custom presets alongside the built-in presets while keeping them visually distinct.
- **Decision:** Determine whether presets should remain on one device or eventually follow a signed-in user.

### Locally averaged hidden-gem scoring

- **Status:** New
- **Added:** August 24, 2026
- **Idea:** Calculate an average or typical number of reviews for comparable restaurants in the selected area and use that local context when identifying hidden gems.
- **Potential benefit:** Hidden-gem results could be more accurate than results based only on fixed review-count limits. A restaurant with 300 reviews may be widely known in a small town but relatively undiscovered in a major city.
- **Potential concerns:** A simple mean can be distorted by a few extremely popular restaurants. Small result sets, new restaurants, chains, and differences between restaurant categories may also skew the comparison.
- **Possible approach:** Compare each restaurant with restaurants in the same area and category. Evaluate the median or a trimmed average in addition to the mean, require a minimum comparison sample, and combine relative review count with rating quality and confidence.
- **Decision:** Research and test candidate scoring formulas against realistic restaurant result sets before replacing the current hidden-gem thresholds.

## Idea template

Copy this section when adding another idea:

### Idea name

- **Status:** New
- **Added:** Month DD, YYYY
- **Idea:** Brief description.
- **Potential benefit:** What this could improve.
- **Potential concerns:** Important costs, risks, or tradeoffs.
- **Possible approach:** A high-level implementation direction, if known.
- **Decision:** Next step or reason for pausing.
