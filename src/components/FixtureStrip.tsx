"use client";

import type { FixtureEntry } from "@/lib/useApi";

function difficultyStyle(d: number): { bg: string; fg: string } {
  if (d <= 2) return { bg: "var(--good)", fg: "#ffffff" };
  if (d === 3) return { bg: "var(--warning)", fg: "#0b0b0b" };
  if (d === 4) return { bg: "var(--serious)", fg: "#0b0b0b" };
  return { bg: "var(--critical)", fg: "#ffffff" };
}

export default function FixtureStrip({ fixtures }: { fixtures: FixtureEntry[] | undefined }) {
  if (!fixtures || fixtures.length === 0) {
    return <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>No fixtures scheduled</span>;
  }
  return (
    <div className="flex items-center gap-1" aria-label="Next 5 fixtures">
      {fixtures.map((f, i) => {
        const { bg, fg } = difficultyStyle(f.difficulty);
        return (
          <span
            key={i}
            title={`GW${f.event ?? "?"}: ${f.is_home ? "vs" : "@"} ${f.opponent_name} (FDR ${f.difficulty})`}
            className="flex h-5 min-w-[2.1rem] items-center justify-center rounded px-1 text-[10px] font-bold leading-none"
            style={{ background: bg, color: fg }}
          >
            {f.opponent_short}
            <span className="ml-0.5 opacity-80">{f.is_home ? "H" : "A"}</span>
          </span>
        );
      })}
    </div>
  );
}
