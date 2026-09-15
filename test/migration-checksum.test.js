import assert from "node:assert/strict";
import test from "node:test";

import { migrationChecksum } from "../scripts/migrate.js";

test("migration checksums are portable across line endings", () => {
  const unixSql = "CREATE TABLE example (\n  id UUID PRIMARY KEY\n);\n";
  const windowsSql = unixSql.replace(/\n/g, "\r\n");

  assert.equal(
    migrationChecksum(windowsSql),
    migrationChecksum(unixSql),
  );
});

test("migration checksums still detect SQL changes", () => {
  assert.notEqual(
    migrationChecksum("SELECT 1;\n"),
    migrationChecksum("SELECT 2;\n"),
  );
});
