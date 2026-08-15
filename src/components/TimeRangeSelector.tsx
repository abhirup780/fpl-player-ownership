"use client";

import type { TimeRange } from "@/lib/types";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "1h", label: "1H" },
  { value: "6h", label: "6H" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "gw", label: "GW" },
  { value: "season", label: "Season" }
];

export default function TimeRangeSelector({
  value,
  onChange
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div
      className="flex max-w-full flex-wrap items-center gap-0.5 rounded-lg p-0.5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      role="tablist"
      aria-label="Time range"
    >
      {RANGES.map((r) => {
        const active = r.value === value;
        return (
          <button
            key={r.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.value)}
            className="rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:px-2.5"
            style={{
              background: active ? "var(--series-1)" : "transparent",
              color: active ? "#ffffff" : "var(--text-secondary)"
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
