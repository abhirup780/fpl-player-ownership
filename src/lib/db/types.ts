import type { PlayerRow, SnapshotRow } from "../types";

export interface SnapshotTsRange {
  count: number;
  minTs: number | null;
  maxTs: number | null;
}

export interface DbAdapter {
  ensureSchema(): Promise<void>;
  upsertPlayers(players: PlayerRow[]): Promise<void>;
  setMeta(key: string, value: string): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  getLastSnapshotTs(): Promise<number | null>;
  insertSnapshots(rows: Omit<SnapshotRow, "ts">[], ts: number): Promise<void>;
  getPlayers(): Promise<PlayerRow[]>;
  getLatestSnapshots(): Promise<SnapshotRow[]>;
  /** Most recent snapshot batch at or before thresholdTs (its ts + rows). */
  getSnapshotAsOf(thresholdTs: number): Promise<{ ts: number | null; rows: SnapshotRow[] }>;
  getHistory(playerIds: number[], sinceTs: number): Promise<SnapshotRow[]>;
  getSnapshotRange(): Promise<SnapshotTsRange>;
  getDistinctTs(sinceTs: number): Promise<number[]>;
}
