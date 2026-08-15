import { NextRequest, NextResponse } from "next/server";
import { takeSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const result = await takeSnapshot(true);
    return NextResponse.json(result);
  } catch (err) {
    console.error("cron snapshot failed", err);
    return NextResponse.json({ error: "snapshot_failed" }, { status: 502 });
  }
}
