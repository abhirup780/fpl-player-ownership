import type { DbAdapter } from "./db/types";
import { resolveSinceTs } from "./ranges";
import type { PlayerLatest, TimeRange } from "./types";

export async function getPlayersWithDelta(db: DbAdapter, range: TimeRange): Promise<PlayerLatest[]> {
  const now = Date.now();
  const [players, latest] = await Promise.all([db.getPlayers(), db.getLatestSnapshots()]);

  // "Live" means tick-over-tick — the actual previous poll, whenever that
  // was — rather than a fixed lookback window, so it reflects the newest
  // real movement instead of lagging by up to LIVE_WINDOW_MS.
  const prior =
    range === "live" ? await db.getPreviousSnapshot() : await db.getSnapshotAsOf(await resolveSinceTs(db, range, now));

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const priorMap = new Map(prior.rows.map((r) => [r.player_id, r]));

  const out: PlayerLatest[] = [];
  for (const snap of latest) {
    const p = playerMap.get(snap.player_id);
    if (!p) continue;
    const priorSnap = priorMap.get(snap.player_id);
    const delta = priorSnap ? snap.selected_by_percent - priorSnap.selected_by_percent : null;
    const delta_relative =
      priorSnap && priorSnap.selected_by_percent > 0
        ? (delta! / priorSnap.selected_by_percent) * 100
        : null;
    out.push({
      ...p,
      ts: snap.ts,
      selected_by_percent: snap.selected_by_percent,
      now_cost: snap.now_cost,
      form: snap.form,
      total_points: snap.total_points,
      event_points: snap.event_points,
      transfers_in_event: snap.transfers_in_event,
      transfers_out_event: snap.transfers_out_event,
      delta,
      delta_relative
    });
  }
  return out;
}
