import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveSinceTs } from "@/lib/ranges";
import type { TimeRange } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_RANGES: TimeRange[] = ["live", "1h", "6h", "24h", "7d", "gw", "season"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids query param is required" }, { status: 400 });
  }
  const ids = idsParam
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
  const rangeParam = (searchParams.get("range") ?? "24h") as TimeRange;
  const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "24h";

  const db = await getDb();
  const sinceTs = await resolveSinceTs(db, range);
  const rows = await db.getHistory(ids, sinceTs);

  const byPlayer = new Map<number, { ts: number; selected_by_percent: number; now_cost: number; total_points: number }[]>();
  for (const id of ids) byPlayer.set(id, []);
  for (const r of rows) {
    const arr = byPlayer.get(r.player_id);
    if (arr) {
      arr.push({
        ts: r.ts,
        selected_by_percent: r.selected_by_percent,
        now_cost: r.now_cost,
        total_points: r.total_points
      });
    }
  }

  const series = Array.from(byPlayer.entries()).map(([player_id, points]) => ({ player_id, points }));
  return NextResponse.json({ range, since: sinceTs, series });
}
