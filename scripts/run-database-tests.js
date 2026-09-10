import { spawnSync } from "node:child_process";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://tablelark:tablelark@localhost:55432/tablelark_test";

const result = spawnSync(
  process.execPath,
  ["--test", "test/polls/database.test.js"],
  {
    env: {
      ...process.env,
      TEST_DATABASE_URL: testDatabaseUrl,
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
