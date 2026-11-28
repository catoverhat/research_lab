"use client";

import { chartColors as c } from "./palette";

// Recharts allows a function as dataKey; here it is only used as the row key.
type Entry = { name?: string | number; value?: unknown; color?: string; dataKey?: unknown };

/** Recharts tooltip body: value first (strong), series name second, a line key in the series color. */
export function ChartTooltip({
  active,
  payload,
  title,
  format,
}: {
  active?: boolean;
  payload?: readonly Entry[];
  title?: string;
  format: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm">
      {title && <p className="mb-1 text-stone-600">{title}</p>}
      {payload.map((p) => (
        <p key={String(p.name ?? p.dataKey)} className="flex items-center gap-2">
          <svg width="14" height="4" aria-hidden="true">
            <line x1="0" x2="14" y1="2" y2="2" stroke={p.color ?? c.series[0]} strokeWidth="2" />
          </svg>
          <strong className="tabular-nums">{typeof p.value === "number" ? format(p.value) : "—"}</strong>
          {payload.length > 1 && <span className="text-stone-600">{p.name}</span>}
        </p>
      ))}
    </div>
  );
}
