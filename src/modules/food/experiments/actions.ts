"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { requireUser } from "@/shared/supabase/server";
import { experimentSchema, isRecorded, newExperimentSchema } from "./schema";

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

// Marking an experiment completed or failed freezes its recipe's composition (database trigger).
export async function updateExperiment(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(experimentSchema, formData);
  if (state) return state;

  const current = await supabase.from("experiments").select("status").eq("id", id).single();
  if (current.error) return dbError(current.error);
  // Going back to planned or cancelled would silently unfreeze the recipe; deleting is the explicit way.
  if (isRecorded(current.data.status) && !isRecorded(data.status))
    return {
      error: "Un experimento realizado o fallido no vuelve a planificado ni a cancelado. Si se registró por error, bórralo.",
    };

  const { error } = await supabase.from("experiments").update(data).eq("id", id);
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
