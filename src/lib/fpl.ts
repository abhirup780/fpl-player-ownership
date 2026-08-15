const BASE = "https://fantasy.premierleague.com/api";

const UA = "fpl-ownership-tracker/1.0 (+https://vercel.com)";

async function fplFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    // FPL data changes often — never let Next cache this at the fetch layer.
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`FPL API ${path} responded ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface FplElement {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  selected_by_percent: string;
  form: string;
  total_points: number;
  event_points: number;
  transfers_in_event: number;
  transfers_out_event: number;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  photo: string;
  points_per_game: string;
  minutes: number;
}

export interface FplTeam {
  id: number;
  name: string;
  short_name: string;
}

export interface FplElementType {
  id: number;
  singular_name_short: string;
  singular_name: string;
}

export interface FplEvent {
  id: number;
  name: string;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

export interface FplBootstrap {
  elements: FplElement[];
  teams: FplTeam[];
  element_types: FplElementType[];
  events: FplEvent[];
}

export async function getBootstrap(): Promise<FplBootstrap> {
  return fplFetch<FplBootstrap>("/bootstrap-static/");
}

export interface FplEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string; // team name
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  current_event: number;
}

export async function getEntry(teamId: number): Promise<FplEntry> {
  return fplFetch<FplEntry>(`/entry/${teamId}/`);
}

export interface FplPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FplPicksResponse {
  picks: FplPick[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
  };
}

export async function getEntryPicks(teamId: number, event: number): Promise<FplPicksResponse> {
  return fplFetch<FplPicksResponse>(`/entry/${teamId}/event/${event}/picks/`);
}

export interface FplFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  finished: boolean;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export async function getFixtures(): Promise<FplFixture[]> {
  return fplFetch<FplFixture[]>("/fixtures/?future=1");
}

export const POSITION_MAP: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD"
};
