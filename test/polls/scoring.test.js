import assert from "node:assert/strict";
import test from "node:test";

import { calculatePollOutcome, calculatePollResults } from "../../src/lib/polls/scoring.js";

test("scores rankings with 3, 2, and 1 points", () => {
  const outcome = calculatePollOutcome(
    ["a", "b", "c"],
    [
      { optionId: "a", rank: 1 },
      { optionId: "b", rank: 2 },
      { optionId: "c", rank: 3 },
      { optionId: "b", rank: 1 },
      { optionId: "a", rank: 2 },
      { optionId: "c", rank: 3 },
      { optionId: "a", rank: 1 },
      { optionId: "c", rank: 2 },
      { optionId: "b", rank: 3 },
    ],
  );

  assert.equal(outcome.kind, "winner");
  assert.equal(outcome.winnerOptionId, "a");
  assert.deepEqual(
    Object.fromEntries(outcome.scores.map((score) => [score.optionId, score.voteCount])),
    { a: 3, b: 3, c: 3 },
  );
  assert.deepEqual(
    outcome.scores.find((score) => score.optionId === "a"),
    {
      optionId: "a",
      points: 8,
      voteCount: 3,
      favoriteCount: 2,
      secondFavoriteCount: 1,
      thirdFavoriteCount: 0,
    },
  );
});

test("orders results by weighted points", () => {
  const results = calculatePollResults(
    ["a", "b", "c"],
    [
      { optionId: "a", rank: 1 },
      { optionId: "b", rank: 3 },
      { optionId: "b", rank: 3 },
      { optionId: "c", rank: 3 },
    ],
  );

  assert.deepEqual(
    results.map(({ optionId, points }) => ({ optionId, points })),
    [
      { optionId: "a", points: 3 },
      { optionId: "b", points: 2 },
      { optionId: "c", points: 1 },
    ],
  );
});

test("narrows a points tie by favorite then second and third rankings", () => {
  const favoriteWinner = calculatePollOutcome(
    ["a", "b", "c"],
    [
      { optionId: "a", rank: 1 },
      { optionId: "b", rank: 1 },
      { optionId: "b", rank: 2 },
      { optionId: "c", rank: 2 },
      { optionId: "c", rank: 2 },
    ],
  );

  assert.equal(favoriteWinner.winnerOptionId, "b");

  const completeTie = calculatePollOutcome(
    ["a", "b"],
    [
      { optionId: "a", rank: 1 },
      { optionId: "b", rank: 1 },
    ],
  );

  assert.equal(completeTie.kind, "tie");
  assert.deepEqual(completeTie.candidateIds, ["a", "b"]);
});

test("returns a no-votes outcome without selecting randomly", () => {
  const outcome = calculatePollOutcome(["a", "b"], []);

  assert.equal(outcome.kind, "no_votes");
  assert.deepEqual(outcome.candidateIds, []);
});
