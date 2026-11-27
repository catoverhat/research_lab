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

/** Copies a recipe and its ingredients into the next version of its code, to change it after testing. */
export async function createVersion(id: string): Promise<FormState> {
  const supabase = await requireUser();
  const { data: f, error } = await supabase.from("formulations").select("*").eq("id", id).single();
  if (error) return dbError(error);

  const [last, ingredients] = await Promise.all([
    supabase
      .from("formulations")
      .select("version")
      .eq("project_id", f.project_id)
      .eq("code", f.code)
      .order("version", { ascending: false })
      .limit(1)
      .single(),
    supabase.from("formulation_ingredients").select("product_id, quantity, notes").eq("formulation_id", id),
  ]);
  if (last.error) return dbError(last.error);
  if (ingredients.error) return dbError(ingredients.error);

  const { id: _id, owner_id: _owner, created_at: _created, ...copy } = f;
  const next = await supabase
    .from("formulations")
    .insert({ ...copy, version: last.data.version + 1, parent_id: f.id, status: "draft" })
    .select("id")
    .single();
  if (next.error) return dbError(next.error);

  if (ingredients.data.length > 0) {
    const copied = await supabase
      .from("formulation_ingredients")
      .insert(ingredients.data.map((i) => ({ ...i, formulation_id: next.data.id })));
    if (copied.error) {
      // shortcut: not a transaction; remove the half-made version by hand. Move to an RPC if this grows.
      await supabase.from("formulations").delete().eq("id", next.data.id);
      return dbError(copied.error);
    }
  }
  redirect(path(f.project_id, next.data.id));
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
