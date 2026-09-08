import test from "node:test";
import assert from "node:assert/strict";
import { moveRestaurantInOrder } from "../../src/lib/polls/ranking.js";

test("moving an unranked restaurant into the top three displaces third place", () => {
  const original = ["tacos", "thai", "pizza", "sushi"];
  const result = moveRestaurantInOrder(original, "sushi", -1);
  assert.deepEqual(result.slice(0, 3), ["tacos", "thai", "sushi"]);
  assert.deepEqual(result, ["tacos", "thai", "sushi", "pizza"]);
  assert.deepEqual(original, ["tacos", "thai", "pizza", "sushi"]);
});

test("moving first place down shifts the other ranks without gaps or duplicates", () => {
  assert.deepEqual(
    moveRestaurantInOrder(["tacos", "thai", "pizza"], "tacos", 1),
    ["thai", "tacos", "pizza"],
  );
});

test("boundary and unknown restaurant moves leave the order unchanged", () => {
  const order = ["tacos", "thai"];
  assert.equal(moveRestaurantInOrder(order, "tacos", -1), order);
  assert.equal(moveRestaurantInOrder(order, "thai", 1), order);
  assert.equal(moveRestaurantInOrder(order, "missing", 1), order);
});

test("a drag can move across multiple positions in either direction", () => {
  const order = ["tacos", "thai", "pizza", "sushi"];
  const promoted = moveRestaurantInOrder(order, "sushi", -3);
  assert.deepEqual(promoted, ["sushi", "tacos", "thai", "pizza"]);
  assert.deepEqual(moveRestaurantInOrder(promoted, "sushi", 3), order);
  assert.deepEqual(moveRestaurantInOrder(order, "thai", 0), order);
});
