import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { PlayerRow, SnapshotRow } from "../types";
import type { DbAdapter } from "./types";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(path.join(dataDir, "ownership.db"));
  db.pragma("journal_mode = WAL");
  return db;
}

function ensureSchema(): Promise<void> {
  const d = getDb();
  d.exec(`
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
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      ts INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      selected_by_percent REAL NOT NULL,
      now_cost INTEGER NOT NULL,
      form REAL NOT NULL,
      total_points INTEGER NOT NULL,
      event_points INTEGER NOT NULL,
      transfers_in_event INTEGER NOT NULL,
      transfers_out_event INTEGER NOT NULL,
      PRIMARY KEY (ts, player_id)
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_player_ts ON snapshots(player_id, ts);
    CREATE INDEX IF NOT EXISTS idx_snapshots_ts ON snapshots(ts);
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return Promise.resolve();
}

function upsertPlayers(players: PlayerRow[]): Promise<void> {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO players (id, web_name, first_name, second_name, team, team_name, team_short, position, photo)
    VALUES (@id, @web_name, @first_name, @second_name, @team, @team_name, @team_short, @position, @photo)
    ON CONFLICT(id) DO UPDATE SET
      web_name=excluded.web_name, first_name=excluded.first_name, second_name=excluded.second_name,
      team=excluded.team, team_name=excluded.team_name, team_short=excluded.team_short,
      position=excluded.position, photo=excluded.photo
  `);
  const tx = d.transaction((rows: PlayerRow[]) => {
    for (const r of rows) stmt.run(r);
  });
  tx(players);
  return Promise.resolve();
}

function setMeta(key: string, value: string): Promise<void> {
  const d = getDb();
  d.prepare(
    `INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  ).run(key, value);
  return Promise.resolve();
}

function getMeta(key: string): Promise<string | null> {
  const d = getDb();
  const row = d.prepare(`SELECT value FROM meta WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return Promise.resolve(row ? row.value : null);
}

function getLastSnapshotTs(): Promise<number | null> {
  const d = getDb();
  const row = d.prepare(`SELECT MAX(ts) as ts FROM snapshots`).get() as { ts: number | null };
  return Promise.resolve(row.ts ?? null);
}

function insertSnapshots(rows: Omit<SnapshotRow, "ts">[], ts: number): Promise<void> {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO snapshots (ts, player_id, selected_by_percent, now_cost, form, total_points, event_points, transfers_in_event, transfers_out_event)
    VALUES (@ts, @player_id, @selected_by_percent, @now_cost, @form, @total_points, @event_points, @transfers_in_event, @transfers_out_event)
    ON CONFLICT(ts, player_id) DO NOTHING
  `);
  const tx = d.transaction((items: Omit<SnapshotRow, "ts">[]) => {
    for (const r of items) stmt.run({ ...r, ts });
  });
  tx(rows);
  return Promise.resolve();
}

function getPlayers(): Promise<PlayerRow[]> {
  const d = getDb();
  return Promise.resolve(d.prepare(`SELECT * FROM players`).all() as PlayerRow[]);
}

function getLatestSnapshots(): Promise<SnapshotRow[]> {
  const d = getDb();
  const rows = d
    .prepare(`SELECT * FROM snapshots WHERE ts = (SELECT MAX(ts) FROM snapshots)`)
    .all() as SnapshotRow[];
  return Promise.resolve(rows);
}

function getSnapshotAsOf(thresholdTs: number): Promise<{ ts: number | null; rows: SnapshotRow[] }> {
  const d = getDb();
  const tsRow = d
    .prepare(`SELECT MAX(ts) as ts FROM snapshots WHERE ts <= ?`)
    .get(thresholdTs) as { ts: number | null };
  if (!tsRow.ts) return Promise.resolve({ ts: null, rows: [] });
  const rows = d.prepare(`SELECT * FROM snapshots WHERE ts = ?`).all(tsRow.ts) as SnapshotRow[];
  return Promise.resolve({ ts: tsRow.ts, rows });
}

function getPreviousSnapshot(): Promise<{ ts: number | null; rows: SnapshotRow[] }> {
  const d = getDb();
  const tsRow = d
    .prepare(`SELECT ts FROM (SELECT DISTINCT ts FROM snapshots ORDER BY ts DESC LIMIT 1 OFFSET 1)`)
    .get() as { ts: number } | undefined;
  if (!tsRow) return Promise.resolve({ ts: null, rows: [] });
  const rows = d.prepare(`SELECT * FROM snapshots WHERE ts = ?`).all(tsRow.ts) as SnapshotRow[];
  return Promise.resolve({ ts: tsRow.ts, rows });
}

function getHistory(playerIds: number[], sinceTs: number): Promise<SnapshotRow[]> {
  if (playerIds.length === 0) return Promise.resolve([]);
  const d = getDb();
  const placeholders = playerIds.map(() => "?").join(",");
  const rows = d
    .prepare(
      `SELECT * FROM snapshots WHERE player_id IN (${placeholders}) AND ts >= ? ORDER BY ts ASC`
    )
    .all(...playerIds, sinceTs) as SnapshotRow[];
  return Promise.resolve(rows);
}

function getSnapshotRange() {
  const d = getDb();
  const row = d
    .prepare(`SELECT COUNT(DISTINCT ts) as count, MIN(ts) as minTs, MAX(ts) as maxTs FROM snapshots`)
    .get() as { count: number; minTs: number | null; maxTs: number | null };
  return Promise.resolve(row);
}

function getDistinctTs(sinceTs: number): Promise<number[]> {
  const d = getDb();
  const rows = d
    .prepare(`SELECT DISTINCT ts FROM snapshots WHERE ts >= ? ORDER BY ts ASC`)
    .all(sinceTs) as { ts: number }[];
  return Promise.resolve(rows.map((r) => r.ts));
}

export const sqliteAdapter: DbAdapter = {
  ensureSchema,
  upsertPlayers,
  setMeta,
  getMeta,
  getLastSnapshotTs,
  insertSnapshots,
  getPlayers,
  getLatestSnapshots,
  getSnapshotAsOf,
  getPreviousSnapshot,
  getHistory,
  getSnapshotRange,
  getDistinctTs
};
