import assert from "node:assert/strict";
import { test } from "node:test";
import { dash, date, missing, money, productLabel, unitLabel } from "./format.ts";

test("stored days show as dd/mm/yyyy, whatever the server's time zone", () => {
  assert.equal(date("2026-11-27"), "27/11/2026");
  assert.equal(date("2026-01-01"), "01/01/2026");
  assert.equal(date(null), dash);
  assert.equal(date(null, "Sin fecha"), "Sin fecha");
  assert.equal(date("not a date"), "not a date", "an unexpected value is shown, not thrown");
});

test("unknown values are a dash, never zero", () => {
  assert.equal(money(null), dash);
  assert.equal(unitLabel(null), dash);
});

test("units and counts read naturally", () => {
  assert.equal(unitLabel("unit"), "ud.");
  assert.equal(unitLabel("ml"), "ml");
  assert.equal(productLabel({ brand: null, name: "Huevos", package_size: 12, unit: "unit" }), "Huevos 12 ud.");
  assert.equal(missing(1, "precio"), "falta 1 precio");
  assert.equal(missing(3, "precio"), "faltan 3 precios");
});
