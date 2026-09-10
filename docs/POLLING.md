# Lark Together Polling System

This document describes the implemented shareable ranked restaurant polling system. **Lark Together** is the feature's user-facing name. Internal code, API routes, database tables, and technical descriptions retain the established `poll` terminology so the branding change does not require a risky data or route migration. This guide covers the Finder and shared interfaces, PostgreSQL structure, lifecycle and scoring rules, HTTP API, security boundaries, source files, local development workflow, tests, and integration points with restaurant discovery.

The current UI connects the Finder shortlist to the complete local polling lifecycle. Restaurant cards add normalized restaurant snapshots to a dedicated poll-builder context; the **Lark Together** menu removes options, configures the deadline, vote limit, and tie behavior, and creates a persisted poll. After creation, the same Lark Together window becomes the organizer's voting and management interface. The generated `/polls/[slug]` page uses the same experience for participants and remains available as the shareable standalone view.

## Feature scope

The backend currently supports:

- Creating an anonymous poll from 2–20 restaurant snapshots.
- Starting a 1-minute to 30-day server-calculated deadline when the poll is created.
- Accepting 2–20 total ballots, including the organizer's ballot.
- Reserving one ballot position for the organizer until they vote or manually close the poll.
- Identifying organizers and voters through separate random HTTP-only cookies.
- Creating or replacing one ballot per browser credential.
- Favorite-only voting for a two-restaurant poll.
- Required first, second, and third rankings for polls with at least three restaurants.
- Closing on the deadline, maximum ballot count, or an organizer command.
- Calculating a 3–2–1 winner with ordered tie-breaks.
- Resolving a final tie randomly or by organizer selection.
- Returning participant-safe and organizer-only response shapes.

The Finder UI currently supports:

- Adding a restaurant result to a separate poll shortlist context.
- Retaining the complete normalized restaurant object while displaying only its name in the initial menu.
- Preventing duplicate additions and respecting the backend's 20-option limit.
- Inspecting the current shortlist from the **Poll** menu beside **Location**.
- Selecting a 10-minute, 30-minute, 1-hour, 2-hour, or 12-hour duration, the number of voters, and the final tie behavior.
- Creating the poll through `POST /api/polls` without leaving Finder, then voting, editing, viewing the accepted-vote count, closing the poll, and resolving a tie from the Poll window.
- Remembering the latest created poll's public slug in local browser storage so the organizer interface can be restored after returning to or refreshing Finder.

The shared poll UI currently supports:

- Optional voter names and one ranked ballot per browser cookie.
- Guided restaurant-card voting that automatically advances after each selection: one favorite step for two options and favorite, second-favorite, and third-favorite steps for larger polls. During editing, moving a restaurant to an occupied rank leaves its former rank empty instead of swapping the two choices, then returns the voter to the empty rank.
- Reviewing and editing the requesting browser's saved vote while voting is open.
- A live countdown and periodic status refresh.
- Organizer-only sharing, accepted-ballot count, manual closure, and tie selection.
- Participant waiting, no-votes, and final-winner states without exposing interim results.

Registered users, authentication, persistent favorites, and saved filters are outside this phase. The polling schema permits those capabilities to be linked later without changing anonymous poll ownership immediately.

## System position

```mermaid
flowchart LR
    Finder["Existing /finder restaurant results"]
    PollBuilder["Poll builder UI"]
    Participant["/polls/[slug] UI"]
    PollAPI["Next.js /api/polls routes"]
    PollService["Poll service and scoring"]
    Drizzle["Drizzle ORM"]
    Postgres[("PostgreSQL")]

    Finder --> PollBuilder
    PollBuilder --> PollAPI
    Participant --> PollAPI
    PollAPI --> PollService
    PollService --> Drizzle
    Drizzle --> Postgres
```

The browser never connects directly to PostgreSQL. Next.js route handlers validate HTTP requests and pass them to a client-neutral poll service. The service owns authorization, lifecycle transitions, transactions, and response visibility. Drizzle translates repository operations to parameterized PostgreSQL queries.

## Database structure

The polling database is a relational model rooted at one `polls` row. Each poll owns immutable `poll_options` restaurant snapshots and a set of `ballots`; each ballot owns its ordered `ballot_ranks`. If scoring produces a final tie that needs either a random audit trail or organizer input, `poll_tie_candidates` records the restaurants that survived every deterministic tie-break. Foreign keys and composite constraints keep every option, ballot, and rank attached to the same poll, while unique constraints prevent duplicate restaurant options, duplicate browser ballots, multiple organizer ballots, repeated ranks, and ranking the same restaurant twice. The database stores only hashes of organizer and voter credentials, so a database record does not contain a usable link-management or ballot-editing token.

```mermaid
erDiagram
    polls ||--|{ poll_options : contains
    polls ||--o{ ballots : accepts
    ballots ||--|{ ballot_ranks : contains
    poll_options ||--o{ ballot_ranks : is_ranked_as
    polls ||--o{ poll_tie_candidates : records
    poll_options ||--o{ poll_tie_candidates : may_be
    poll_options o|--o| polls : wins
```

### `polls`

One row stores the shared lifecycle and configuration:

| Column | Purpose |
| --- | --- |
| `id` | Internal UUID that is never used as the public URL identifier. |
| `public_slug` | Random, unique 22-character URL-safe poll identifier. |
| `owner_token_hash` | SHA-256 hash used to verify the organizer cookie. |
| `status` | `open`, `awaiting_organizer`, `final`, or `no_votes`. |
| `deadline_at` | Absolute UTC closing timestamp calculated during creation. |
| `maximum_ballots` | Total accepted-ballot limit, constrained to 2–20. |
| `tie_mode` | `random` or `organizer`. |
| `winner_option_id` | Final winning option; present only in `final`. |
| `close_reason` | `deadline`, `maximum`, or `manual`. |
| `created_at`, `closed_at` | Lifecycle timestamps. |

Database checks prevent an open poll from having closure metadata and prevent a final poll from existing without a winner.

### `poll_options`

Each row is a snapshot of a restaurant selected from Finder results:

- Google place ID
- Display order
- Name
- Address
- Primary cuisine type
- Google Maps URL

Snapshots make a poll stable even if Google later changes a listing and avoid a Google Places request every time someone opens a poll. A unique `(poll_id, google_place_id)` constraint prevents duplicate restaurants.

### `ballots`

Each row represents one browser credential's current ballot:

- Poll ID
- SHA-256 voter-token hash
- Optional voter name
- Organizer-ballot marker
- Creation and last-update timestamps

The `(poll_id, voter_token_hash)` constraint enforces one ballot per browser credential. A partial unique index permits at most one organizer ballot. Editing updates the existing row rather than increasing the ballot count.

### `ballot_ranks`

Each row connects a ballot to one option and rank. Composite foreign keys ensure the ballot and option belong to the same poll. The primary and unique keys ensure:

- One restaurant per rank.
- One appearance of a restaurant per ballot.
- Ranks limited to 1, 2, or 3.

Two-option polls store only rank 1. Larger polls store all three ranks.

### `poll_tie_candidates`

This table records every option remaining after total points, favorite count, second-favorite count, and third-favorite count have all tied. It supports organizer selection and records the eligible set used by a random tie-break. A selected winner is persisted on `polls`; refreshing never reruns randomness.

## Poll lifecycle

```mermaid
stateDiagram-v2
    [*] --> open: Create poll
    open --> final: Unique winner
    open --> final: Random final tie-break
    open --> awaiting_organizer: Organizer final tie-break
    open --> no_votes: Close with zero ballots
    awaiting_organizer --> final: Organizer selects candidate
    final --> [*]
    no_votes --> [*]
```

An open poll closes when:

1. A request observes that `deadline_at` has passed.
2. A successful new ballot reaches `maximum_ballots`.
3. The organizer calls the close endpoint.

There is no background scheduler in this phase. Participant reads, organizer reads, ballot writes, and manual closure lock the poll row and update an expired poll before returning. A future waiting screen should maintain its own countdown and refresh the participant endpoint when the deadline is reached.

Poll-row locking serializes closure and ballot writes. If an edit has committed before closure obtains the lock, the edited ranks are counted. If closure commits first, the edit receives `POLL_CLOSED`. Concurrent attempts to fill the last position cannot exceed the configured maximum.

## Scoring

For polls with at least three options:

- Favorite: 3 points
- Second favorite: 2 points
- Third favorite: 1 point

Tied restaurants are narrowed in order by:

1. Total points
2. Favorite rankings
3. Second-favorite rankings
4. Third-favorite rankings

A two-option poll asks for only one favorite. The restaurant with more favorite selections wins. A remaining tie uses the configured random or organizer decision.

Scores are calculated only when the poll closes. Interim scores are not stored or returned. Random selection uses Node's cryptographic random-number generator and the chosen winner is persisted in the closing transaction.

## Organizer and voter identity

Poll creation produces three identifiers:

- An internal UUID stored in PostgreSQL.
- A public slug returned in the share path.
- A private organizer token returned only through an HTTP-only cookie.

The organizer and each voting browser receive independent random 256-bit private tokens. PostgreSQL stores SHA-256 hashes, and the server compares the organizer token using a timing-safe comparison. Cookies use `HttpOnly` and `SameSite=Lax`; production responses also use `Secure`. Finder stores only the public poll slug as a convenience bookmark; organizer authorization remains exclusively in the HTTP-only cookie.

This is intentionally trust-based identity. Clearing cookies or using another browser can create another participant identity. No fingerprinting, account, email verification, or IP-based identity is used.

The maximum includes the organizer. Until the organizer submits, ordinary participants can occupy at most `maximum_ballots - 1` positions. The organizer can manually close without voting, which releases no additional ballot because closure is permanent.

## Visibility boundary

The participant response contains:

- Poll status and deadline
- Ordered restaurant options
- Only the requesting browser's ballot
- The winner after finalization

It never contains:

- Accepted-ballot count or maximum
- Other voter names or ballots
- Organizer credentials
- Interim scores or standings
- Unresolved tie candidates

The organizer response adds the accepted count, maximum, whether the organizer voted, closure reason, and eligible tie candidates when a choice is required. It still does not expose individual ballots or interim standings.

## HTTP API

All polling routes use the Node.js runtime and return JSON.

| Route | Purpose |
| --- | --- |
| `POST /api/polls` | Create a poll and set the organizer cookie. |
| `GET /api/polls/[slug]` | Read participant-safe state and the current browser's ballot. |
| `PUT /api/polls/[slug]/ballot` | Create or replace the current browser's ballot. |
| `GET /api/polls/[slug]/manage` | Read organizer-only counts and controls state. |
| `POST /api/polls/[slug]/close` | Permanently close voting. |
| `POST /api/polls/[slug]/tie-decision` | Select one eligible tied option. |

### Create request

```json
{
  "restaurants": [
    {
      "id": "google-place-id",
      "name": "Example Restaurant",
      "address": "123 Example Street",
      "primaryTypeDisplayName": "Italian restaurant",
      "googleMapsURI": "https://maps.google.com/..."
    },
    {
      "id": "another-google-place-id",
      "name": "Another Restaurant",
      "address": "456 Example Street",
      "primaryTypeDisplayName": "Thai restaurant",
      "googleMapsURI": "https://maps.google.com/..."
    }
  ],
  "durationMinutes": 120,
  "maximumBallots": 10,
  "tieMode": "organizer"
}
```

The server calculates the absolute deadline at creation time and returns a relative `sharePath`. The browser should construct the absolute URL from its trusted current origin rather than sending a host name to the API.

### Ballot request

Two-option poll:

```json
{
  "name": "Optional name",
  "rankings": [
    { "optionId": "option-uuid", "rank": 1 }
  ]
}
```

Larger poll:

```json
{
  "name": "Optional name",
  "rankings": [
    { "optionId": "favorite-option-uuid", "rank": 1 },
    { "optionId": "second-option-uuid", "rank": 2 },
    { "optionId": "third-option-uuid", "rank": 3 }
  ]
}
```

An API error has a stable machine-readable code:

```json
{
  "error": "Voting has ended for this poll.",
  "code": "POLL_CLOSED"
}
```

## File guide

### Database and migrations

| File | Responsibility |
| --- | --- |
| `compose.yaml` | Local PostgreSQL 17 service, port, health check, and persistent volume. |
| `database/init/001-create-test-database.sql` | Creates the isolated local test database on first container initialization. |
| `database/migrations/0001_create_polling_schema.sql` | Reviewed initial PostgreSQL schema and constraints. |
| `scripts/migrate.js` | Applies ordered migrations under an advisory lock and records checksums. |
| `scripts/setup-local-database.js` | Migrates both local development and test databases. |
| `scripts/run-database-tests.js` | Supplies the isolated test URL and runs database integration tests. |
| `src/lib/database/schema.js` | Drizzle representation used by application queries. |
| `src/lib/database/client.js` | Server-only pooled PostgreSQL connection and Drizzle client. |

The migration runner refuses to continue if an already-applied migration file's checksum changes. Schema changes must be introduced in a new migration rather than rewriting history.

Drizzle Kit is intentionally not installed. Its current stable dependency tree included a known vulnerable development-server package during this implementation. TableLark uses patched Drizzle ORM with reviewed SQL migrations and the small checksum-tracking runner instead.

### Poll domain

| File | Responsibility |
| --- | --- |
| `src/lib/polls/constants.js` | Supported statuses, limits, tie modes, and close reasons. |
| `src/lib/polls/errors.js` | Public-safe domain errors and HTTP status metadata. |
| `src/lib/polls/tokens.js` | Random slug/token generation, hashing, and timing-safe verification. |
| `src/lib/polls/validation.js` | Creation, ballot, restaurant-snapshot, and tie-decision validation. |
| `src/lib/polls/shortlist.js` | Pure add/remove helpers with duplicate and capacity protection. |
| `src/lib/polls/scoring.js` | Pure deterministic scoring and tie narrowing. |
| `src/lib/polls/repository.js` | Drizzle reads and writes without HTTP concerns. |
| `src/lib/polls/service.js` | Transactions, ownership, capacity, closure, scoring, and response visibility. |
| `src/lib/polls/http.js` | Body limits, cookie parsing, private cookies, and safe error responses. |
| `src/lib/polls/rate-limit.js` | Basic process-local write throttling. |
| `src/lib/polls/active-poll.js` | Validates and persists the latest public poll slug for Finder restoration without storing credentials. |

### API routes

The files beneath `src/app/api/polls/` are thin adapters. They read cookies and JSON, call the poll service with the server-only database connection, and serialize safe responses. They do not implement scoring or SQL.

### Poll UI

| File | Responsibility |
| --- | --- |
| `src/context/PollBuilderContext.js` | Exposes the shortlist context and consumer hook. |
| `src/context/PollBuilderProvider.jsx` | Holds complete selected restaurant objects independently of search results. |
| `src/components/polls/PollMenu.jsx` | Renders the Lark Together menu, switches between creation and the remembered active poll, and embeds the shared experience directly in Finder. |
| `src/components/polls/PollExperience.jsx` | Loads and renders the reusable standalone or embedded ballot, waiting, management, tie, and result experience. |
| `src/components/polls/PollOrganizerControls.jsx` | Shared accepted-vote count, close control, and final-tie selection components. |
| `src/components/restaurants/RestaurantResults.jsx` | Adds each result card's **Add to Lark Together** action and added/full state. |
| `src/components/TopActionBar.jsx` | Places the Lark Together menu beside the existing Location menu. |
| `src/styles/ui/poll-menu.css` | Styles the basic responsive Lark Together dropdown. |
| `src/app/polls/[slug]/page.jsx` | Defines the public poll route and passes its slug to the client experience. |
| `src/lib/polls/client.js` | Provides the browser-side JSON client for every polling endpoint. |
| `src/styles/pages/poll.css` | Styles the basic responsive poll lifecycle screens. |

### Tests

| File | Responsibility |
| --- | --- |
| `test/polls/scoring.test.js` | Point totals and deterministic tie-break behavior. |
| `test/polls/validation.test.js` | Poll and ballot input contracts. |
| `test/polls/shortlist.test.js` | Complete-object retention, deduplication, capacity, and removal behavior. |
| `test/polls/ranking.test.js` | Guided ranking assignment, duplicate protection, and moving a previously ranked choice while leaving its old rank empty. |
| `test/polls/client.test.js` | Browser request serialization and safe API error propagation. |
| `test/polls/active-poll.test.js` | Active-poll bookmark validation, storage failure handling, and share-link construction. |
| `test/polls/database.test.js` | Real PostgreSQL lifecycle, editing, privacy, ownership, capacity, deadline, tie, and concurrency behavior. |

## Interaction with restaurant search

The existing `/api/restaurants/search` route returns normalized restaurant objects containing the Google place ID, name, address, primary cuisine type, and Maps URI. The Finder cards place the complete object in `PollBuilderContext`; the Poll menu renders the name and a remove control, gathers the remaining poll settings, and submits the fields required by `POST /api/polls`.

The polling service validates and stores the submitted snapshots. It does not call Google Places again and does not change `RestaurantSearchContext`. This keeps restaurant discovery and poll persistence as separate domains:

```text
Google Places → restaurant search API → Finder state
                                      → PollBuilderContext shortlist
                                      → polling API → PostgreSQL
```

The server validates structure and URL safety, but it does not re-fetch every place ID. An organizer who manually fabricates an API request can create misleading options only inside their own poll; avoiding extra Google requests is the intentional first-version tradeoff.

## Local development

Docker Desktop must be running.

```sh
npm run db:up
npm run db:setup
```

Add the local development URL to `.env.local`:

```dotenv
DATABASE_URL=postgresql://tablelark:tablelark@localhost:55432/tablelark
```

Then start Next.js normally:

```sh
npm run dev
```

Useful commands:

```sh
npm run db:migrate
npm run test:db
npm run db:down
```

`db:down` stops the container but retains its named volume. It does not erase poll data. Removing the volume is a separate destructive operation and is not part of the normal scripts.

## Testing and verification

Run the normal unit suite, database integration suite, linter, and build:

```sh
npm test
npm run test:db
npm run lint
npm run build
```

The regular unit command skips database integration cases unless `TEST_DATABASE_URL` is supplied. `npm run test:db` supplies the isolated local test database URL and requires the PostgreSQL container and migrations.

Local setup validates both connection URLs before applying either migration: development must target `tablelark`, and tests must target `tablelark_test`, on `localhost` or `127.0.0.1` at port `55432`. Only PostgreSQL URLs without query parameters or fragments are accepted; query parameters can override connection targets.

The database suite enforces the test URL restriction before creating its connection pool, including when the test file is run directly. Before every truncation, it checks `current_database()` on the same connection used for cleanup and refuses any database other than `tablelark_test`. These checks prevent accidental target selection; production credentials should still be kept out of local and test environments.

`npm run db:migrate` remains the separate deployment migration command and can target a hosted database through `DATABASE_URL`. It is not subject to the local-only checks. Keep production credentials confined to the production deployment environment and use separate databases for previews.

## Deployment path

No Neon or Vercel database resource is created in this phase. When deployment is approved:

1. Provision separate Neon development and production PostgreSQL environments.
2. Connect the production resource only to Vercel Production.
3. Configure pooled, encrypted credentials.
4. Apply the checked-in migrations deliberately.
5. Deploy the compatible backend.
6. Run API smoke tests against a disposable poll.
7. Replace the process-local poll rate limiter with a shared production limiter when multi-instance enforcement becomes necessary.

The schema, SQL migrations, Drizzle queries, and service logic are ordinary PostgreSQL and are portable to another provider such as Amazon Aurora PostgreSQL.

## Deferred work

- Poll shortlist ordering and draft persistence
- Richer poll configuration and lifecycle-screen design
- Web Share integration and a manual copy-field fallback
- Mobile universal/app links
- Registered-user ownership and poll history
- Data-retention cleanup policy
- Shared production rate limiting
- Cross-device organizer recovery
