const databases = {
  development: "tablelark",
  test: "tablelark_test",
};

export function assertLocalDatabaseTarget(connectionString, purpose) {
  const database = databases[purpose];
  if (!database) throw new Error("Unknown local database purpose.");

  const message = `Local ${purpose} database must be ${database} on localhost or 127.0.0.1:55432, using a PostgreSQL URL without query parameters.`;
  let target;
  try {
    target = new URL(connectionString);
  } catch {
    throw new Error(message);
  }

  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !["localhost", "127.0.0.1"].includes(target.hostname) ||
    target.port !== "55432" ||
    target.pathname !== `/${database}` ||
    target.search ||
    target.hash
  ) {
    throw new Error(message);
  }
}

export async function assertConnectedTestDatabase(client) {
  const result = await client.query("SELECT current_database() AS name");
  if (result.rows[0]?.name !== databases.test) {
    throw new Error("Test cleanup stopped: connected database must be tablelark_test.");
  }
}
