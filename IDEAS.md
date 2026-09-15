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

#### Advanced app-based group version

- **Added:** September 12, 2026
- **Idea:** Let an organizer create a Meet in the Middle session and send an invitation link to one or more friends. Each participant opens the link in the app and explicitly shares their current location or enters a starting location, connecting everyone to the same planning session.
- **Group flow:** Support more than two participants, calculate one or more practical central meeting areas from everyone's starting point, build a shared restaurant shortlist around the selected area, and let the group vote on the final choice.
- **App benefit:** A dedicated app experience could provide reliable invitations and notifications when someone joins, locations are ready, a shared list is available, voting is about to close, or a winner has been selected.
- **Privacy and safety:** Location sharing must be opt-in and clearly scoped to the active session. Avoid revealing participants' precise locations to one another by default, minimize how long location data is retained, allow participants to leave or revoke access, and expire abandoned sessions and invitation links.
- **Possible approach:** Use an expiring shared-session link, participant presence and consent states, a server-side midpoint or travel-time calculation, and real-time session updates. Reuse the ranked restaurant polling system for the shared shortlist and final vote where practical.
- **Decision:** Treat this as a later app-focused evolution of the basic two-location feature. Define location privacy, session ownership, notification behavior, participant limits, and travel-time fairness before implementation.

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

### SEO in Next.js

- **Status:** New
- **Added:** August 30, 2026
- **Idea:** Improve the app's search-engine visibility by applying Next.js SEO features and making public pages easier for search engines to understand and index.
- **Potential benefit:** More people could discover TableLark through relevant searches, while richer link previews and clearer page information could improve how the app appears when shared.
- **Potential concerns:** Search or location pages with thin, duplicated, or highly dynamic content may provide little SEO value. Public indexing must also avoid exposing private polls, user-specific state, or sensitive location data.
- **Possible approach:** Define page-specific titles and descriptions with the Next.js Metadata API, add canonical URLs, Open Graph and social metadata, structured data where appropriate, `robots.txt`, and a sitemap. Review server-rendered content, semantic markup, Core Web Vitals, and indexing rules for each route.
- **Decision:** Audit the current routes and choose which pages should be indexable before defining the implementation scope.

### Finder page mobile UX improvements

- **Status:** New
- **Added:** August 31, 2026
- **Idea:** Improve the Finder page interaction flow, especially on mobile devices.
- **Requested updates:**
  1. Automatically collapse the location dropdown after the user submits an address successfully.
  2. Improve the Discovery panel's layout and usability on mobile devices.
  3. Fix the scroll clipping that causes scrolling content to overlap or show through the restaurant result cards.
  4. When **Show on map** reveals or focuses the map, center the restaurant within the visible map area rather than at the center of the overall screen.
  5. Select a restaurant by clicking or tapping its card. The **Show on map** button should only reveal or move the map to that restaurant and should not change the selected restaurant.
  6. Recenter the map on the focused restaurant when menus or panels open, close, or change size so the restaurant remains centered within the newly visible map area.
- **Potential benefit:** The location controls would stop obscuring results after submission, the Discovery panel would be easier to browse and operate on smaller screens, restaurant cards would remain visually clean while scrolling, and map actions would behave more predictably.
- **Potential concerns:** The dropdown should remain open when address submission fails or requires clarification. Mobile panel changes must preserve access to filters, restaurant details, map interactions, and accessible controls without creating awkward scrolling or overlap. The clipping fix must not hide card content, shadows, focus indicators, or other intended overflow. Interactive controls inside a clickable card must continue to perform their own actions without accidentally selecting the card.
- **Possible approach:** Close the location dropdown only after the submitted address has been accepted, then review the Discovery panel at common mobile viewport sizes and refine its responsive layout, spacing, scrolling, touch targets, and open or collapsed states. Inspect the result list's overflow, stacking, backgrounds, and scroll-container boundaries to isolate and correct the card clipping. Separate restaurant selection from map movement, account for the map's actual visible bounds when panning, and ensure nested card controls stop or handle click propagation appropriately. Recalculate the map viewport after panel resizing or layout transitions complete, then pan the focused restaurant into the center of the available map area without repeatedly fighting manual map movement.
- **Decision:** Review the current Finder page on mobile and define acceptance criteria before implementation.

### Default search criteria audit

- **Status:** New
- **Added:** September 2, 2026
- **Idea:** Review the search criteria used by each built-in default search and investigate whether any of the current rules are producing incorrect or unexpected results.
- **Potential benefit:** The default searches could return more relevant, predictable restaurant recommendations and better match what their labels promise users.
- **Potential concerns:** Apparent problems may come from incomplete or inconsistent provider data rather than the criteria themselves. Changing thresholds or filters without representative testing could improve one location or category while making others worse.
- **Possible approach:** Document the current criteria for every default search, collect examples of questionable results, identify whether each issue comes from configuration, filtering, ranking, or source data, and test proposed adjustments across multiple locations before applying them.
- **Decision:** Investigate and reproduce the suspected issues, then fix the criteria where the evidence supports a change.

### Restaurant result ranking and display order

- **Status:** New
- **Added:** September 2, 2026
- **Idea:** Improve how matching restaurants are scored, ranked, and ordered in the results shown to users.
- **Potential benefit:** The strongest and most relevant recommendations would appear first instead of relying on an arbitrary provider order or any single signal such as distance, rating, or review count.
- **Potential concerns:** Weighting popular restaurants too heavily could bury hidden gems, while emphasizing rating without accounting for review confidence could promote unreliable results. Different default searches may also need different ranking priorities, and the ordering should remain understandable and stable enough to feel trustworthy.
- **Possible approach:** Identify the current ordering behavior, define a transparent base score using signals such as search relevance, distance, rating, review confidence, open status, and preset-specific criteria, then establish deterministic tie-breakers. Compare candidate rankings against representative result sets from multiple locations and search types.
- **Decision:** Audit the current ranking path and collect examples of poorly ordered results before choosing and tuning a scoring model.

### Rating-weighted random restaurant search

- **Status:** New
- **Added:** September 7, 2026
- **Idea:** Offer a fully random discovery search that helps users branch out from their normal choices. First gather restaurants that satisfy the selected search criteria, then randomly choose one eligible restaurant using ratings to weight the selection.
- **Potential benefit:** Users could make a quick, playful decision while still receiving a restaurant that fits their needs. Rating-based weighting would favor stronger options without always returning the same highest-ranked restaurants.
- **Potential concerns:** Weighting ratings too aggressively could make the feature feel predictable and bury unfamiliar restaurants. Raw ratings can also be unreliable when based on very few reviews, and repeated searches could be abused until a preferred result appears.
- **Possible approach:** Filter and organize the eligible restaurant pool using the normal search criteria, calculate a selection weight for each restaurant from its rating and an appropriate review-confidence adjustment, then make one weighted-random draw. Keep every qualified restaurant eligible, display why it qualified, and consider a controlled reroll option.
- **Decision:** Define and test the weighting formula to balance result quality with genuine randomness before implementation.

### Lark Together: shareable ranked restaurant choices

- **Status:** In progress
- **Added:** August 27, 2026
- **Idea:** Let an organizer start a time-limited **Lark Together** from a restaurant shortlist, share it through a web link, collect private ranked ballots, and reveal the winning restaurant after voting closes. Internal implementation details retain the established `poll` terminology.
- **Potential benefit:** A group can make a restaurant decision without exposing early results or allowing the current leader to influence later voters.
- **Potential concerns:** The first version will rely on trust rather than verified identities, so it cannot completely prevent duplicate voting. Poll ownership, link privacy, concurrent submissions near the vote limit, abandoned polls, and retention of voter names and ballots will need deliberate handling.
- **Decision:** The complete local polling path is implemented: Finder shortlist and configuration, persisted poll creation, participant voting and editing, private waiting, organizer controls, tie handling, and final results. Visual refinement, production database provisioning, retention policy, and production hardening remain for later phases.

#### Poll setup and lifecycle

1. The organizer builds a shortlist containing at least two restaurants.
2. The organizer configures a deadline, a maximum number of accepted ballots, and the final tie behavior.
3. Selecting **Create poll** creates the poll, starts its countdown, locks the restaurant shortlist, and produces a participant URL that can be shared.
4. The organizer is prompted to vote after creating the poll. Their ballot is processed exactly like any other ballot and is included in the submission count.
5. Voting closes as soon as any one of these conditions occurs:
   - The countdown reaches zero.
   - The configured maximum number of ballots has been accepted.
   - The organizer manually selects **Close voting** and confirms the action.
6. Closing is permanent. No new ballots or edits are accepted after the close event.
7. The app calculates the winner and replaces the voting or waiting interface with the final result.

#### Participant ballot

- Anyone with the participant link can vote while the poll is open.
- A participant may enter a name, but a name is not required.
- The system is trust-based rather than account-verified. The intended lightweight safeguard is one ballot per browser, without fingerprinting or other invasive identification. A normal browser-storage identifier could associate later visits with the same ballot, but clearing storage or using another browser could bypass it.
- A ballot ranks distinct restaurants in order: favorite, second favorite, and third favorite when the shortlist contains at least three options. The same restaurant cannot occupy more than one rank.
- After submitting, the participant sees:
  - Confirmation that the ballot was received.
  - Their current choices from favorite through third favorite.
  - Restaurants they did not rank inside a collapsed control labeled **Other options**.
  - An option to edit their ballot while voting remains open.
  - A countdown to the deadline.
  - A waiting-for-the-final-decision message.
- The participant does not see the submission count, voter names, scores, standings, or preliminary leader.
- Saving an edit replaces the participant's earlier ballot rather than adding another ballot. If voting closes while an edit is underway, the last successfully saved version is counted; an edit submitted after closure is rejected.

#### Organizer experience

- While voting is open, the organizer sees only the accepted-ballot count, expressed as **Total votes in: 7 (including yours)** when their ballot has been submitted.
- The organizer cannot see individual ballots, scores, standings, or a preliminary leader.
- The organizer can edit their own ballot under the same rules as any participant.
- The organizer can permanently close voting before the deadline or maximum is reached. The action should warn that unsubmitted ballots and unsaved edits will no longer be accepted.
- Organizer controls must not be available through the public participant link. This will require either an authenticated organizer session or a separate private management link.

#### Vote capacity

- Every poll has an organizer-selected maximum number of accepted ballots.
- The working default is 20 ballots. It remains to be decided whether 20 is merely the default, the highest allowed custom value, or whether larger custom limits will be supported.
- Replacing an existing ballot through an edit does not increase the accepted-ballot count.
- If multiple people submit when only one place remains, the first ballot the server successfully accepts fills the poll; later submissions are rejected and shown the completed result.

#### Scoring and tie handling

For polls with at least three restaurants, every completed ballot awards:

- Favorite: 3 points
- Second favorite: 2 points
- Third favorite: 1 point

Scores are summed across all accepted ballots. Ties are narrowed in this order:

1. Highest total points
2. Most favorite rankings
3. Most second-favorite rankings
4. Most third-favorite rankings

If multiple restaurants remain tied, the poll's selected final tie behavior applies:

- **Choose for me:** Randomly select one of the remaining tied restaurants and record that a random tie-break occurred.
- **Let me choose:** Ask the organizer to choose among only the remaining tied restaurants. Participants continue to see the waiting screen until that choice is made.

For a poll containing only two restaurants, participants cannot provide three distinct rankings. The intended ballot presentation and point allocation for this case still need to be confirmed. Regardless of the chosen scoring presentation, the restaurant with the higher total wins; an exact tie proceeds directly to the poll's selected final tie behavior.

#### Final result

- Once a winner is available, anyone who visits or refreshes the participant link sees the result instead of the ballot or waiting screen.
- The result displays the winning restaurant's name, address, and Google Maps link.
- A visitor who first opens the link after voting has closed sees the result and cannot submit a ballot.
- If **Let me choose** is active and a tie requires organizer input, participants remain on the waiting screen until the organizer selects a winner.
- If no ballots were accepted, no restaurant is selected randomly. The poll instead ends with a no-votes result.

#### Remaining product questions

- For a two-restaurant poll, must voters rank both restaurants, and should those choices award 3 and 2 points or use a simpler favorite-only ballot?
- Is 20 the default ballot limit, the hard maximum, or both?
- Should the final screen reveal only the winner, or also the final scores and tie-break explanation?
- Should voters' optional names ever be visible to the organizer after closure, or remain private permanently?
- How long should completed and abandoned polls, names, and ballots be retained?
- Should access to organizer controls rely on an account or a private management link in the first version?

### Production security and abuse hardening

- **Status:** Tabled
- **Added:** August 31, 2026
- **Idea:** Harden TableLark's public restaurant-search API, Google Maps integration, browser policies, and location handling before a production launch.
- **Potential benefit:** Reduce denial-of-service and unexpected Google API billing risk, protect precise user locations, constrain unsafe browser behavior, and improve resilience if an upstream response or frontend dependency is compromised.
- **Potential concerns:** Hidden-gem searches can currently fan out into as many as 16 billable Google Places requests. The current rate limiter is process-local, resets on restart, does not coordinate across server instances, and relies on forwarded-IP headers whose trustworthiness depends on the deployment platform. A strict Content Security Policy must also be tested carefully with Google Maps, and the strongest shared rate-limit implementation cannot be selected until the hosting platform is known.
- **Possible approach:**
  1. Replace the production in-memory limiter with a shared atomic limiter using a deployment-trusted client IP. Apply per-client, global, concurrency, and cost-weighted limits so hidden-gem searches consume more of the request budget than popular searches. Retain a bounded in-memory implementation for local development.
  2. Restrict the browser Google key by authorized website and browser APIs. Restrict the server key to Places API (New) and, when fixed egress is available, authorized server IPs. Use conservative Google quotas, usage monitoring, and billing alerts; consider separate Google projects for browser and server traffic.
  3. Require `application/json` on the search route, reject inappropriate cross-site browser requests using `Origin` and Fetch Metadata headers, and stream request bodies through a 10 KB limit instead of buffering the complete body before checking its size. Treat browser-origin checks as defense in depth rather than authentication.
  4. Reduce or configure the hidden-gem subdivision request ceiling, add an overall search deadline, and record internal request-cost metrics without exposing sensitive operational details to clients.
  5. Remove precise coordinates from the normal Finder URL. Transfer a newly selected location through one-time tab-scoped state, delete it after use, keep it in memory afterward, mark location-specific Finder pages `noindex`, and redact coordinates and request bodies from logs and analytics. Decide separately whether rounded, explicitly shareable location links should exist.
  6. Add browser security headers: `Referrer-Policy`, `X-Content-Type-Options`, a restrictive `Permissions-Policy`, anti-framing protection, and `poweredByHeader: false`. Introduce a Google Maps-compatible Content Security Policy in report-only mode before enforcing it, and enable HSTS at the production edge only after HTTPS is permanent.
  7. Normalize all Google-supplied links and resource URLs. Require HTTPS, allow only expected Google hosts for Maps and icon URLs, and reject malformed or unsafe attribution URLs.
  8. Update the vulnerable transitive `nanoid` dependency to a fixed compatible version without forcing unrelated major upgrades.
  9. Add tests for invalid content types, cross-site requests, oversized streamed bodies, spoofed IP headers, rate-limit exhaustion, overall timeouts, unsafe external URLs, one-time location transfer, and response security headers. Finish with dependency audit, unit tests, lint, production build, and an abuse/load simulation.
- **Decision:** Revisit before exposing the application publicly. Choose the hosting platform first so the trusted-IP source and shared rate-limit backend can be defined; then implement application hardening and deployment controls together.

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
