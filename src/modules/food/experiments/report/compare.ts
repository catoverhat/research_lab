// Pure comparison logic for the experiment report and the comparator (no I/O; tested).

export type Line = { productId: string; label: string; unit: string; quantity: number };

export type CompositionChange = {
  productId: string;
  label: string;
  unit: string;
  current: number | null;
  reference: number | null;
  change: "added" | "removed" | "changed" | "same";
};

/** What changes between a recipe and its reference: the experiment's independent variables. */
export function compositionDiff(current: Line[], reference: Line[]): CompositionChange[] {
  const byProduct = new Map<string, CompositionChange>();
  for (const r of reference)
    byProduct.set(r.productId, { productId: r.productId, label: r.label, unit: r.unit, current: null, reference: r.quantity, change: "removed" });
  for (const c of current) {
    const ref = byProduct.get(c.productId);
    const change = !ref ? "added" : ref.reference === c.quantity ? "same" : "changed";
    byProduct.set(c.productId, {
      productId: c.productId,
      label: c.label,
      unit: c.unit,
      current: c.quantity,
      reference: ref?.reference ?? null,
      change,
    });
  }
  const order = { changed: 0, added: 1, removed: 2, same: 3 };
  return [...byProduct.values()].sort((a, b) => order[a.change] - order[b.change] || a.label.localeCompare(b.label, "es"));
}

/**
 * Whether a difference can be called better or worse: both sides need at least two evaluations
 * (one has no spread) and complete data. Otherwise the difference is shown, but neutral.
 */
export const comparable = (a: { evaluations?: number | null; partial?: boolean }, b: { evaluations?: number | null; partial?: boolean }) =>
  !a.partial && !b.partial && (a.evaluations ?? 2) >= 2 && (b.evaluations ?? 2) >= 2;

/** Difference to the reference; null when either side is unknown (never a made-up 0). */
export function delta(current: number | null | undefined, reference: number | null | undefined) {
  if (current == null || reference == null) return null;
  const abs = current - reference;
  return { abs, pct: reference === 0 ? null : abs / reference };
}

export type AttributeStats = {
  attribute: string;
  evaluations: number;
  avg: number;
  min: number;
  max: number;
  stddev: number | null;
};

export type SensoryRow = AttributeStats & { reference: number | null };

/** One row per attribute scored in this run, with the reference's mean when it has one. "overall" leads. */
export function sensoryRows(current: AttributeStats[], reference: AttributeStats[]): SensoryRow[] {
  const refByAttr = new Map(reference.map((r) => [r.attribute, r.avg]));
  return current
    .map((c) => ({ ...c, reference: refByAttr.get(c.attribute) ?? null }))
    .sort((a, b) => Number(b.attribute === "overall") - Number(a.attribute === "overall") || a.attribute.localeCompare(b.attribute, "es"));
}

/** Rows (products) by columns (experiments): the quantity of each product in each compared recipe. */
export function compositionMatrix(columns: { key: string; lines: Line[] }[]) {
  const rows = new Map<string, { productId: string; label: string; unit: string; quantities: Record<string, number | null> }>();
  for (const col of columns)
    for (const l of col.lines) {
      const row = rows.get(l.productId) ?? { productId: l.productId, label: l.label, unit: l.unit, quantities: {} };
      row.quantities[col.key] = l.quantity;
      rows.set(l.productId, row);
    }
  for (const row of rows.values()) for (const col of columns) row.quantities[col.key] ??= null;
  return [...rows.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
}
