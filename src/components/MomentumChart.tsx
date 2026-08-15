"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import type { PlayerLatest } from "@/lib/types";
import { formatPct, formatPrice } from "@/lib/format";

function momentumColor(delta: number | null): string {
  if (delta === null || Math.abs(delta) < 0.05) return "var(--text-muted)";
  if (delta > 0) {
    return delta > 1 ? "var(--div-blue, var(--series-1))" : "var(--good-text)";
  }
  return "var(--critical)";
}

function CustomDot(props: any) {
  const { cx, cy, payload, r } = props;
  return <circle cx={cx} cy={cy} r={r} fill={momentumColor(payload.delta)} fillOpacity={0.75} stroke="var(--surface)" strokeWidth={1} />;
}

function MomentumTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const p: PlayerLatest = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
    >
      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
        {p.web_name} <span style={{ color: "var(--text-muted)" }}>· {p.team_short}</span>
      </div>
      <div className="mt-1 tabular" style={{ color: "var(--text-secondary)" }}>
        {formatPct(p.selected_by_percent)} owned · {formatPrice(p.now_cost)}
      </div>
      <div className="tabular" style={{ color: momentumColor(p.delta) }}>
        {p.delta !== null ? `${p.delta > 0 ? "+" : ""}${p.delta.toFixed(2)}pp this range` : "no history yet"}
      </div>
    </div>
  );
}

export default function MomentumChart({ players }: { players: PlayerLatest[] }) {
  const [minOwn, setMinOwn] = useState(0.5);

  const data = useMemo(
    () => players.filter((p) => p.selected_by_percent >= minOwn && p.delta !== null),
    [players, minOwn]
  );

  return (
    <div className="fade-in">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Ownership % vs. momentum this range · bubble size = price
        </p>
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Min ownership
          <input
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={minOwn}
            onChange={(e) => setMinOwn(Number(e.target.value))}
            className="accent-[var(--series-1)]"
          />
          <span className="tabular w-9">{minOwn.toFixed(1)}%</span>
        </label>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis
            type="number"
            dataKey="selected_by_percent"
            name="Ownership"
            unit="%"
            stroke="var(--axis)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            scale="log"
            domain={["auto", "auto"]}
          />
          <YAxis
            type="number"
            dataKey="delta"
            name="Momentum"
            stroke="var(--axis)"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ZAxis type="number" dataKey="now_cost" range={[24, 320]} />
          <ReferenceLine y={0} stroke="var(--axis)" strokeDasharray="3 3" />
          <Tooltip content={<MomentumTooltip />} cursor={{ stroke: "var(--axis)", strokeDasharray: "3 3" }} />
          <Scatter data={data} shape={<CustomDot />} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap items-center gap-4 px-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--div-blue, var(--series-1))" }} />
          Strong riser
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--good-text)" }} />
          Rising
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--text-muted)" }} />
          Flat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--critical)" }} />
          Falling
        </span>
      </div>
    </div>
  );
}
