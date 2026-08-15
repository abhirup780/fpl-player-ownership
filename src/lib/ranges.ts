import type { DbAdapter } from "./db/types";
import type { TimeRange } from "./types";

const RANGE_MS: Record<Exclude<TimeRange, "gw" | "season">, number> = {
  live: 20 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000
};

/** Resolves a TimeRange label to a concrete "since" unix-ms timestamp. */
export async function resolveSinceTs(db: DbAdapter, range: TimeRange, now = Date.now()): Promise<number> {
  if (range === "gw") {
    const deadline = await db.getMeta("current_event_deadline");
    if (deadline) return new Date(deadline).getTime();
    return now - RANGE_MS["7d"];
  }
  if (range === "season") {
    const deadline = await db.getMeta("season_start_deadline");
    if (deadline) return new Date(deadline).getTime();
    const range0 = await db.getSnapshotRange();
    return range0.minTs ?? now;
  }
  return now - RANGE_MS[range];
}

export const LIVE_WINDOW_MS = RANGE_MS.live;
