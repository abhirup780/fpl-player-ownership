export interface PlayerRow {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  team_name: string;
  team_short: string;
  position: string;
  photo: string;
}

export interface SnapshotRow {
  ts: number; // unix ms
  player_id: number;
  selected_by_percent: number;
  now_cost: number;
  form: number;
  total_points: number;
  event_points: number;
  transfers_in_event: number;
  transfers_out_event: number;
}

export interface PlayerLatest extends PlayerRow {
  ts: number;
  selected_by_percent: number;
  now_cost: number;
  form: number;
  total_points: number;
  event_points: number;
  transfers_in_event: number;
  transfers_out_event: number;
  /** Percentage-point change in selected_by_percent over the requested range. */
  delta: number | null;
  /** Relative change (%) over the requested range, undefined-safe for low-ownership players. */
  delta_relative: number | null;
}

export interface HistoryPoint {
  ts: number;
  selected_by_percent: number;
  now_cost: number;
  total_points: number;
}

export interface PlayerHistory {
  player_id: number;
  points: HistoryPoint[];
}

export type TimeRange = "live" | "1h" | "6h" | "24h" | "7d" | "gw" | "season";

export interface TeamMeta {
  id: number;
  name: string;
  short_name: string;
}

export interface EventMeta {
  id: number;
  name: string;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}
