import { migrateDatabase } from "./migrate.js";
import { assertLocalDatabaseTarget } from "./local-database-target.js";

const developmentUrl =
  process.env.DATABASE_URL ??
  "postgresql://tablelark:tablelark@localhost:55432/tablelark";
const testUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://tablelark:tablelark@localhost:55432/tablelark_test";

assertLocalDatabaseTarget(developmentUrl, "development");
assertLocalDatabaseTarget(testUrl, "test");

await migrateDatabase(developmentUrl);
await migrateDatabase(testUrl);

console.log("Local development and test databases are ready.");
