export function formatPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`;
}

export function formatDelta(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  // FPL only reports ownership to 1 decimal place, so round there — and drop
  // a trailing ".0" (e.g. "+1pp" not "+1.0pp") since it adds no information.
  const rounded = Math.round(v * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  const text = rounded === 0 ? "0" : Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${sign}${text}pp`;
}

export function formatPrice(tenths: number): string {
  return `£${(tenths / 10).toFixed(1)}m`;
}

export function formatTimeAgo(ts: number | null, now = Date.now()): string {
  if (!ts) return "never";
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 45) return "just now";
  if (diffSec < 90) return "1 min ago";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)"
];

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

export const POSITION_ORDER = ["GKP", "DEF", "MID", "FWD"];
