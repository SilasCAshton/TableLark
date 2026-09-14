import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const migrationsDirectory = path.join(
  projectRoot,
  "database",
  "migrations",
);
const MIGRATION_LOCK_ID = 784215963;

function checksum(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

export async function migrateDatabase(databaseUrl) {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to run database migrations.",
    );
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(
      "SELECT pg_advisory_lock($1)",
      [MIGRATION_LOCK_ID],
    );
    await client.query(
      "CREATE SCHEMA IF NOT EXISTS tablelark_meta",
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS tablelark_meta.schema_migrations (
        name TEXT PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = await readFile(
        path.join(migrationsDirectory, file),
        "utf8",
      );
      const migrationChecksum = checksum(sql);
      const applied = await client.query(
        `
          SELECT checksum
          FROM tablelark_meta.schema_migrations
          WHERE name = $1
        `,
        [file],
      );

      if (applied.rowCount > 0) {
        if (applied.rows[0].checksum !== migrationChecksum) {
          throw new Error(
            `Applied migration ${file} has been modified.`,
          );
        }

        continue;
      }

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query(
          `
            INSERT INTO tablelark_meta.schema_migrations
              (name, checksum)
            VALUES ($1, $2)
          `,
          [file, migrationChecksum],
        );
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [
        MIGRATION_LOCK_ID,
      ])
      .catch(() => undefined);
    await client.end();
  }
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  await migrateDatabase(
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  );
}
