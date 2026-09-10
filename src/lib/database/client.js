import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema.js";

const { Pool } = pg;
const globalDatabase = globalThis;

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "The polling database is not configured. Add DATABASE_URL to the server environment.",
    );
  }

  return new Pool({
    connectionString,
    max: 5,
    ssl:
      process.env.DATABASE_SSL === "require"
        ? { rejectUnauthorized: true }
        : undefined,
  });
}

export function getDatabase() {
  if (!globalDatabase.__tablelarkDatabasePool) {
    globalDatabase.__tablelarkDatabasePool = createPool();
  }

  return drizzle(globalDatabase.__tablelarkDatabasePool, {
    schema,
  });
}
