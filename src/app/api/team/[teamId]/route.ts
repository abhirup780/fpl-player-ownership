import { NextRequest, NextResponse } from "next/server";
import { getEntry, getEntryPicks, getBootstrap } from "@/lib/fpl";
import { getDb } from "@/lib/db";
import { getPlayersWithDelta } from "@/lib/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  const teamId = Number(params.teamId);
  if (!Number.isFinite(teamId) || teamId <= 0) {
    return NextResponse.json({ error: "invalid team id" }, { status: 400 });
  }

  try {
    const entry = await getEntry(teamId);
    let event: number | undefined = entry.current_event;
    if (!event) {
      const bootstrap = await getBootstrap();
      const target = bootstrap.events.find((e) => e.is_current) ?? bootstrap.events.find((e) => e.is_next);
      event = target?.id;
    }
    if (!event) {
      return NextResponse.json({ error: "no active gameweek yet" }, { status: 404 });
    }
    let picks;
    try {
      picks = await getEntryPicks(teamId, event);
    } catch {
      return NextResponse.json(
        { error: "This team hasn't set a squad for the upcoming gameweek yet." },
        { status: 404 }
      );
    }

    const db = await getDb();
    const ownership = await getPlayersWithDelta(db, "24h");
    const ownershipMap = new Map(ownership.map((p) => [p.id, p]));

    const squad = picks.picks.map((pick) => {
      const player = ownershipMap.get(pick.element);
      return {
        ...pick,
        player: player ?? null
      };
    });

    return NextResponse.json({
      entry: {
        id: entry.id,
        name: entry.name,
        managerName: `${entry.player_first_name} ${entry.player_last_name}`,
        overallPoints: entry.summary_overall_points,
        overallRank: entry.summary_overall_rank,
        eventPoints: entry.summary_event_points
      },
      event,
      entryHistory: picks.entry_history,
      squad
    });
  } catch (err) {
    console.error("team lookup failed", err);
    return NextResponse.json({ error: "team_lookup_failed" }, { status: 502 });
  }
}
