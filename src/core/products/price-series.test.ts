import assert from "node:assert/strict";
import { test } from "node:test";
import { hasTrend, priceSeries } from "./price-series.ts";

// Newest first, as v_price_history is read (observed_on desc, created_at desc).
const history = [
  { observed_on: "2026-11-27", supplier: "Nacional", price: 99 },
  { observed_on: "2026-11-27", supplier: "Nacional", price: 125.5 },
  { observed_on: "2026-11-20", supplier: "Bravo", price: 110 },
  { observed_on: "2026-11-20", supplier: "Nacional", price: 120 },
  { observed_on: null, supplier: "Nacional", price: 1 },
  { observed_on: "2026-11-19", supplier: null, price: null },
];

test("one series per supplier, alphabetical, with the latest price of each day", () => {
  assert.deepEqual(priceSeries(history), [
    { name: "Bravo", points: [{ day: "2026-11-20", value: 110 }] },
    {
      name: "Nacional",
      points: [
        { day: "2026-11-20", value: 120 },
        { day: "2026-11-27", value: 99 },
      ],
    },
  ]);
});

test("a trend needs two different days", () => {
  assert.equal(hasTrend(priceSeries(history)), true);
  assert.equal(hasTrend(priceSeries(history.slice(0, 2))), false);
  assert.equal(hasTrend([]), false);
});
