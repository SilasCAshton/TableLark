import assert from "node:assert/strict";
import test from "node:test";

import { assignRankingSelection } from "../../src/lib/polls/ranking.js";

test("assigns an unranked restaurant to the active rank", () => {
  assert.deepEqual(
    assignRankingSelection(["restaurant-a", "", ""], 1, "restaurant-b"),
    ["restaurant-a", "restaurant-b", ""],
  );
});

test("does not move an earlier choice into an empty rank", () => {
  const rankings = ["restaurant-a", "", ""];

  assert.equal(
    assignRankingSelection(rankings, 1, "restaurant-a"),
    rankings,
  );
});

test("moves a choice and leaves its previous rank empty when editing", () => {
  assert.deepEqual(
    assignRankingSelection(
      ["restaurant-a", "restaurant-b", "restaurant-c"],
      0,
      "restaurant-b",
    ),
    ["restaurant-b", "", "restaurant-c"],
  );
});
