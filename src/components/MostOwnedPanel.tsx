"use client";

import type { PlayerLatest } from "@/lib/types";
import { formatPct, formatPrice } from "@/lib/format";
import DeltaBadge from "./DeltaBadge";

export default function MostOwnedPanel({
  players,
  onToggle,
  selectedIds
}: {
  players: PlayerLatest[];
  onToggle: (p: PlayerLatest) => void;
  selectedIds: Set<number>;
}) {
  const top = players.slice().sort((a, b) => b.selected_by_percent - a.selected_by_percent).slice(0, 10);
  const max = top[0]?.selected_by_percent || 1;

  return (
    <div className="flex flex-col gap-1.5">
      {top.map((p, i) => {
        const active = selectedIds.has(p.id);
        const width = Math.max(4, (p.selected_by_percent / max) * 100);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p)}
            className="group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors"
            style={{
              background: active ? "color-mix(in srgb, var(--series-1) 10%, transparent)" : "transparent",
              border: `1px solid ${active ? "var(--series-1)" : "transparent"}`
            }}
          >
            <span className="w-4 flex-none text-xs font-medium tabular" style={{ color: "var(--text-muted)" }}>
              {i + 1}
            </span>
            <span className="flex w-20 flex-none flex-col overflow-hidden sm:w-32 md:w-40">
              <span className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {p.web_name}
              </span>
              <span className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                {p.team_short} · {p.position}
                <span className="hidden sm:inline"> · {formatPrice(p.now_cost)}</span>
              </span>
            </span>
            <span
              className="relative hidden h-5 flex-1 overflow-hidden rounded sm:block"
              style={{ background: "var(--surface-2)" }}
            >
              <span
                className="absolute inset-y-0 left-0 rounded transition-all"
                style={{ width: `${width}%`, background: "var(--seq-400)" }}
              />
            </span>
            <span
              className="ml-auto w-12 flex-none text-right text-sm font-semibold tabular sm:ml-0 sm:w-14"
              style={{ color: "var(--text-primary)" }}
            >
              {formatPct(p.selected_by_percent)}
            </span>
            <span className="w-14 flex-none text-right sm:w-20">
              <DeltaBadge value={p.delta} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
