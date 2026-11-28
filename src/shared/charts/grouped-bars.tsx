"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { num } from "@/shared/format";
import { chartColors as c, maxSeries } from "./palette";
import { ChartTooltip } from "./tooltip";

/**
 * Categories (rows) compared across up to four series, as horizontal grouped bars on one scale.
 * Series keep their color by position in `series` (the caller keeps that order stable).
 */
export function GroupedBars({
  rows,
  series,
  caption,
  max,
}: {
  rows: Record<string, string | number | null>[];
  series: { key: string; label: string }[];
  caption: string;
  max: number;
}) {
  const shown = series.slice(0, maxSeries);
  const height = rows.length * (shown.length * 14 + 22) + 64;
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm text-stone-600">{caption}</figcaption>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" barGap={2} margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={c.grid} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, max]}
              ticks={Array.from({ length: Math.floor(max / 2) + 1 }, (_, i) => i * 2)}
              stroke={c.axis}
              tick={{ fill: c.inkSecondary, fontSize: 11 }}
            />
            <YAxis type="category" dataKey="label" width={110} stroke={c.axis} tick={{ fill: c.ink, fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: c.grid, fillOpacity: 0.5 }}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload}
                  title={String(props.label ?? "")}
                  format={(v) => num(v, 1)}
                />
              )}
            />
            {/* Legend in the series order (not alphabetical) and in ink: text never wears the series color. */}
            <Legend
              iconType="rect"
              wrapperStyle={{ fontSize: 13 }}
              itemSorter={(item) => shown.findIndex((s) => s.label === item.value)}
              formatter={(value) => <span style={{ color: c.ink }}>{value}</span>}
            />
            {shown.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={c.series[i]}
                barSize={12}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
