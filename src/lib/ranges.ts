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
  if (range === "gw" || range === "season") {
    const metaKey = range === "gw" ? "current_event_deadline" : "season_start_deadline";
    const deadline = await db.getMeta(metaKey);
    const deadlineTs = deadline ? new Date(deadline).getTime() : null;
    // Before that deadline has actually passed (e.g. preseason, or the
    // current gameweek hasn't kicked off yet), "since the deadline" would
    // resolve to a threshold in the future — which makes every delta
    // collapse to zero. Fall back to the start of whatever history we've
    // actually recorded, so the range still shows real movement.
    if (deadlineTs && deadlineTs <= now) return deadlineTs;
    const range0 = await db.getSnapshotRange();
    return range0.minTs ?? now - RANGE_MS["7d"];
  }
  return now - RANGE_MS[range];
}

export const LIVE_WINDOW_MS = RANGE_MS.live;
