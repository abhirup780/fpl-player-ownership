import { NextResponse } from "next/server";
import { takeSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Called by the client while the dashboard is open, so live data keeps
// flowing even on Vercel plans where scheduled cron only fires daily.
// takeSnapshot() self-throttles, so frequent calls are cheap no-ops.
async function handle() {
  try {
    const result = await takeSnapshot(false);
    return NextResponse.json(result);
  } catch (err) {
    console.error("snapshot failed", err);
    return NextResponse.json({ error: "snapshot_failed" }, { status: 502 });
  }
}

export async function POST() {
  return handle();
}

export async function GET() {
  return handle();
}
