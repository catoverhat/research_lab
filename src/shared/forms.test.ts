import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import {
  dbError,
  nonNegativeNumber,
  oneOf,
  optionalBoolean,
  optionalId,
  optionalPositiveNumber,
  optionalText,
  parseForm,
  positiveNumber,
} from "./forms.ts";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

test("blank inputs become null, never empty strings or zero", () => {
  assert.equal(optionalText.parse("   "), null);
  assert.equal(optionalText.parse(" Munné "), "Munné");
  assert.equal(optionalPositiveNumber.parse(""), null);
  assert.equal(optionalPositiveNumber.parse("8.5"), 8.5);
  assert.equal(optionalId.parse(""), null);
  assert.equal(optionalBoolean.parse(""), null);
  assert.equal(optionalBoolean.parse("false"), false);
});

test("numbers are validated, not coerced", () => {
  assert.equal(positiveNumber.safeParse("0").success, false);
  assert.equal(positiveNumber.safeParse("abc").success, false);
  assert.equal(positiveNumber.safeParse("").success, false);
  assert.equal(nonNegativeNumber.parse("0"), 0);
  assert.equal(nonNegativeNumber.safeParse("-1").success, false);
});

test("parseForm returns data or field errors", () => {
  const schema = z.object({ name: z.string().min(1), unit: oneOf({ g: "g", ml: "ml" }) });
  assert.deepEqual(parseForm(schema, form({ name: "Leche", unit: "ml", $ACTION_ID: "x" })).data, {
    name: "Leche",
    unit: "ml",
  });
  const bad = parseForm(schema, form({ name: "", unit: "kg" }));
  assert.equal(bad.data, undefined);
  assert.ok(bad.state?.fieldErrors?.name);
  assert.ok(bad.state?.fieldErrors?.unit);
});

test("database errors map to form messages", () => {
  assert.match(
    dbError({ code: "23503", message: 'update or delete on table "products" violates foreign key constraint' }).error!,
    /No se puede borrar/,
  );
  assert.match(
    dbError({ code: "23503", message: 'insert or update on table "product_prices" violates foreign key constraint' }).error!,
    /ya no existe/,
  );
  assert.match(
    dbError({ code: "23514", message: "formulation already has recorded experiments; create a new version instead" }).error!,
    /versión nueva/,
  );
});
