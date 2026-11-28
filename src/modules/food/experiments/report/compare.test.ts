import assert from "node:assert/strict";
import { test } from "node:test";
import { comparable, compositionDiff, compositionMatrix, delta, sensoryRows } from "./compare.ts";

const line = (productId: string, quantity: number, unit = "g") => ({ productId, label: productId, unit, quantity });

test("compositionDiff names what changed against the reference, changes first", () => {
  const diff = compositionDiff([line("cacao", 25), line("leche", 250, "ml"), line("canela", 1)], [line("cacao", 20), line("leche", 250, "ml"), line("azúcar", 10)]);
  assert.deepEqual(
    diff.map((d) => [d.label, d.change, d.current, d.reference]),
    [
      ["cacao", "changed", 25, 20],
      ["canela", "added", 1, null],
      ["azúcar", "removed", null, 10],
      ["leche", "same", 250, 250],
    ],
  );
});

test("a difference is better/worse only with two evaluations per side and complete data", () => {
  assert.equal(comparable({ evaluations: 2 }, { evaluations: 3 }), true);
  assert.equal(comparable({ evaluations: 2 }, { evaluations: 1 }), false);
  assert.equal(comparable({ partial: false }, { partial: true }), false);
  assert.equal(comparable({}, {}), true);
});

test("delta is null when a side is unknown, and has no percentage over zero", () => {
  assert.equal(delta(null, 5), null);
  assert.equal(delta(5, undefined), null);
  assert.deepEqual(delta(7.5, 6), { abs: 1.5, pct: 0.25 });
  assert.deepEqual(delta(3, 0), { abs: 3, pct: null });
});

test("sensoryRows puts overall first and pairs each attribute with the reference mean", () => {
  const stats = (attribute: string, avg: number) => ({ attribute, evaluations: 2, avg, min: avg, max: avg, stddev: null });
  const rows = sensoryRows([stats("textura", 6), stats("overall", 7), stats("amargor", 4)], [stats("overall", 6), stats("textura", 5)]);
  assert.deepEqual(
    rows.map((r) => [r.attribute, r.avg, r.reference]),
    [
      ["overall", 7, 6],
      ["amargor", 4, null],
      ["textura", 6, 5],
    ],
  );
});

test("compositionMatrix fills a product missing from a recipe with null, not 0", () => {
  const m = compositionMatrix([
    { key: "a", lines: [line("cacao", 20), line("leche", 250, "ml")] },
    { key: "b", lines: [line("cacao", 25)] },
  ]);
  assert.deepEqual(
    m.map((r) => [r.label, r.quantities.a, r.quantities.b]),
    [
      ["cacao", 20, 25],
      ["leche", 250, null],
    ],
  );
});
