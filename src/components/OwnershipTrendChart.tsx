"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { HistorySeries } from "@/lib/useApi";
import { formatClock, formatDateShort, formatPct, seriesColor } from "@/lib/format";
import type { TimeRange } from "@/lib/types";

interface TrackedPlayer {
  id: number;
  web_name: string;
}

function CustomTooltip({ active, payload, label, players }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", minWidth: 160 }}
    >
      <div className="mb-1.5 font-medium tabular" style={{ color: "var(--text-secondary)" }}>
        {formatDateShort(label)} · {formatClock(label)}
      </div>
      <div className="flex flex-col gap-1">
        {payload
          .slice()
          .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))
          .map((p: any) => {
            const player = players.find((pl: TrackedPlayer) => String(pl.id) === p.dataKey);
            return (
              <div key={p.dataKey} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span style={{ color: "var(--text-primary)" }}>{player?.web_name ?? p.dataKey}</span>
                </span>
                <span className="tabular font-medium" style={{ color: "var(--text-primary)" }}>
                  {p.value != null ? formatPct(p.value) : "—"}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default function OwnershipTrendChart({
  series,
  players,
  range
}: {
  series: HistorySeries[];
  players: TrackedPlayer[];
  range: TimeRange;
}) {
  const merged = useMemo(() => {
    const byTs = new Map<number, Record<string, number | null>>();
    for (const s of series) {
      for (const p of s.points) {
        const row = byTs.get(p.ts) ?? { ts: p.ts };
        row[String(s.player_id)] = p.selected_by_percent;
        byTs.set(p.ts, row);
      }
    }
    return Array.from(byTs.values()).sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [series]);

  if (players.length === 0) {
    return (
      <div
        className="flex h-72 items-center justify-center rounded-xl text-sm"
        style={{ background: "var(--surface)", border: "1px dashed var(--border-strong)", color: "var(--text-muted)" }}
      >
        Search a player above and add them to the chart to see their ownership trend.
      </div>
    );
  }

  if (merged.length < 2) {
    return (
      <div
        className="flex h-72 items-center justify-center rounded-xl text-sm"
        style={{ background: "var(--surface)", border: "1px dashed var(--border-strong)", color: "var(--text-muted)" }}
      >
        Not enough history yet for this range — data accumulates as snapshots are taken.
      </div>
    );
  }

  const showDots = merged.length < 60;
  const dateFmt = range === "live" || range === "1h" || range === "6h" ? formatClock : formatDateShort;

  return (
    <div className="fade-in">
      <ResponsiveContainer width="100%" height={288}>
        <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => dateFmt(v)}
            stroke="var(--axis)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            stroke="var(--axis)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip players={players} />} />
          {players.map((p, i) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={String(p.id)}
              name={p.web_name}
              stroke={seriesColor(i)}
              strokeWidth={2}
              dot={showDots ? { r: 2, strokeWidth: 0, fill: seriesColor(i) } : false}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        {players.map((p, i) => (
          <span key={p.id} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: seriesColor(i) }} />
            {p.web_name}
          </span>
        ))}
      </div>
    </div>
  );
}
