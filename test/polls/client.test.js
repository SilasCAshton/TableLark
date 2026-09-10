import assert from "node:assert/strict";
import test from "node:test";

import {
  createPollRequest,
  PollRequestError,
} from "../../src/lib/polls/client.js";

test("creates a poll with JSON and returns the share path", async (t) => {
  const originalFetch = globalThis.fetch;
  let request;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (path, options) => {
    request = { path, options };

    return new Response(
      JSON.stringify({
        poll: { slug: "example-poll-slug-1234" },
        sharePath: "/polls/example-poll-slug-1234",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const input = {
    restaurants: [{ id: "place-1" }, { id: "place-2" }],
    durationMinutes: 120,
    maximumBallots: 10,
    tieMode: "random",
  };
  const result = await createPollRequest(input);

  assert.equal(request.path, "/api/polls");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.credentials, "same-origin");
  assert.deepEqual(JSON.parse(request.options.body), input);
  assert.equal(
    result.sharePath,
    "/polls/example-poll-slug-1234",
  );
});

test("surfaces the API's safe polling error", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: "A poll needs two restaurants.",
        code: "POLL_VALIDATION_ERROR",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );

  await assert.rejects(
    () => createPollRequest({}),
    (error) => {
      assert.ok(error instanceof PollRequestError);
      assert.equal(error.status, 400);
      assert.equal(error.code, "POLL_VALIDATION_ERROR");
      assert.equal(error.message, "A poll needs two restaurants.");
      return true;
    },
  );
});
