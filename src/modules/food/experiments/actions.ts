"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { requireUser } from "@/shared/supabase/server";
import { experimentSchema, newExperimentSchema } from "./schema";
import { parseEvaluation } from "./sensory";

export async function createExperiment(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(newExperimentSchema, formData);
  if (state) return state;

  const { data: row, error } = await supabase
    .from("experiments")
    .insert(data)
    .select("id, formulations(project_id)")
    .single();
  if (error) return dbError(error);
  // The recipe decides the project (the form could send a recipe from another one).
  redirect(`/projects/${row.formulations?.project_id ?? projectId}/experiments/${row.id}`);
}

// Recording a run (completed/failed) freezes its recipe, and the database keeps it recorded
// (triggers lock_tested_formulation_ingredients and keep_recorded_experiments_recorded).
export async function updateExperiment(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(experimentSchema, formData);
  if (state) return state;

  const { error } = await supabase.from("experiments").update(data).eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

// One evaluator's evaluation. Sending the same evaluator again replaces it: the scores sent are
// written, then the attributes left out are removed. Writing first means a failure never loses
// the new scores; at worst an old score stays and the form says so.
// The comment goes on the overall row (or the first one): it is about the whole tasting.
export async function saveEvaluation(experimentId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, fieldErrors } = parseEvaluation(formData);
  if (fieldErrors) return { error: "Revisa los campos marcados.", fieldErrors };

  const commentOn = data.scores.find((s) => s.attribute === "overall")?.attribute ?? data.scores[0].attribute;
  const { error } = await supabase.from("sensory_evaluations").upsert(
    data.scores.map((s) => ({
      experiment_id: experimentId,
      evaluator: data.evaluator,
      attribute: s.attribute,
      score: s.score,
      comment: s.attribute === commentOn ? data.comment : null,
    })),
    { onConflict: "experiment_id,evaluator,attribute" },
  );
  if (error) return dbError(error);

  const stale = await supabase
    .from("sensory_evaluations")
    .delete()
    .eq("experiment_id", experimentId)
    .eq("evaluator", data.evaluator)
    .not("attribute", "in", `(${data.scores.map((s) => JSON.stringify(s.attribute)).join(",")})`);
  refresh();
  if (stale.error)
    return { error: "Se guardaron las notas nuevas, pero no se pudieron quitar las que ya no están. Vuelve a guardar." };
  return { ok: true };
}

export async function deleteEvaluation(experimentId: string, evaluator: string): Promise<FormState> {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("sensory_evaluations")
    .delete()
    .eq("experiment_id", experimentId)
    .eq("evaluator", evaluator);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function deleteExperiment(id: string, projectId: string): Promise<FormState> {
  const supabase = await requireUser();
  const { error } = await supabase.from("experiments").delete().eq("id", id);
  if (error) return dbError(error);
  redirect(`/projects/${projectId}`);
}
