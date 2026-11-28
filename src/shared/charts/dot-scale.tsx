import { num } from "@/shared/format";
import { chartColors as c } from "./palette";

export type DotRow = { label: string; value: number; min: number; max: number; reference: number | null };

/**
 * Scores on a fixed scale (0-10), one row per attribute: the mean as a dot, its range (min-max) as a
 * thin line and, with a reference, a dumbbell from the reference to this run ("before -> after").
 * Server-rendered SVG: prints as is. Native <title> tooltips on hover; the table next to it is the full twin.
 */
export function DotScale({
  rows,
  referenceLabel,
  caption,
  scale = 10,
}: {
  rows: DotRow[];
  referenceLabel?: string;
  caption: string;
  scale?: number;
}) {
  const W = 640, L = 130, R = 48, rowH = 40, axisH = 26;
  const plotW = W - L - R;
  const H = rows.length * rowH + axisH;
  const x = (v: number) => L + (v / scale) * plotW;
  const ticks = Array.from({ length: scale / 2 + 1 }, (_, i) => i * 2);
  const hasReference = rows.some((r) => r.reference != null);
  const summary = (r: DotRow) =>
    `${r.label}: media ${num(r.value, 1)} (de ${num(r.min, 1)} a ${num(r.max, 1)})${r.reference != null ? `, referencia ${num(r.reference, 1)}` : ""}`;

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm text-stone-600">{caption}</figcaption>
      {hasReference && (
        <p className="flex flex-wrap gap-4 text-sm text-stone-700" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={c.series[0]} /></svg>
            Este experimento
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={c.reference} /></svg>
            Referencia{referenceLabel && `: ${referenceLabel}`}
          </span>
        </p>
      )}
      {/* One image for assistive tech: its label reads every row (children of role=img are not reachable). */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${caption}. ${rows.map(summary).join("; ")}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={H - axisH} stroke={c.grid} strokeWidth={1} />
            <text x={x(t)} y={H - 8} textAnchor="middle" fontSize={11} fill={c.inkSecondary} className="tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = i * rowH + rowH / 2;
          return (
            <g key={r.label}>
              {/* Mouse hover tooltip over the whole row. */}
              <title>{summary(r)}</title>
              <rect x={0} y={y - rowH / 2} width={W} height={rowH} fill="transparent" />
              <text x={L - 10} y={y + 4} textAnchor="end" fontSize={13} fill={c.ink}>
                {r.label}
              </text>
              {r.max > r.min && (
                <line x1={x(r.min)} x2={x(r.max)} y1={y} y2={y} stroke={c.series[0]} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
              )}
              {r.reference != null && (
                <>
                  <line x1={x(r.reference)} x2={x(r.value)} y1={y} y2={y} stroke={c.axis} strokeWidth={2} />
                  <circle cx={x(r.reference)} cy={y} r={5} fill={c.reference} stroke={c.surface} strokeWidth={2} />
                </>
              )}
              <circle cx={x(r.value)} cy={y} r={6} fill={c.series[0]} stroke={c.surface} strokeWidth={2} />
              <text x={W - R + 10} y={y + 4} fontSize={13} fontWeight={600} fill={c.ink} className="tabular-nums">
                {num(r.value, 1)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
