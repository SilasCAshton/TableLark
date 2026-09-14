import assert from "node:assert/strict";
import test from "node:test";

import {
  validateBallot,
  validateCreatePoll,
} from "../../src/lib/polls/validation.js";

const restaurants = [
  {
    id: "place-a",
    name: "A",
    address: "1 Main Street",
    primaryTypeDisplayName: "Italian restaurant",
    rating: 4.6,
    priceLevel: "MODERATE",
    googleMapsURI: "https://maps.google.com/?cid=1",
  },
  {
    id: "place-b",
    name: "B",
    address: "2 Main Street",
    googleMapsURI: "https://maps.google.com/?cid=2",
  },
];

test("validates a two-restaurant poll configuration", () => {
  const poll = validateCreatePoll({
    restaurants,
    durationMinutes: 60,
    maximumBallots: 20,
    tieMode: "organizer",
  });

  assert.equal(poll.restaurants.length, 2);
  assert.equal(poll.durationMinutes, 60);
  assert.equal(poll.maximumBallots, 20);
  assert.equal(
    poll.restaurants[0].primaryTypeDisplayName,
    "Italian restaurant",
  );
  assert.equal(poll.restaurants[0].rating, 4.6);
  assert.equal(poll.restaurants[0].priceLevel, "MODERATE");
});

test("rejects duplicate restaurant place IDs", () => {
  assert.throws(
    () =>
      validateCreatePoll({
        restaurants: [restaurants[0], restaurants[0]],
        durationMinutes: 60,
        maximumBallots: 20,
        tieMode: "random",
      }),
    /only once/,
  );
});

test("requires only a favorite for a two-option poll", () => {
  const ballot = validateBallot(
    {
      name: "  Sam  ",
      rankings: [{ optionId: "a", rank: 1 }],
    },
    new Set(["a", "b"]),
  );

  assert.equal(ballot.optionalName, "Sam");
  assert.equal(ballot.rankings.length, 1);
});

test("requires three distinct rankings for larger polls", () => {
  assert.throws(
    () =>
      validateBallot(
        {
          rankings: [
            { optionId: "a", rank: 1 },
            { optionId: "a", rank: 2 },
            { optionId: "c", rank: 3 },
          ],
        },
        new Set(["a", "b", "c"]),
      ),
    /cannot occupy more than one rank/,
  );
});
