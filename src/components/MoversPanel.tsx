"use client";

import type { PlayerLatest } from "@/lib/types";
import { formatPct, formatPrice } from "@/lib/format";
import DeltaBadge from "./DeltaBadge";

export default function MoversPanel({
  players,
  onToggle,
  selectedIds,
  direction,
  emptyLabel
}: {
  players: PlayerLatest[];
  onToggle: (p: PlayerLatest) => void;
  selectedIds: Set<number>;
  direction: "rising" | "falling";
  emptyLabel: string;
}) {
  const accent = direction === "rising" ? "var(--good-text)" : "var(--critical)";

  if (players.length === 0) {
    return (
      <div className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {players.slice(0, 8).map((p) => {
        const active = selectedIds.has(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors"
            style={{
              background: active ? "color-mix(in srgb, var(--series-1) 10%, transparent)" : "transparent",
              border: `1px solid ${active ? "var(--series-1)" : "transparent"}`
            }}
          >
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              {p.team_short}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {p.web_name}
              </span>
              <span className="truncate text-[11px] tabular" style={{ color: "var(--text-muted)" }}>
                {formatPct(p.selected_by_percent)} owned · {formatPrice(p.now_cost)}
              </span>
            </span>
            <span className="flex flex-none flex-col items-end gap-0.5">
              <DeltaBadge value={p.delta} />
              {p.delta_relative !== null && Number.isFinite(p.delta_relative) && (
                <span className="text-[10px] tabular" style={{ color: accent }}>
                  {p.delta_relative > 0 ? "+" : ""}
                  {p.delta_relative.toFixed(0)}% rel.
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
