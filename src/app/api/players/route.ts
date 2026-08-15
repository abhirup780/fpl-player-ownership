import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayersWithDelta } from "@/lib/query";
import { takeSnapshot } from "@/lib/snapshot";
import type { TimeRange } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_RANGES: TimeRange[] = ["live", "1h", "6h", "24h", "7d", "gw", "season"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rangeParam = (searchParams.get("range") ?? "24h") as TimeRange;
  const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "24h";
  const position = searchParams.get("position");
  const team = searchParams.get("team");
  const search = searchParams.get("search")?.toLowerCase().trim();
  const ids = searchParams.get("ids");

  const db = await getDb();
  let rows = await getPlayersWithDelta(db, range);

  if (rows.length === 0) {
    // First ever visit: seed the database so the dashboard isn't empty.
    await takeSnapshot(true);
    rows = await getPlayersWithDelta(db, range);
  }

  if (position) rows = rows.filter((r) => r.position === position);
  if (team) rows = rows.filter((r) => r.team_short === team);
  if (search) {
    rows = rows.filter(
      (r) =>
        r.web_name.toLowerCase().includes(search) ||
        `${r.first_name} ${r.second_name}`.toLowerCase().includes(search)
    );
  }
  if (ids) {
    const idSet = new Set(ids.split(",").map((s) => Number(s)));
    rows = rows.filter((r) => idSet.has(r.id));
  }

  return NextResponse.json({ range, players: rows });
}
