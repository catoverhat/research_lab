"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { requireUser } from "@/shared/supabase/server";
import { experimentSchema, newExperimentSchema } from "./schema";

export async function createExperiment(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(newExperimentSchema, formData);
  if (state) return state;

  const { data: row, error } = await supabase.from("experiments").insert(data).select("id").single();
  if (error) return dbError(error);
  redirect(`/projects/${projectId}/experiments/${row.id}`);
}

// Marking an experiment completed or failed freezes its recipe's composition (database trigger).
export async function updateExperiment(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(experimentSchema, formData);
  if (state) return state;

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
