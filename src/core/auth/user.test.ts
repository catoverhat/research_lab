import assert from "node:assert/strict";
import { test } from "node:test";
import { displayName, savedNameOf } from "./user.ts";

test("the saved name wins; without one, what goes before the @", () => {
  assert.equal(displayName({ email: "ana.perez@example.com", user_metadata: { name: " Ana " } }), "Ana");
  assert.equal(displayName({ email: "ana.perez@example.com", user_metadata: { name: "  " } }), "ana.perez");
  assert.equal(displayName({ email: "ana.perez@example.com", user_metadata: { name: 42 } }), "ana.perez");
  assert.equal(displayName(undefined), "");
  assert.equal(savedNameOf({ email: "ana@example.com" }), null);
});
