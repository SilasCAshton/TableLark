import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import {
  assertLocalDatabaseTarget,
  assertConnectedTestDatabase,
} from "../scripts/local-database-target.js";

test("allows the dedicated local development and test targets", () => {
  for (const host of ["localhost", "127.0.0.1"]) {
    for (const protocol of ["postgres", "postgresql"]) {
      assertLocalDatabaseTarget(`${protocol}://user:secret@${host}:55432/tablelark`, "development");
      assertLocalDatabaseTarget(`${protocol}://user:secret@${host}:55432/tablelark_test`, "test");
    }
  }
});

test("rejects unsafe targets without exposing credentials", () => {
  for (const url of [
    undefined, "", "not a URL",
    "postgresql://user:secret@production.example:55432/tablelark_test",
    "postgresql://user:secret@localhost:5432/tablelark_test",
    "postgresql://user:secret@localhost:55432/tablelark",
    "https://user:secret@localhost:55432/tablelark_test",
    "postgresql://user:secret@localhost:55432/tablelark_test?host=production.example",
    "postgresql://user:secret@localhost:55432/tablelark_test?dbname=production",
    "postgresql://user:secret@localhost:55432/tablelark_test#fragment",
  ]) {
    assert.throws(() => assertLocalDatabaseTarget(url, "test"), (error) => {
      assert.ok(!error.message.includes("secret"));
      return true;
    });
  }
  assert.throws(() => assertLocalDatabaseTarget("postgresql://localhost:55432/tablelark_test", "development"));
});

test("checks the connected database identity", async () => {
  await assertConnectedTestDatabase({ query: async () => ({ rows: [{ name: "tablelark_test" }] }) });
  await assert.rejects(assertConnectedTestDatabase({ query: async () => ({ rows: [{ name: "tablelark" }] }) }));
});

test("direct test execution rejects an unsafe target before connecting", () => {
  const environment = { ...process.env, TEST_DATABASE_URL: "postgresql://user:secret@production.invalid:55432/tablelark_test" };
  delete environment.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ["--test", "test/polls/database.test.js"], {
    cwd: new URL("../", import.meta.url),
    env: environment,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /Local test database must be/);
  assert.doesNotMatch(result.stdout + result.stderr, /secret|ENOTFOUND/);
});

test("local setup validates both targets before running migrations", () => {
  const result = spawnSync(process.execPath, ["scripts/setup-local-database.js"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://localhost:55432/tablelark",
      TEST_DATABASE_URL: "postgresql://user:secret@production.invalid:55432/tablelark_test",
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /Local test database must be/);
  assert.doesNotMatch(result.stdout + result.stderr, /secret|ECONNREFUSED|ENOTFOUND/);
});
