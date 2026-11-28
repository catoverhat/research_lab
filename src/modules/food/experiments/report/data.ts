import { productLabel } from "@/shared/format";
import { must, type Client } from "@/shared/supabase/server";
import { isRecorded } from "../schema";
import type { AttributeStats, Line } from "./compare";

/** Everything the experiment report shows, in two rounds of parallel queries (the second needs the reference). */
export async function loadExperimentReport(supabase: Client, projectId: string, experimentId: string) {
  const [experimentRes, projectRes, runsRes, hypothesesRes, evaluationsRes, findingsRes] = await Promise.all([
    supabase
      .from("experiments")
      .select(
        "*, formulations(id, code, version, name, instructions, servings, serving_size, serving_unit, parent_id), hypotheses(id, statement, rationale, status)",
      )
      .eq("id", experimentId)
      .maybeSingle(),
    supabase.from("research_projects").select("title").eq("id", projectId).maybeSingle(),
    // Every run of the project: this one, its reference, the options for "Comparar con".
    supabase
      .from("v_experiment_summary")
      .select("*")
      .eq("project_id", projectId)
      .order("performed_on", { ascending: false, nullsFirst: true })
      .order("experiment_id"),
    supabase.from("hypotheses").select("id, statement, status").eq("project_id", projectId).order("created_at").order("id"),
    supabase
      .from("sensory_evaluations")
      .select("evaluator, attribute, score, comment")
      .eq("experiment_id", experimentId)
      .order("evaluator")
      .order("attribute"),
    supabase
      .from("findings")
      .select("id, statement, evidence_level, hypotheses(statement, status)")
      .eq("experiment_id", experimentId)
      .order("created_at")
      .order("id"),
  ]);
  const experiment = must(experimentRes);
  const project = must(projectRes);
  const runs = must(runsRes);
  const summary = runs.find((r) => r.experiment_id === experimentId);
  if (!experiment?.formulations || !project || !summary) return null;

  const formulation = experiment.formulations;
  const reference = runs.find((r) => r.experiment_id === experiment.baseline_experiment_id) ?? null;
  const formulationIds = [formulation.id, ...(reference?.formulation_id ? [reference.formulation_id] : [])];
  const experimentIds = [experimentId, ...(reference?.experiment_id ? [reference.experiment_id] : [])];

  const [linesRes, nutritionRes, sensoryRes, attributesRes] = await Promise.all([
    supabase
      .from("formulation_ingredients")
      .select("formulation_id, product_id, quantity, notes, products(brand, name, package_size, unit)")
      .in("formulation_id", formulationIds)
      .order("created_at")
      .order("id"),
    supabase.from("v_formulation_nutrition").select("*").in("formulation_id", formulationIds),
    supabase.from("v_experiment_sensory").select("*").in("experiment_id", experimentIds),
    // Attributes this project already uses, offered in the evaluation form.
    supabase.from("v_sensory_comparison").select("attribute").eq("project_id", projectId),
  ]);

  const lines = must(linesRes);
  const toLine = (l: (typeof lines)[number]): Line => ({
    productId: l.product_id,
    label: l.products ? productLabel(l.products) : l.product_id,
    unit: l.products?.unit ?? "",
    quantity: l.quantity,
  });
  const nutrition = must(nutritionRes);
  // View columns are typed nullable; a row without a mean is not a result (never a made-up 0).
  const sensory = must(sensoryRes).flatMap((s): (AttributeStats & { experimentId: string })[] =>
    s.experiment_id && s.attribute && s.avg_score != null && s.min_score != null && s.max_score != null
      ? [
          {
            experimentId: s.experiment_id,
            attribute: s.attribute,
            evaluations: s.evaluations ?? 0,
            avg: s.avg_score,
            min: s.min_score,
            max: s.max_score,
            stddev: s.stddev_score,
          },
        ]
      : [],
  );

  // Suggested reference: the latest recorded run of the previous version of this recipe.
  const suggestedReference = formulation.parent_id
    ? (runs.find((r) => r.formulation_id === formulation.parent_id && r.status && isRecorded(r.status)) ?? null)
    : null;

  return {
    projectTitle: project.title,
    experiment,
    formulation,
    hypothesis: experiment.hypotheses,
    summary,
    reference,
    suggestedReference,
    otherRuns: runs.filter((r) => r.experiment_id !== experimentId),
    hypotheses: must(hypothesesRes),
    evaluations: must(evaluationsRes),
    findings: must(findingsRes),
    composition: lines.filter((l) => l.formulation_id === formulation.id),
    currentLines: lines.filter((l) => l.formulation_id === formulation.id).map(toLine),
    referenceLines: reference ? lines.filter((l) => l.formulation_id === reference.formulation_id).map(toLine) : [],
    nutrition: nutrition.find((n) => n.formulation_id === formulation.id) ?? null,
    referenceNutrition: reference ? (nutrition.find((n) => n.formulation_id === reference.formulation_id) ?? null) : null,
    sensory: sensory.filter((s) => s.experimentId === experimentId),
    referenceSensory: reference ? sensory.filter((s) => s.experimentId === reference.experiment_id) : [],
    knownAttributes: [...new Set(must(attributesRes).flatMap((a) => (a.attribute ? [a.attribute] : [])))],
  };
}

export type ExperimentReport = NonNullable<Awaited<ReturnType<typeof loadExperimentReport>>>;
