import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const db = await getDb();
  const [eventsJson, teamsJson, currentEventId, range] = await Promise.all([
    db.getMeta("events_json"),
    db.getMeta("teams_json"),
    db.getMeta("current_event_id"),
    db.getSnapshotRange()
  ]);

  return NextResponse.json({
    events: eventsJson ? JSON.parse(eventsJson) : [],
    teams: teamsJson ? JSON.parse(teamsJson) : [],
    currentEventId: currentEventId ? Number(currentEventId) : null,
    snapshotCount: range.count,
    firstSnapshotTs: range.minTs,
    lastSnapshotTs: range.maxTs,
    serverNow: Date.now()
  });
}
