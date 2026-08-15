"use client";

import { useEffect, useState } from "react";
import { formatPct, formatPrice } from "@/lib/format";
import DeltaBadge from "./DeltaBadge";
import FixtureStrip from "./FixtureStrip";
import type { FixtureEntry } from "@/lib/useApi";
import type { PlayerLatest } from "@/lib/types";

interface SquadPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  player: PlayerLatest | null;
}

interface TeamResponse {
  entry: { id: number; name: string; managerName: string; overallPoints: number; overallRank: number; eventPoints: number };
  event: number;
  entryHistory: { points: number; total_points: number; rank: number };
  squad: SquadPick[];
}

const STORAGE_KEY = "fpl-tracker-team-id";

export default function MyTeamPanel({ fixturesByTeam }: { fixturesByTeam: Record<number, FixtureEntry[]> }) {
  const [teamId, setTeamId] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setInput(saved);
      setTeamId(saved);
    }
  }, []);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/team/${teamId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Team not found — check the ID");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
        localStorage.setItem(STORAGE_KEY, teamId);
      })
      .catch((e) => {
        setError(String(e.message ?? e));
        setLoading(false);
      });
  }, [teamId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setTeamId(input.trim());
  };

  const avgOwnership =
    data && data.squad.length > 0
      ? data.squad.reduce((sum, s) => sum + (s.player?.selected_by_percent ?? 0), 0) / data.squad.length
      : null;

  return (
    <div>
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your FPL Team ID (e.g. 1234567)"
          inputMode="numeric"
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", color: "var(--text-primary)" }}
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--series-1)" }}
        >
          Load
        </button>
      </form>

      {!teamId && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your Team ID is the number in your FPL "Points" page URL:{" "}
          <span className="tabular" style={{ color: "var(--text-secondary)" }}>
            fantasy.premierleague.com/entry/<b>1234567</b>/event/1
          </span>
        </p>
      )}
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading squad…</p>}
      {error && <p style={{ color: "var(--critical)" }}>{error}</p>}

      {data && !loading && !error && (
        <div className="fade-in">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Manager</div>
              <div className="text-sm font-medium">{data.entry.managerName}</div>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Overall rank</div>
              <div className="text-sm font-medium tabular">{data.entry.overallRank?.toLocaleString()}</div>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>GW points</div>
              <div className="text-sm font-medium tabular">{data.entryHistory?.points}</div>
            </div>
            {avgOwnership !== null && (
              <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Squad avg. ownership</div>
                <div className="text-sm font-medium tabular">{formatPct(avgOwnership)}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {data.squad
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((pick) => {
                const p = pick.player;
                return (
                  <div
                    key={pick.element}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                    style={{
                      background: pick.position <= 11 ? "var(--surface)" : "var(--surface-2)",
                      border: "1px solid var(--border)",
                      opacity: pick.position <= 11 ? 1 : 0.65
                    }}
                  >
                    <span
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                    >
                      {p?.team_short ?? "?"}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {p?.web_name ?? `#${pick.element}`}
                        {pick.is_captain && <span style={{ color: "var(--series-1)" }}> (C)</span>}
                        {pick.is_vice_captain && <span style={{ color: "var(--text-muted)" }}> (V)</span>}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {p?.position} {p ? `· ${formatPrice(p.now_cost)}` : ""}
                      </span>
                      {p && (
                        <span className="mt-1">
                          <FixtureStrip fixtures={fixturesByTeam[p.team]} />
                        </span>
                      )}
                    </span>
                    {p && (
                      <span className="flex flex-none flex-col items-end gap-0.5">
                        <span className="text-sm font-semibold tabular">{formatPct(p.selected_by_percent)}</span>
                        <DeltaBadge value={p.delta} />
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
