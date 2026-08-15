import { getFixtures, type FplFixture } from "./fpl";
import { getDb } from "./db";

export interface FixtureEntry {
  event: number | null;
  opponent_short: string;
  opponent_name: string;
  is_home: boolean;
  difficulty: number;
  kickoff_time: string | null;
}

export type FixturesByTeam = Record<number, FixtureEntry[]>;

const NEXT_N = 5;
const CACHE_TTL_MS = 30 * 60 * 1000;

let cache: { data: FixturesByTeam; ts: number } | null = null;

function buildRuns(fixtures: FplFixture[], teamsById: Map<number, { name: string; short_name: string }>): FixturesByTeam {
  const upcoming = fixtures
    .filter((f) => !f.finished)
    .sort((a, b) => new Date(a.kickoff_time ?? 0).getTime() - new Date(b.kickoff_time ?? 0).getTime());

  const byTeam: FixturesByTeam = {};
  for (const f of upcoming) {
    const home = teamsById.get(f.team_h);
    const away = teamsById.get(f.team_a);
    if (!home || !away) continue;

    const homeList = (byTeam[f.team_h] ??= []);
    if (homeList.length < NEXT_N) {
      homeList.push({
        event: f.event,
        opponent_short: away.short_name,
        opponent_name: away.name,
        is_home: true,
        difficulty: f.team_h_difficulty,
        kickoff_time: f.kickoff_time
      });
    }

    const awayList = (byTeam[f.team_a] ??= []);
    if (awayList.length < NEXT_N) {
      awayList.push({
        event: f.event,
        opponent_short: home.short_name,
        opponent_name: home.name,
        is_home: false,
        difficulty: f.team_a_difficulty,
        kickoff_time: f.kickoff_time
      });
    }
  }
  return byTeam;
}

export async function getFixturesByTeam(): Promise<FixturesByTeam> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data;

  const db = await getDb();
  const teamsJson = await db.getMeta("teams_json");
  const teams: { id: number; name: string; short_name: string }[] = teamsJson ? JSON.parse(teamsJson) : [];
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  const fixtures = await getFixtures();
  const data = buildRuns(fixtures, teamsById);
  cache = { data, ts: Date.now() };
  return data;
}
