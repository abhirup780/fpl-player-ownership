import { getDb } from "./db";
import { getBootstrap, POSITION_MAP } from "./fpl";
import type { PlayerRow } from "./types";

export const MIN_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // don't hammer FPL more than every 5 minutes

export interface SnapshotResult {
  taken: boolean;
  ts: number;
  reason: string;
  playerCount: number;
}

/**
 * Fetches the current FPL bootstrap dataset and records one ownership snapshot,
 * unless the last snapshot is still fresh (MIN_SNAPSHOT_INTERVAL_MS). Also keeps
 * the players/teams/events reference tables current.
 */
export async function takeSnapshot(force = false): Promise<SnapshotResult> {
  const db = await getDb();
  const now = Date.now();

  if (!force) {
    const last = await db.getLastSnapshotTs();
    if (last && now - last < MIN_SNAPSHOT_INTERVAL_MS) {
      return { taken: false, ts: last, reason: "throttled", playerCount: 0 };
    }
  }

  const bootstrap = await getBootstrap();

  const teamsById = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const players: PlayerRow[] = bootstrap.elements.map((el) => {
    const team = teamsById.get(el.team);
    return {
      id: el.id,
      web_name: el.web_name,
      first_name: el.first_name,
      second_name: el.second_name,
      team: el.team,
      team_name: team?.name ?? "Unknown",
      team_short: team?.short_name ?? "UNK",
      position: POSITION_MAP[el.element_type] ?? "UNK",
      photo: el.photo
    };
  });

  await db.upsertPlayers(players);

  const snapshotRows = bootstrap.elements.map((el) => ({
    player_id: el.id,
    selected_by_percent: Number.parseFloat(el.selected_by_percent) || 0,
    now_cost: el.now_cost,
    form: Number.parseFloat(el.form) || 0,
    total_points: el.total_points,
    event_points: el.event_points,
    transfers_in_event: el.transfers_in_event,
    transfers_out_event: el.transfers_out_event
  }));

  await db.insertSnapshots(snapshotRows, now);

  const currentEvent = bootstrap.events.find((e) => e.is_current) ?? bootstrap.events.find((e) => e.is_next);
  if (currentEvent) {
    await db.setMeta("current_event_id", String(currentEvent.id));
    await db.setMeta("current_event_deadline", currentEvent.deadline_time);
  }
  const firstEvent = bootstrap.events[0];
  if (firstEvent) {
    await db.setMeta("season_start_deadline", firstEvent.deadline_time);
  }
  await db.setMeta("events_json", JSON.stringify(bootstrap.events));
  await db.setMeta("teams_json", JSON.stringify(bootstrap.teams));

  return { taken: true, ts: now, reason: "ok", playerCount: players.length };
}
