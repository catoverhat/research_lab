import assert from "node:assert/strict";
import { test } from "node:test";
import { attributeKey, attributeLabel, isLiking, parseEvaluation, scaleHint } from "./sensory.ts";

const form = (entries: [string, string][]) => {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
};

test("reads listed and extra attributes; blank scores are not scored", () => {
  const { data } = parseEvaluation(
    form([
      ["evaluator", " Ana "],
      ["score__overall", "7.5"],
      ["score__dulzor", ""],
      ["score__amargor", "0"],
      ["extra_attribute_1", " Cremosidad "],
      ["extra_score_1", "6"],
      ["extra_attribute_2", ""],
      ["extra_score_2", ""],
      ["comment", "  "],
    ]),
  );
  assert.deepEqual(data, {
    evaluator: "Ana",
    comment: null,
    scores: [
      { attribute: "overall", score: 7.5 },
      { attribute: "amargor", score: 0 },
      { attribute: "cremosidad", score: 6 },
    ],
  });
});

test("rejects out-of-range scores, unnamed extras, repeats and empty evaluations", () => {
  assert.deepEqual(parseEvaluation(form([["evaluator", "Ana"], ["score__overall", "11"]])).fieldErrors, {
    score__overall: ["Entre 0 y 10"],
  });
  assert.deepEqual(parseEvaluation(form([["evaluator", "Ana"], ["extra_score_1", "5"]])).fieldErrors, {
    extra_attribute_1: ["Pon nombre al atributo"],
  });
  assert.deepEqual(
    parseEvaluation(form([["evaluator", "Ana"], ["score__overall", "7"], ["extra_attribute_1", "Global"], ["extra_score_1", "8"]]))
      .fieldErrors,
    { extra_score_1: ["Atributo repetido"] },
  );
  assert.deepEqual(parseEvaluation(form([["evaluator", "Ana"]])).fieldErrors, { evaluator: ["Pon al menos una nota"] });
  // Listed attributes are normalized like the extras, and a nameless one is rejected.
  assert.deepEqual(parseEvaluation(form([["evaluator", "Ana"], ["score__Sabor", "6"]])).data?.scores, [
    { attribute: "sabor", score: 6 },
  ]);
  assert.deepEqual(parseEvaluation(form([["evaluator", "Ana"], ["score__ ", "6"]])).fieldErrors, {
    "score__ ": ["Atributo sin nombre"],
  });
  assert.ok(parseEvaluation(form([["score__overall", "7"]])).fieldErrors?.evaluator);
});

test("overall is the global score", () => {
  assert.equal(attributeKey(" GLOBAL "), "overall");
  assert.equal(attributeLabel("overall"), "Global");
  assert.equal(attributeLabel("amargor"), "Amargor");
});

test("each attribute says what 0 and 10 mean: liking or intensity", () => {
  assert.equal(isLiking("overall"), true);
  assert.equal(isLiking("dulzor"), false);
  assert.equal(scaleHint("dulzor"), "0 = nada dulce · 10 = muy dulce");
  assert.equal(scaleHint("overall"), "Cuánto gusta en conjunto. 0 = no gusta nada · 10 = gusta muchísimo");
  // An attribute a project adds is read as intensity.
  assert.equal(isLiking("acidez"), false);
  assert.equal(scaleHint("acidez"), "Intensidad: 0 = nada · 10 = mucho");
});
