"use client";

export default function StatTile({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="min-w-0 flex-1 rounded-xl p-3 sm:min-w-[140px] sm:p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tabular" style={{ color: accent ?? "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
