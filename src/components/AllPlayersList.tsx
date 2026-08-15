"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerLatest } from "@/lib/types";
import type { FixtureEntry } from "@/lib/useApi";
import { formatPct, formatPrice, POSITION_ORDER } from "@/lib/format";
import DeltaBadge from "./DeltaBadge";
import FixtureStrip from "./FixtureStrip";

const PAGE_SIZE = 25;
const PRICE_MIN = 35; // £3.5m
const PRICE_MAX = 155; // £15.5m

interface TeamOption {
  id: number;
  name: string;
  short_name: string;
}

export default function AllPlayersList({
  players,
  onToggle,
  selectedIds,
  teams,
  fixturesByTeam
}: {
  players: PlayerLatest[];
  onToggle: (p: PlayerLatest) => void;
  selectedIds: Set<number>;
  teams: TeamOption[];
  fixturesByTeam: Record<number, FixtureEntry[]>;
}) {
  const [position, setPosition] = useState<string | null>(null);
  const [team, setTeam] = useState<string>("");
  // The committed range drives filtering (expensive: re-filters/re-sorts the
  // whole list, which changes the visible row count and reflows the page).
  // `draftPrice` is what the sliders actually show while dragging, so the
  // list — and the layout around the slider — stays put mid-drag; the
  // commit is debounced so filtering only happens once the drag settles.
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [draftPrice, setDraftPrice] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const updateDraftPrice = (next: [number, number]) => {
    setDraftPrice(next);
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => setPriceRange(next), 200);
  };

  const sorted = useMemo(() => {
    const [lo, hi] = priceRange;
    const filtered = players.filter((p) => {
      if (position && p.position !== position) return false;
      if (team && p.team_short !== team) return false;
      if (p.now_cost < lo || p.now_cost > hi) return false;
      return true;
    });
    return filtered.slice().sort((a, b) => b.selected_by_percent - a.selected_by_percent);
  }, [players, position, team, priceRange]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [position, team, priceRange, players.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, sorted.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sorted.length]);

  const shown = sorted.slice(0, visible);

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
  }, []);

  const resetFilters = () => {
    setPosition(null);
    setTeam("");
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setDraftPrice([PRICE_MIN, PRICE_MAX]);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
  };

  const filtersActive = position !== null || team !== "" || draftPrice[0] !== PRICE_MIN || draftPrice[1] !== PRICE_MAX;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Position
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPosition(null)}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: position === null ? "var(--series-1)" : "var(--surface-2)",
                color: position === null ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border)"
              }}
            >
              All
            </button>
            {POSITION_ORDER.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: position === pos ? "var(--series-1)" : "var(--surface-2)",
                  color: position === pos ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border)"
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Team
          </div>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="rounded-md px-2 py-1 text-[11px] font-medium outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <option value="">All teams</option>
            {teams
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((t) => (
                <option key={t.id} value={t.short_name}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <div
            className="mb-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide tabular"
            style={{ color: "var(--text-muted)" }}
          >
            Price: {formatPrice(draftPrice[0])} – {formatPrice(draftPrice[1])}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={1}
              value={draftPrice[0]}
              onChange={(e) => updateDraftPrice([Math.min(Number(e.target.value), draftPrice[1]), draftPrice[1]])}
              className="w-24 accent-[var(--series-1)]"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={1}
              value={draftPrice[1]}
              onChange={(e) => updateDraftPrice([draftPrice[0], Math.max(Number(e.target.value), draftPrice[0])])}
              className="w-24 accent-[var(--series-1)]"
            />
          </div>
        </div>

        {filtersActive && (
          <button
            onClick={resetFilters}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium"
            style={{ color: "var(--critical)", border: "1px solid var(--border)" }}
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto self-end text-[11px] tabular" style={{ color: "var(--text-muted)" }}>
          {shown.length} of {sorted.length}
        </span>
      </div>

      <div
        className="flex items-center gap-x-3 px-2.5 pb-1 pr-[calc(0.625rem+8px)] text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
      >
        <span className="w-5 flex-none">#</span>
        <span className="flex-1">Player</span>
        <span className="w-14 flex-none text-right sm:w-16">Price</span>
        <span className="w-20 flex-none text-right sm:w-24">Owned</span>
      </div>
      <div className="px-2.5 pt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
        Next 5 fixtures per player · green = easier, red = harder (tap/hover a fixture for details)
      </div>

      <div className="scrollbar-thin max-h-[560px] overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        {shown.map((p, i) => {
          const active = selectedIds.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p)}
              className="flex w-full flex-col gap-1.5 rounded-lg px-2.5 py-2.5 text-left transition-colors"
              style={{
                background: active ? "color-mix(in srgb, var(--series-1) 10%, transparent)" : "transparent",
                border: `1px solid ${active ? "var(--series-1)" : "transparent"}`
              }}
            >
              <div className="flex items-center gap-x-3">
                <span className="w-5 flex-none text-xs tabular" style={{ color: "var(--text-muted)" }}>
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {p.web_name}
                  </span>
                  <span className="block truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {p.team_short} · {p.position}
                  </span>
                </span>
                <span className="w-14 flex-none text-right text-xs tabular sm:w-16" style={{ color: "var(--text-secondary)" }}>
                  {formatPrice(p.now_cost)}
                </span>
                <span className="flex w-20 flex-none flex-col items-end gap-0.5 sm:w-24">
                  <span className="text-sm font-semibold tabular" style={{ color: "var(--text-primary)" }}>
                    {formatPct(p.selected_by_percent)}
                  </span>
                  <DeltaBadge value={p.delta} />
                </span>
              </div>
              <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pl-[2rem]">
                <FixtureStrip fixtures={fixturesByTeam[p.team]} />
              </div>
            </button>
          );
        })}
        {visible < sorted.length && (
          <div ref={sentinelRef} className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Loading more players…
          </div>
        )}
        {shown.length === 0 && (
          <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No players match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
