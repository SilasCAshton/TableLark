import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIVE_POLL_STORAGE_KEY,
  pollSharePath,
  readActivePoll,
  rememberActivePoll,
} from "../../src/lib/polls/active-poll.js";

const slug = "example-poll-slug-1234";

test("remembers only the public slug and restores the latest poll", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(readActivePoll(storage), null);
  assert.equal(rememberActivePoll(storage, slug), true);
  assert.equal(readActivePoll(storage), slug);
  assert.deepEqual([...values], [[ACTIVE_POLL_STORAGE_KEY, slug]]);
  const replacement = "another-poll-slug-1234";
  rememberActivePoll(storage, replacement);
  assert.equal(readActivePoll(storage), replacement);
});

test("ignores malformed stored slugs and refuses to store invalid ones", () => {
  const storage = {
    getItem: () => "https://untrusted.example/poll",
    setItem: () => assert.fail("Invalid slugs should never be written"),
  };
  assert.equal(readActivePoll(storage), null);
  assert.equal(rememberActivePoll(storage, "../finder"), false);
});

test("blocked browser storage does not prevent polling", () => {
  const storage = {
    getItem: () => { throw new Error("Storage blocked"); },
    setItem: () => { throw new Error("Storage blocked"); },
  };
  assert.equal(readActivePoll(storage), null);
  assert.equal(rememberActivePoll(storage, slug), false);
});

test("share links target the poll page, including when copied from Finder", () => {
  assert.equal(pollSharePath(slug), `/polls/${slug}`);
  assert.equal(
    new URL(pollSharePath(slug), "https://tablelark.example").href,
    `https://tablelark.example/polls/${slug}`,
  );
  assert.equal(pollSharePath("../finder?x=1"), "/polls/..%2Ffinder%3Fx%3D1");
});
