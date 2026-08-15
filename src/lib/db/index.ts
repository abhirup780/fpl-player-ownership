import type { DbAdapter } from "./types";

let adapter: DbAdapter | null = null;
let schemaReady: Promise<void> | null = null;

function pickAdapter(): DbAdapter {
  if (adapter) return adapter;
  const hasPostgres = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (hasPostgres) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    adapter = require("./postgres").postgresAdapter as DbAdapter;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    adapter = require("./sqlite").sqliteAdapter as DbAdapter;
  }
  return adapter;
}

export async function getDb(): Promise<DbAdapter> {
  const a = pickAdapter();
  if (!schemaReady) schemaReady = a.ensureSchema();
  await schemaReady;
  return a;
}

export type { DbAdapter } from "./types";
