import assert from "node:assert/strict";
import { test } from "node:test";
import { priceSchema, productInUse } from "./schema.ts";

const price = { price: "125.50", observed_on: "2026-11-27", supplier: "", in_stock: "", source_url: "", notes: "" };

test("a price takes no currency from the form (the column default, DOP, applies)", () => {
  const parsed = priceSchema.parse({ ...price, currency: "USD" });
  assert.equal("currency" in parsed, false);
  assert.equal(parsed.price, 125.5);
  assert.equal(parsed.supplier, null);
});

test("the source URL must be http(s)", () => {
  assert.equal(priceSchema.parse({ ...price, source_url: "https://example.com/p" }).source_url, "https://example.com/p");
  assert.equal(priceSchema.safeParse({ ...price, source_url: "javascript:alert(1)" }).success, false);
  assert.equal(priceSchema.safeParse({ ...price, source_url: "not a url" }).success, false);
});

test("a product is in use when it has prices or appears in recipes", () => {
  const counts = (prices: number, recipes: number) => ({
    product_prices: [{ count: prices }],
    formulation_ingredients: [{ count: recipes }],
  });
  assert.equal(productInUse(counts(0, 0)), false);
  assert.equal(productInUse(counts(2, 0)), true);
  assert.equal(productInUse(counts(0, 1)), true);
  assert.equal(productInUse({ product_prices: [], formulation_ingredients: [] }), false);
});
