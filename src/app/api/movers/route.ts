import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlayersWithDelta } from "@/lib/query";
import type { TimeRange } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_RANGES: TimeRange[] = ["live", "1h", "6h", "24h", "7d", "gw", "season"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rangeParam = (searchParams.get("range") ?? "24h") as TimeRange;
  const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "24h";
  const direction = searchParams.get("direction") === "falling" ? "falling" : "rising";
  const limit = Math.min(Number(searchParams.get("limit") ?? 12) || 12, 50);
  // "breakout" = low-current-ownership players whose ownership is rising fastest;
  // set breakout=1 to bias toward that instead of raw percentage-point movers.
  const breakout = searchParams.get("breakout") === "1";

  const db = await getDb();
  const rows = await getPlayersWithDelta(db, range);

  const withDelta = rows.filter((r) => r.delta !== null && Number.isFinite(r.delta));

  let ranked;
  if (breakout && direction === "rising") {
    ranked = withDelta
      .filter((r) => r.selected_by_percent < 15)
      .sort((a, b) => (b.delta_relative ?? 0) - (a.delta_relative ?? 0));
  } else {
    ranked = withDelta.sort((a, b) =>
      direction === "rising" ? (b.delta ?? 0) - (a.delta ?? 0) : (a.delta ?? 0) - (b.delta ?? 0)
    );
  }

  return NextResponse.json({ range, direction, breakout, players: ranked.slice(0, limit) });
}
