import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  assertLocalDatabaseTarget,
  assertConnectedTestDatabase,
} from "../../scripts/local-database-target.js";

import {
  createPoll,
  getOrganizerPoll,
  getParticipantPoll,
  manuallyClosePoll,
  resolvePollTie,
  submitBallot,
} from "../../src/lib/polls/service.js";

const { Pool } = pg;
const databaseUrl = process.env.TEST_DATABASE_URL;
if (databaseUrl !== undefined) assertLocalDatabaseTarget(databaseUrl, "test");
const databaseTest = databaseUrl ? test : test.skip;
const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl, max: 8 })
  : null;
const db = pool ? drizzle(pool) : null;
const now = new Date("2026-09-01T12:00:00.000Z");

const restaurants = [
  {
    id: "place-a",
    name: "Alpha Cafe",
    address: "1 Main Street",
    primaryTypeDisplayName: "Cafe",
    rating: 4.7,
    priceLevel: "MODERATE",
    googleMapsURI: "https://maps.google.com/?cid=1",
  },
  {
    id: "place-b",
    name: "Bravo Bistro",
    address: "2 Main Street",
    googleMapsURI: "https://maps.google.com/?cid=2",
  },
  {
    id: "place-c",
    name: "Charlie Kitchen",
    address: "3 Main Street",
    googleMapsURI: "https://maps.google.com/?cid=3",
  },
];

async function clearDatabase() {
  const client = await pool.connect();
  try {
    await assertConnectedTestDatabase(client);
    await client.query("TRUNCATE TABLE polls CASCADE");
  } finally {
    client.release();
  }
}

async function makePoll(overrides = {}) {
  return createPoll(
    {
      restaurants,
      durationMinutes: 60,
      maximumBallots: 2,
      tieMode: "organizer",
      ...overrides,
    },
    { db, now },
  );
}

function rankings(optionIds) {
  return optionIds.map((optionId, index) => ({
    optionId,
    rank: index + 1,
  }));
}

if (databaseUrl) {
  before(clearDatabase);
  after(async () => {
    try {
      await clearDatabase();
    } finally {
      await pool.end();
    }
  });
}

databaseTest("creates a private poll view without exposing organizer data", async () => {
  const created = await makePoll();
  const participant = await getParticipantPoll(
    created.poll.slug,
    null,
    { db, now },
  );

  assert.equal(participant.options.length, 3);
  assert.equal(participant.options[0].primaryTypeDisplayName, "Cafe");
  assert.equal(participant.options[0].rating, 4.7);
  assert.equal(participant.options[0].priceLevel, "MODERATE");
  assert.equal(participant.ballot, null);
  assert.equal(participant.acceptedBallots, undefined);
  assert.equal(participant.maximumBallots, undefined);
  assert.equal(participant.voterNames, undefined);
  assert.equal(participant.unnamedVotes, undefined);
  assert.equal(participant.winner, null);
});

databaseTest("edits replace a ballot without increasing the count", async () => {
  const created = await makePoll({ maximumBallots: 3 });
  const optionIds = created.poll.options.map((option) => option.id);
  const first = await submitBallot(
    created.poll.slug,
    { name: "Taylor", rankings: rankings(optionIds) },
    { db, now, voterToken: null },
  );

  await submitBallot(
    created.poll.slug,
    {
      name: "Taylor edited",
      rankings: rankings([...optionIds].reverse()),
    },
    { db, now, voterToken: first.voterToken },
  );

  const organizer = await getOrganizerPoll(
    created.poll.slug,
    created.ownerToken,
    { db, now },
  );
  const participant = await getParticipantPoll(
    created.poll.slug,
    first.voterToken,
    { db, now },
  );

  assert.equal(organizer.acceptedBallots, 1);
  assert.deepEqual(organizer.voterNames, ["Taylor edited"]);
  assert.equal(organizer.unnamedVotes, 0);
  assert.equal(participant.ballot.name, "Taylor edited");
  assert.equal(
    participant.ballot.rankings[0].optionId,
    optionIds[2],
  );
});

databaseTest("reserves one position for the organizer", async () => {
  const created = await makePoll();
  const optionIds = created.poll.options.map((option) => option.id);

  await submitBallot(
    created.poll.slug,
    { rankings: rankings(optionIds) },
    { db, now },
  );

  await assert.rejects(
    submitBallot(
      created.poll.slug,
      { rankings: rankings(optionIds) },
      { db, now, voterToken: "another-browser" },
    ),
    (error) => error.code === "ORGANIZER_BALLOT_RESERVED",
  );
});

databaseTest("organizers see each named voter and count unnamed votes", async () => {
  const created = await makePoll({ maximumBallots: 5 });
  const optionIds = created.poll.options.map((option) => option.id);
  for (const name of ["Alex", "Alex", "   ", undefined]) {
    await submitBallot(created.poll.slug, { name, rankings: rankings(optionIds) }, { db, now });
  }
  const organizer = await getOrganizerPoll(created.poll.slug, created.ownerToken, { db, now });
  assert.equal(organizer.acceptedBallots, 4);
  assert.deepEqual(organizer.voterNames, ["Alex", "Alex"]);
  assert.equal(organizer.unnamedVotes, 2);
  const participant = await getParticipantPoll(created.poll.slug, null, { db, now });
  assert.equal(participant.voterNames, undefined);
  assert.equal(participant.unnamedVotes, undefined);
});

databaseTest("persists an organizer-selected result after a complete tie", async () => {
  const created = await makePoll();
  const [a, b, c] = created.poll.options.map(
    (option) => option.id,
  );

  await submitBallot(
    created.poll.slug,
    { rankings: rankings([a, b, c]) },
    { db, now, ownerToken: created.ownerToken },
  );
  const participantVote = await submitBallot(
    created.poll.slug,
    { rankings: rankings([b, a, c]) },
    { db, now },
  );

  assert.equal(
    participantVote.poll.status,
    "awaiting_organizer",
  );
  assert.equal(participantVote.poll.winner, null);

  const organizer = await getOrganizerPoll(
    created.poll.slug,
    created.ownerToken,
    { db, now },
  );
  assert.deepEqual(
    new Set(organizer.tieCandidates.map((option) => option.id)),
    new Set([a, b]),
  );

  const resolved = await resolvePollTie(
    created.poll.slug,
    { optionId: b },
    created.ownerToken,
    { db, now },
  );
  const publicResult = await getParticipantPoll(
    created.poll.slug,
    null,
    { db, now },
  );

  assert.equal(resolved.status, "final");
  assert.equal(publicResult.winner.id, b);
  assert.equal(publicResult.results.length, 3);
  assert.equal(publicResult.results[0].voteCount, 2);
  assert.equal(
    publicResult.results.find((result) => result.id === a).rating,
    4.7,
  );
});

databaseTest("closes an expired poll without inventing a winner", async () => {
  const created = await makePoll({ durationMinutes: 1 });
  const later = new Date(now.getTime() + 60_001);
  const result = await getParticipantPoll(
    created.poll.slug,
    null,
    { db, now: later },
  );

  assert.equal(result.status, "no_votes");
  assert.equal(result.winner, null);
});

databaseTest("serializes simultaneous final-position submissions", async () => {
  const created = await makePoll({ tieMode: "random" });
  const optionIds = created.poll.options.map((option) => option.id);

  await submitBallot(
    created.poll.slug,
    { rankings: rankings(optionIds) },
    { db, now, ownerToken: created.ownerToken },
  );

  const submissions = await Promise.allSettled([
    submitBallot(
      created.poll.slug,
      { rankings: rankings(optionIds) },
      { db, now, voterToken: "browser-one" },
    ),
    submitBallot(
      created.poll.slug,
      { rankings: rankings(optionIds) },
      { db, now, voterToken: "browser-two" },
    ),
  ]);

  assert.equal(
    submissions.filter((result) => result.status === "fulfilled")
      .length,
    1,
  );
  assert.equal(
    submissions.filter((result) => result.status === "rejected")
      .length,
    1,
  );

  const organizer = await getOrganizerPoll(
    created.poll.slug,
    created.ownerToken,
    { db, now },
  );
  assert.equal(organizer.acceptedBallots, 2);
  assert.equal(organizer.status, "final");
});

databaseTest("only the organizer can close voting", async () => {
  const created = await makePoll();

  await assert.rejects(
    manuallyClosePoll(created.poll.slug, "wrong-token", {
      db,
      now,
    }),
    (error) => error.code === "ORGANIZER_ACCESS_REQUIRED",
  );

  const closed = await manuallyClosePoll(
    created.poll.slug,
    created.ownerToken,
    { db, now },
  );
  assert.equal(closed.status, "no_votes");
});
