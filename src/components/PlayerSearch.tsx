"use client";

import { useMemo, useState } from "react";
import type { PlayerLatest } from "@/lib/types";
import { formatPct, formatPrice } from "@/lib/format";

export default function PlayerSearch({
  players,
  onAdd,
  selectedIds,
  max = 6
}: {
  players: PlayerLatest[];
  onAdd: (p: PlayerLatest) => void;
  selectedIds: Set<number>;
  max?: number;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter((p) => p.web_name.toLowerCase().includes(q) || `${p.first_name} ${p.second_name}`.toLowerCase().includes(q))
      .sort((a, b) => b.selected_by_percent - a.selected_by_percent)
      .slice(0, 8);
  }, [players, query]);

  const atMax = selectedIds.size >= max;

  return (
    <div className="relative w-full max-w-sm">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search a player to compare…"
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-primary)"
        }}
      />
      {focused && query && results.length > 0 && (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg shadow-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
        >
          {results.map((p) => {
            const selected = selectedIds.has(p.id);
            return (
              <button
                key={p.id}
                disabled={!selected && atMax}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAdd(p);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm disabled:opacity-40"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span>
                  <span style={{ color: "var(--text-primary)" }}>{p.web_name}</span>{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    {p.team_short} · {p.position}
                  </span>
                </span>
                <span className="tabular" style={{ color: "var(--text-secondary)" }}>
                  {formatPct(p.selected_by_percent)} · {formatPrice(p.now_cost)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
