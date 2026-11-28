"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { date, money, num } from "@/shared/format";
import { chartColors as c, maxSeries } from "./palette";
import { ChartTooltip } from "./tooltip";

/**
 * Up to four series over time (e.g. a product's price per supplier). Days are stored days
 * ("2026-11-27"). Series keep their color by position: the caller keeps that order stable.
 */
export function TimeLine({
  series,
  unit,
  caption,
}: {
  series: { name: string; points: { day: string; value: number }[] }[];
  unit: "money" | "number";
  caption: string;
}) {
  const shown = series.slice(0, maxSeries);
  const days = [...new Set(shown.flatMap((s) => s.points.map((p) => p.day)))].sort();
  // One row per day; a series without a value that day stays null (the step carries the last value).
  const rows = days.map((day) => ({
    t: Date.parse(day),
    ...Object.fromEntries(shown.map((s, i) => [`s${i}`, s.points.find((p) => p.day === day)?.value ?? null])),
  }));
  const format = (v: number) => (unit === "money" ? money(v) : num(v));
  const tick = (v: number) => (unit === "money" ? money(v, "DOP", 0) : num(v, 0));
  const day = (t: number) => date(new Date(t).toISOString().slice(0, 10));
  const observations = shown.reduce((n, s) => n + s.points.length, 0);

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm text-stone-600">
        {caption} · {observations} {observations === 1 ? "observación" : "observaciones"}
      </figcaption>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={rows.map((r) => r.t)}
              tickFormatter={day}
              stroke={c.axis}
              tick={{ fill: c.inkSecondary, fontSize: 11 }}
              padding={{ left: 24, right: 24 }}
            />
            <YAxis tickFormatter={tick} stroke={c.axis} tick={{ fill: c.inkSecondary, fontSize: 11 }} width={72} domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: c.axis, strokeWidth: 1 }}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload}
                  title={typeof props.label === "number" ? day(props.label) : undefined}
                  format={format}
                />
              )}
            />
            {shown.length > 1 && (
              <Legend
                iconType="plainline"
                wrapperStyle={{ fontSize: 13 }}
                formatter={(value) => <span style={{ color: c.ink }}>{value}</span>}
              />
            )}
            {shown.map((s, i) => (
              <Line
                key={s.name}
                // A value holds until the next one (a price stays until it changes): steps, not slopes.
                type="stepAfter"
                dataKey={`s${i}`}
                name={s.name}
                stroke={c.series[i]}
                strokeWidth={2}
                connectNulls
                dot={{ r: 4, fill: c.series[i], stroke: c.surface, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: c.series[i], stroke: c.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
