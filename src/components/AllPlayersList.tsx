"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerLatest } from "@/lib/types";
import { formatPct, formatPrice, POSITION_ORDER } from "@/lib/format";
import DeltaBadge from "./DeltaBadge";

const PAGE_SIZE = 30;

export default function AllPlayersList({
  players,
  onToggle,
  selectedIds
}: {
  players: PlayerLatest[];
  onToggle: (p: PlayerLatest) => void;
  selectedIds: Set<number>;
}) {
  const [position, setPosition] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() => {
    const filtered = position ? players.filter((p) => p.position === position) : players;
    return filtered.slice().sort((a, b) => b.selected_by_percent - a.selected_by_percent);
  }, [players, position]);

  // Reset the reveal count whenever the underlying list changes shape (filter,
  // range, or a fresh fetch), so we don't render past what's now available.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [position, players.length]);

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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
        <span className="ml-auto text-[11px] tabular" style={{ color: "var(--text-muted)" }}>
          {shown.length} of {sorted.length}
        </span>
      </div>

      <div
        className="grid grid-cols-[2rem_1fr_2.75rem_2.75rem_3.5rem_6rem] items-center gap-x-3 gap-y-0 px-2.5 pb-1 pr-[calc(0.625rem+8px)] text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
      >
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Team</span>
        <span className="text-right">Pos</span>
        <span className="text-right">Price</span>
        <span className="text-right">Owned</span>
      </div>

      <div className="scrollbar-thin max-h-[520px] overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        {shown.map((p, i) => {
          const active = selectedIds.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p)}
              className="grid w-full grid-cols-[2rem_1fr_2.75rem_2.75rem_3.5rem_6rem] items-center gap-x-3 rounded-lg px-2.5 py-2 text-left transition-colors"
              style={{
                background: active ? "color-mix(in srgb, var(--series-1) 10%, transparent)" : "transparent",
                border: `1px solid ${active ? "var(--series-1)" : "transparent"}`
              }}
            >
              <span className="text-xs tabular" style={{ color: "var(--text-muted)" }}>
                {i + 1}
              </span>
              <span className="min-w-0 truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {p.web_name}
              </span>
              <span className="text-right text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {p.team_short}
              </span>
              <span
                className="justify-self-end rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                {p.position}
              </span>
              <span className="text-right text-xs tabular" style={{ color: "var(--text-secondary)" }}>
                {formatPrice(p.now_cost)}
              </span>
              <span className="flex items-center justify-end gap-2">
                <span className="text-sm font-semibold tabular" style={{ color: "var(--text-primary)" }}>
                  {formatPct(p.selected_by_percent)}
                </span>
                <DeltaBadge value={p.delta} />
              </span>
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
