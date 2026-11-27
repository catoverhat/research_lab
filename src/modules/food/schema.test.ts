import assert from "node:assert/strict";
import { test } from "node:test";
import { experimentSchema, isRecorded, newExperimentSchema } from "./experiments/schema.ts";
import { formulationSchema } from "./formulations/schema.ts";

const recipe = { name: "", status: "draft", servings: "", serving_size: "", serving_unit: "", instructions: "", notes: "" };
const run = { hypothesis_id: "", status: "planned", performed_on: "", conditions: "", observations: "" };

test("a serving size needs its unit, and the other way round", () => {
  assert.equal(formulationSchema.safeParse(recipe).success, true);
  assert.equal(formulationSchema.safeParse({ ...recipe, serving_size: "250", serving_unit: "ml" }).success, true);
  const sizeOnly = formulationSchema.safeParse({ ...recipe, serving_size: "250" });
  assert.equal(sizeOnly.success, false);
  assert.deepEqual(sizeOnly.error?.issues[0].path, ["serving_size"]);
  assert.equal(formulationSchema.safeParse({ ...recipe, serving_unit: "ml" }).success, false);
});

test("blank recipe fields are stored as null", () => {
  const parsed = formulationSchema.parse(recipe);
  assert.equal(parsed.name, null);
  assert.equal(parsed.servings, null);
  assert.equal(parsed.serving_unit, null);
});

test("what was run has a date; what is planned may not", () => {
  assert.equal(experimentSchema.safeParse(run).success, true);
  assert.equal(experimentSchema.safeParse({ ...run, status: "cancelled" }).success, true);
  assert.equal(experimentSchema.safeParse({ ...run, status: "completed" }).success, false);
  assert.equal(experimentSchema.safeParse({ ...run, status: "failed" }).success, false);
  assert.equal(experimentSchema.safeParse({ ...run, status: "completed", performed_on: "2026-11-27" }).success, true);
  assert.equal(newExperimentSchema.safeParse({ ...run, formulation_id: "" }).success, false);
});

test("only completed and failed runs freeze a recipe", () => {
  assert.deepEqual(["planned", "completed", "failed", "cancelled", "toString"].map(isRecorded), [
    false,
    true,
    true,
    false,
    false,
  ]);
});
