// Sensory evaluation: one evaluator scores several attributes (0-10) of one run.

/** Attributes offered by default; projects add their own. "overall" is the overall score (glossary). */
export const defaultAttributes = ["overall", "sabor", "aroma", "dulzor", "amargor", "textura", "apariencia"];

/** Display name: "overall" is "Global"; others start with a capital ("dulzor" -> "Dulzor"). */
export const attributeLabel = (attribute: string) =>
  attribute === "overall" ? "Global" : attribute.charAt(0).toLocaleUpperCase("es") + attribute.slice(1);

/** Stored attribute key: lower case, trimmed; "global" means the overall score. */
export const attributeKey = (name: string) => {
  const key = name.trim().toLowerCase();
  return key === "global" ? "overall" : key;
};

/** A text field from outside input; a file or a missing field reads as empty. */
const textField = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

export type EvaluationInput = {
  evaluator: string;
  comment: string | null;
  scores: { attribute: string; score: number }[];
};

/**
 * Reads the evaluation form: `score__<attribute>` for listed attributes and
 * `extra_attribute_<n>` + `extra_score_<n>` for new ones. Blank scores are skipped
 * (not scored is not 0).
 */
export function parseEvaluation(formData: FormData):
  | { data: EvaluationInput; fieldErrors: undefined }
  | { data: undefined; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  const evaluator = textField(formData, "evaluator").trim();
  if (!evaluator) fieldErrors.evaluator = ["Obligatorio"];
  const comment = textField(formData, "comment").trim() || null;

  const scores = new Map<string, number>();
  for (const [field, raw] of formData.entries()) {
    if (typeof raw !== "string" || raw.trim() === "") continue;
    let attribute: string;
    if (field.startsWith("score__")) {
      attribute = attributeKey(field.slice("score__".length));
      if (!attribute) {
        fieldErrors[field] = ["Atributo sin nombre"];
        continue;
      }
    } else if (field.startsWith("extra_score_")) {
      const nameField = `extra_attribute_${field.slice("extra_score_".length)}`;
      attribute = attributeKey(textField(formData, nameField));
      if (!attribute) {
        fieldErrors[nameField] = ["Pon nombre al atributo"];
        continue;
      }
    } else continue;

    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0 || score > 10) fieldErrors[field] = ["Entre 0 y 10"];
    else if (scores.has(attribute)) fieldErrors[field] = ["Atributo repetido"];
    else scores.set(attribute, score);
  }
  if (Object.keys(fieldErrors).length === 0 && scores.size === 0) fieldErrors.evaluator = ["Pon al menos una nota"];

  return Object.keys(fieldErrors).length
    ? { data: undefined, fieldErrors }
    : { data: { evaluator, comment, scores: [...scores].map(([attribute, score]) => ({ attribute, score })) }, fieldErrors: undefined };
}
