"use client";

import { formatDelta } from "@/lib/format";

export default function DeltaBadge({ value, size = "sm" }: { value: number | null; size?: "sm" | "md" }) {
  const flat = value === null || Math.abs(value) < 0.02;
  const rising = !flat && (value as number) > 0;
  const color = flat ? "var(--text-muted)" : rising ? "var(--good-text)" : "var(--critical)";
  const bg = flat ? "transparent" : rising ? "color-mix(in srgb, var(--good) 14%, transparent)" : "color-mix(in srgb, var(--critical) 14%, transparent)";
  const arrow = flat ? "→" : rising ? "↑" : "↓";
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded font-medium tabular ${pad}`}
      style={{ color, background: bg }}
    >
      <span aria-hidden>{arrow}</span>
      {formatDelta(value)}
    </span>
  );
}
