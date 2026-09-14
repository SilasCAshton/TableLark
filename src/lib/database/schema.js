import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const pollStatus = pgEnum("poll_status", [
  "open",
  "awaiting_organizer",
  "final",
  "no_votes",
]);
export const pollTieMode = pgEnum("poll_tie_mode", [
  "random",
  "organizer",
]);
export const pollCloseReason = pgEnum("poll_close_reason", [
  "deadline",
  "maximum",
  "manual",
]);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey(),
    publicSlug: varchar("public_slug", { length: 32 })
      .notNull()
      .unique(),
    ownerTokenHash: char("owner_token_hash", {
      length: 64,
    }).notNull(),
    status: pollStatus("status").notNull().default("open"),
    deadlineAt: timestamp("deadline_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    maximumBallots: smallint("maximum_ballots").notNull(),
    tieMode: pollTieMode("tie_mode").notNull(),
    winnerOptionId: uuid("winner_option_id"),
    closeReason: pollCloseReason("close_reason"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    check(
      "polls_maximum_ballots_check",
      sql`${table.maximumBallots} BETWEEN 2 AND 20`,
    ),
    index("polls_open_deadline_idx")
      .on(table.deadlineAt)
      .where(sql`${table.status} = 'open'`),
  ],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    googlePlaceId: varchar("google_place_id", {
      length: 255,
    }).notNull(),
    displayOrder: smallint("display_order").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    primaryTypeDisplayName: varchar("primary_type_display_name", {
      length: 120,
    }),
    rating: real("rating"),
    priceLevel: varchar("price_level", { length: 32 }),
    googleMapsUrl: varchar("google_maps_url", {
      length: 2048,
    }),
  },
  (table) => [
    unique("poll_options_poll_place_unique").on(
      table.pollId,
      table.googlePlaceId,
    ),
    unique("poll_options_poll_order_unique").on(
      table.pollId,
      table.displayOrder,
    ),
    unique("poll_options_id_poll_unique").on(
      table.id,
      table.pollId,
    ),
    check(
      "poll_options_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),
  ],
);

export const ballots = pgTable(
  "ballots",
  {
    id: uuid("id").primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    voterTokenHash: char("voter_token_hash", {
      length: 64,
    }).notNull(),
    optionalName: varchar("optional_name", { length: 80 }),
    isOrganizerBallot: boolean("is_organizer_ballot")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("ballots_poll_voter_unique").on(
      table.pollId,
      table.voterTokenHash,
    ),
    unique("ballots_id_poll_unique").on(
      table.id,
      table.pollId,
    ),
    uniqueIndex("ballots_one_organizer_idx")
      .on(table.pollId)
      .where(sql`${table.isOrganizerBallot}`),
    index("ballots_poll_idx").on(table.pollId),
  ],
);

export const ballotRanks = pgTable(
  "ballot_ranks",
  {
    pollId: uuid("poll_id").notNull(),
    ballotId: uuid("ballot_id").notNull(),
    optionId: uuid("option_id").notNull(),
    rank: smallint("rank").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ballotId, table.rank] }),
    unique("ballot_ranks_ballot_option_unique").on(
      table.ballotId,
      table.optionId,
    ),
    check(
      "ballot_ranks_rank_check",
      sql`${table.rank} BETWEEN 1 AND 3`,
    ),
    index("ballot_ranks_poll_idx").on(table.pollId),
  ],
);

export const pollTieCandidates = pgTable(
  "poll_tie_candidates",
  {
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.pollId, table.optionId] }),
  ],
);
