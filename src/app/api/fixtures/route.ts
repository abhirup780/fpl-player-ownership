import { NextResponse } from "next/server";
import { getFixturesByTeam } from "@/lib/fixtures";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const byTeam = await getFixturesByTeam();
    return NextResponse.json({ byTeam });
  } catch (err) {
    console.error("fixtures fetch failed", err);
    return NextResponse.json({ error: "fixtures_failed" }, { status: 502 });
  }
}
