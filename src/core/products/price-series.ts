export type PriceRow = { observed_on: string | null; supplier: string | null; price: number | null };
export type PriceSeries = { name: string; points: { day: string; value: number }[] };

/**
 * One series per supplier (alphabetical, so a supplier keeps its color), each with the latest
 * price of every day, oldest day first. `history` comes newest first, as the price views order it,
 * so the first price seen for a day is the latest one (same rule as v_product_unit_cost).
 */
export function priceSeries(history: PriceRow[]): PriceSeries[] {
  const bySupplier = new Map<string, Map<string, number>>();
  for (const h of history) {
    if (!h.observed_on || h.price == null) continue;
    const name = h.supplier ?? "Sin proveedor";
    const days = bySupplier.get(name) ?? new Map<string, number>();
    if (!days.has(h.observed_on)) days.set(h.observed_on, h.price);
    bySupplier.set(name, days);
  }
  return [...bySupplier]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([name, days]) => ({
      name,
      points: [...days].map(([day, value]) => ({ day, value })).sort((a, b) => a.day.localeCompare(b.day)),
    }));
}

/** A trend needs at least two different days; one day is a table, not a line. */
export const hasTrend = (series: PriceSeries[]) => new Set(series.flatMap((s) => s.points.map((p) => p.day))).size >= 2;
