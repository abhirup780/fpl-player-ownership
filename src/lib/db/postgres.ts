import postgres from "postgres";
import type { PlayerRow, SnapshotRow } from "../types";
import type { DbAdapter } from "./types";

let sql: postgres.Sql | null = null;

function getSql(): postgres.Sql {
  if (sql) return sql;
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL is not set");
  sql = postgres(url, {
    ssl: "require",
    max: 5,
    // Our `ts` columns are BIGINT (epoch ms) but always well within
    // Number.MAX_SAFE_INTEGER — return them as plain numbers instead of the
    // driver's default (strings, to avoid silent precision loss on huge
    // bigints), so callers can do normal arithmetic/JSON without casting.
    types: {
      bigint: {
        to: 20,
        from: [20],
        serialize: (x: number) => String(x),
        parse: (x: string) => Number(x)
      }
    }
  });
  return sql;
}

async function ensureSchema(): Promise<void> {
  const s = getSql();
  await s`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      web_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      second_name TEXT NOT NULL,
      team INTEGER NOT NULL,
      team_name TEXT NOT NULL,
      team_short TEXT NOT NULL,
      position TEXT NOT NULL,
      photo TEXT NOT NULL
    )
  `;
  await s`
    CREATE TABLE IF NOT EXISTS snapshots (
      ts BIGINT NOT NULL,
      player_id INTEGER NOT NULL,
      selected_by_percent REAL NOT NULL,
      now_cost INTEGER NOT NULL,
      form REAL NOT NULL,
      total_points INTEGER NOT NULL,
      event_points INTEGER NOT NULL,
      transfers_in_event INTEGER NOT NULL,
      transfers_out_event INTEGER NOT NULL,
      PRIMARY KEY (ts, player_id)
    )
  `;
  await s`CREATE INDEX IF NOT EXISTS idx_snapshots_player_ts ON snapshots(player_id, ts)`;
  await s`CREATE INDEX IF NOT EXISTS idx_snapshots_ts ON snapshots(ts)`;
  await s`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
}

async function upsertPlayers(players: PlayerRow[]): Promise<void> {
  if (players.length === 0) return;
  const s = getSql();
  await s`
    INSERT INTO players ${s(players, "id", "web_name", "first_name", "second_name", "team", "team_name", "team_short", "position", "photo")}
    ON CONFLICT (id) DO UPDATE SET
      web_name = excluded.web_name, first_name = excluded.first_name, second_name = excluded.second_name,
      team = excluded.team, team_name = excluded.team_name, team_short = excluded.team_short,
      position = excluded.position, photo = excluded.photo
  `;
}

async function setMeta(key: string, value: string): Promise<void> {
  const s = getSql();
  await s`
    INSERT INTO meta (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `;
}

async function getMeta(key: string): Promise<string | null> {
  const s = getSql();
  const rows = await s<{ value: string }[]>`SELECT value FROM meta WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

async function getLastSnapshotTs(): Promise<number | null> {
  const s = getSql();
  const rows = await s<{ ts: number | null }[]>`SELECT MAX(ts) as ts FROM snapshots`;
  return rows[0]?.ts ?? null;
}

async function insertSnapshots(rows: Omit<SnapshotRow, "ts">[], ts: number): Promise<void> {
  if (rows.length === 0) return;
  const s = getSql();
  const withTs = rows.map((r) => ({ ...r, ts }));
  await s`
    INSERT INTO snapshots ${s(withTs, "ts", "player_id", "selected_by_percent", "now_cost", "form", "total_points", "event_points", "transfers_in_event", "transfers_out_event")}
    ON CONFLICT (ts, player_id) DO NOTHING
  `;
}

async function getPlayers(): Promise<PlayerRow[]> {
  const s = getSql();
  return s<PlayerRow[]>`SELECT * FROM players`;
}

async function getLatestSnapshots(): Promise<SnapshotRow[]> {
  const s = getSql();
  return s<SnapshotRow[]>`SELECT * FROM snapshots WHERE ts = (SELECT MAX(ts) FROM snapshots)`;
}

async function getSnapshotAsOf(
  thresholdTs: number
): Promise<{ ts: number | null; rows: SnapshotRow[] }> {
  const s = getSql();
  const tsRows = await s<{ ts: number | null }[]>`
    SELECT MAX(ts) as ts FROM snapshots WHERE ts <= ${thresholdTs}
  `;
  const ts = tsRows[0]?.ts ?? null;
  if (!ts) return { ts: null, rows: [] };
  const rows = await s<SnapshotRow[]>`SELECT * FROM snapshots WHERE ts = ${ts}`;
  return { ts, rows };
}

async function getHistory(playerIds: number[], sinceTs: number): Promise<SnapshotRow[]> {
  if (playerIds.length === 0) return [];
  const s = getSql();
  return s<SnapshotRow[]>`
    SELECT * FROM snapshots
    WHERE player_id IN ${s(playerIds)} AND ts >= ${sinceTs}
    ORDER BY ts ASC
  `;
}

async function getSnapshotRange() {
  const s = getSql();
  const rows = await s<{ count: number; mints: number | null; maxts: number | null }[]>`
    SELECT COUNT(DISTINCT ts)::int as count, MIN(ts) as mints, MAX(ts) as maxts FROM snapshots
  `;
  const r = rows[0];
  return { count: r?.count ?? 0, minTs: r?.mints ?? null, maxTs: r?.maxts ?? null };
}

async function getDistinctTs(sinceTs: number): Promise<number[]> {
  const s = getSql();
  const rows = await s<{ ts: number }[]>`
    SELECT DISTINCT ts FROM snapshots WHERE ts >= ${sinceTs} ORDER BY ts ASC
  `;
  return rows.map((r) => r.ts);
}

export const postgresAdapter: DbAdapter = {
  ensureSchema,
  upsertPlayers,
  setMeta,
  getMeta,
  getLastSnapshotTs,
  insertSnapshots,
  getPlayers,
  getLatestSnapshots,
  getSnapshotAsOf,
  getHistory,
  getSnapshotRange,
  getDistinctTs
};
