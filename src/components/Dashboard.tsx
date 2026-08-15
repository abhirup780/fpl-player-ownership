"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlayerLatest, TimeRange } from "@/lib/types";
import { useFixtures, useHistory, useLiveSnapshotPing, useMeta, useMovers, usePlayers } from "@/lib/useApi";
import { formatTimeAgo } from "@/lib/format";
import TimeRangeSelector from "./TimeRangeSelector";
import StatTile from "./StatTile";
import PlayerSearch from "./PlayerSearch";
import OwnershipTrendChart from "./OwnershipTrendChart";
import MostOwnedPanel from "./MostOwnedPanel";
import MomentumChart from "./MomentumChart";
import MoversPanel from "./MoversPanel";
import MyTeamPanel from "./MyTeamPanel";
import AllPlayersList from "./AllPlayersList";

function Panel({
  title,
  subtitle,
  action,
  children
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  useLiveSnapshotPing();
  const [tab, setTab] = useState<"overview" | "myteam">("overview");
  const [range, setRange] = useState<TimeRange>("24h");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [risingMode, setRisingMode] = useState<"rising" | "breakout">("rising");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  const { meta } = useMeta();
  const { players, loading } = usePlayers(range);
  const rising = useMovers(range, "rising", risingMode === "breakout");
  const falling = useMovers(range, "falling");
  const fixturesByTeam = useFixtures();

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Seed the comparison chart with the most-owned player once data loads.
    if (selectedIds.length === 0 && players.length > 0) {
      const top = players.slice().sort((a, b) => b.selected_by_percent - a.selected_by_percent)[0];
      if (top) setSelectedIds([top.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const { series } = useHistory(selectedIds, range);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedPlayers = useMemo(
    () => selectedIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as PlayerLatest[],
    [selectedIds, players]
  );

  const toggleSelect = (p: PlayerLatest) => {
    setSelectedIds((prev) => {
      if (prev.includes(p.id)) return prev.filter((id) => id !== p.id);
      if (prev.length >= 6) return prev;
      return [...prev, p.id];
    });
  };

  const lastUpdated = meta?.lastSnapshotTs ?? null;
  const now = meta?.serverNow ?? Date.now();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8" style={{ background: "var(--page)" }}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="pulse-dot inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--good)" }}
              aria-hidden
            />
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              FPL Ownership Live
            </h1>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Updated {formatTimeAgo(lastUpdated, now)} · {meta?.snapshotCount ?? 0} snapshots collected
            {meta?.currentEventId ? ` · GW${meta.currentEventId}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <nav
            className="inline-flex items-center gap-0.5 rounded-lg p-0.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {(["overview", "myteam"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{
                  background: tab === t ? "var(--series-1)" : "transparent",
                  color: tab === t ? "#fff" : "var(--text-secondary)"
                }}
              >
                {t === "overview" ? "Overview" : "My Team"}
              </button>
            ))}
          </nav>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            title="Cycle theme (system → light → dark)"
          >
            {theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {tab === "myteam" ? (
        <Panel title="My Team" subtitle="Enter your public FPL Team ID to see your squad's live ownership.">
          <MyTeamPanel fixturesByTeam={fixturesByTeam} />
        </Panel>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3">
            <StatTile label="Players tracked" value={String(players.length || "—")} />
            <StatTile
              label="Snapshots"
              value={String(meta?.snapshotCount ?? "—")}
              sub={meta?.firstSnapshotTs ? `since ${formatTimeAgo(meta.firstSnapshotTs, now)}` : undefined}
            />
            <StatTile label="Gameweek" value={meta?.currentEventId ? `GW ${meta.currentEventId}` : "—"} />
            <StatTile
              label="Last update"
              value={formatTimeAgo(lastUpdated, now)}
              accent="var(--good-text)"
            />
          </div>

          <Panel
            title="Ownership trends"
            subtitle="Compare up to 6 players over time. Click a player anywhere on the dashboard to add them."
            action={<TimeRangeSelector value={range} onChange={setRange} />}
          >
            <div className="mb-3">
              <PlayerSearch players={players} onAdd={toggleSelect} selectedIds={selectedIdSet} />
            </div>
            <OwnershipTrendChart series={series} players={selectedPlayers} range={range} />
          </Panel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Most owned" subtitle="Top 10 by current selection %. Click to compare.">
              <MostOwnedPanel players={players} onToggle={toggleSelect} selectedIds={selectedIdSet} />
            </Panel>
            <Panel title="Ownership momentum" subtitle="Who's gaining or losing template status right now.">
              <MomentumChart players={players} />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel
              title={risingMode === "breakout" ? "Breakout players" : "Fast rising"}
              subtitle={
                risingMode === "breakout"
                  ? "Low-owned players climbing fastest, relative to their own base."
                  : "Biggest ownership gains this range."
              }
              action={
                <div
                  className="inline-flex items-center gap-0.5 rounded-lg p-0.5"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  {(["rising", "breakout"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setRisingMode(m)}
                      className="rounded-md px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        background: risingMode === m ? "var(--good)" : "transparent",
                        color: risingMode === m ? "#fff" : "var(--text-secondary)"
                      }}
                    >
                      {m === "rising" ? "Rising" : "Breakout"}
                    </button>
                  ))}
                </div>
              }
            >
              <MoversPanel
                players={rising}
                onToggle={toggleSelect}
                selectedIds={selectedIdSet}
                direction="rising"
                emptyLabel="No risers yet for this range — check back after a few snapshots."
              />
            </Panel>
            <Panel title="Fast falling" subtitle="Biggest ownership drops this range.">
              <MoversPanel
                players={falling}
                onToggle={toggleSelect}
                selectedIds={selectedIdSet}
                direction="falling"
                emptyLabel="No fallers yet for this range — check back after a few snapshots."
              />
            </Panel>
          </div>

          <Panel
            title="All players"
            subtitle="Ranked by ownership %, scroll for more. Filter by team, price or position. Click a row to add it to the comparison chart."
          >
            <AllPlayersList
              players={players}
              onToggle={toggleSelect}
              selectedIds={selectedIdSet}
              teams={meta?.teams ?? []}
              fixturesByTeam={fixturesByTeam}
            />
          </Panel>

          {loading && players.length === 0 && (
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Fetching live FPL data for the first time — this can take a few seconds…
            </p>
          )}
        </div>
      )}

      <footer className="mt-10 pb-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
        Data from the official Fantasy Premier League API. Not affiliated with the Premier League.
      </footer>
    </div>
  );
}
