"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { requireUser } from "@/shared/supabase/server";
import { projectSchema } from "./schema";

export async function createProject(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(projectSchema, formData);
  if (state) return state;

  const { data: row, error } = await supabase.from("research_projects").insert(data).select("id").single();
  if (error) return dbError(error);
  redirect(`/projects/${row.id}`);
}

export async function updateProject(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(projectSchema, formData);
  if (state) return state;

  const { error } = await supabase.from("research_projects").update(data).eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}
