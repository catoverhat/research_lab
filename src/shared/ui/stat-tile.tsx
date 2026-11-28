import type { ReactNode } from "react";

export type Trend = { text: string; better: boolean | null };

/**
 * A headline figure. The change against the reference carries an arrow and a word,
 * never color alone; `better` says whether that change is good (null = neutral).
 */
export function StatTile({ label, value, detail, trend }: { label: string; value: ReactNode; detail?: ReactNode; trend?: Trend }) {
  const tone = trend?.better == null ? "text-stone-600" : trend.better ? "text-green-800" : "text-red-700";
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-sm text-stone-600">{label}</p>
      <p className="text-2xl font-semibold text-stone-900">{value}</p>
      {detail && <p className="text-xs text-stone-600">{detail}</p>}
      {trend && (
        <p className={`text-sm ${tone}`}>
          {trend.text}
          {trend.better != null && <span className="sr-only">{trend.better ? " (mejor)" : " (peor)"}</span>}
        </p>
      )}
    </div>
  );
}

/**
 * "▲ +1,0 vs referencia" with the right tone for a metric where up is good (or bad).
 * `judged` false keeps it neutral: the data is too thin or partial to call it better or worse.
 */
export function trendOf(diff: number | null, formatted: string, upIsGood: boolean, judged = true): Trend | undefined {
  if (diff == null) return undefined;
  if (diff === 0) return { text: "= igual que la referencia", better: null };
  const arrow = diff > 0 ? "▲" : "▼";
  return { text: `${arrow} ${formatted} vs referencia`, better: judged ? diff > 0 === upIsGood : null };
}
