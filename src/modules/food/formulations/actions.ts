"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { requireUser } from "@/shared/supabase/server";
import { formulationSchema, ingredientSchema, ingredientUpdateSchema, newFormulationSchema } from "./schema";

const path = (projectId: string, id: string) => `/projects/${projectId}/formulations/${id}`;

export async function createFormulation(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(newFormulationSchema, formData);
  if (state) return state;

  const { data: row, error } = await supabase
    .from("formulations")
    .insert({ ...data, project_id: projectId })
    .select("id")
    .single();
  if (error) return dbError(error);
  redirect(path(projectId, row.id));
}

export async function updateFormulation(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(formulationSchema, formData);
  if (state) return state;

  const { error } = await supabase.from("formulations").update(data).eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function deleteFormulation(id: string, projectId: string): Promise<FormState> {
  const supabase = await requireUser();
  const { error } = await supabase.from("formulations").delete().eq("id", id);
  if (error) return dbError(error);
  redirect(`/projects/${projectId}`);
}

/**
 * Copies a recipe and its composition into the next version of its code, to change it after testing.
 * One transaction in the database (create_formulation_version), so it never leaves a half-made version.
 */
export async function createVersion(id: string, projectId: string): Promise<FormState> {
  const supabase = await requireUser();
  const { data: newId, error } = await supabase.rpc("create_formulation_version", { source_formulation_id: id });
  if (error) return dbError(error);
  redirect(path(projectId, newId));
}

export async function addIngredient(formulationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(ingredientSchema, formData);
  if (state) return state;

  const { error } = await supabase.from("formulation_ingredients").insert({ ...data, formulation_id: formulationId });
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

// A frozen recipe still accepts this when only the notes change (the trigger compares the composition).
export async function updateIngredient(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(ingredientUpdateSchema, formData);
  if (state) return state;

  const { error } = await supabase.from("formulation_ingredients").update(data).eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function removeIngredient(id: string): Promise<FormState> {
  const supabase = await requireUser();
  const { error } = await supabase.from("formulation_ingredients").delete().eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}
