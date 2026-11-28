"use server";

import { refresh } from "next/cache";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { requireUser } from "@/shared/supabase/server";
import { findingSchema, hypothesisStatusSchema } from "./schema";

/** A conclusion of the project, optionally drawn from one experiment and tied to one hypothesis. */
export async function addFinding(
  projectId: string,
  experimentId: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(findingSchema, formData);
  if (state) return state;

  const { error } = await supabase
    .from("findings")
    .insert({ ...data, project_id: projectId, experiment_id: experimentId });
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function deleteFinding(id: string): Promise<FormState> {
  const supabase = await requireUser();
  const { error } = await supabase.from("findings").delete().eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

/** The verdict on a hypothesis (supported, refuted, inconclusive...). */
export async function updateHypothesisStatus(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(hypothesisStatusSchema, formData);
  if (state) return state;

  const { error } = await supabase.from("hypotheses").update(data).eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}
