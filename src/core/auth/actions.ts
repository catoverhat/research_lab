"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, parseForm } from "@/shared/forms";
import { createClient, requireUser } from "@/shared/supabase/server";
import { authMessage } from "./messages";

const signInSchema = z.object({
  email: z.email("Email no válido"),
  password: z.string().min(1, "Obligatorio"),
  // Hidden input that the Turnstile widget adds to the form.
  "cf-turnstile-response": z.string().default(""),
});

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const { data, state } = parseForm(signInSchema, formData);
  if (state) return state;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
    options: { captchaToken: data["cf-turnstile-response"] },
  });
  if (error) return { error: authMessage(error) };
  redirect("/");
}

// Blank clears the name (the email is used instead).
const nameSchema = z.object({
  name: z.string().trim().max(80, "Máximo 80 caracteres").transform((v) => v || null),
});

// A display name only (user_metadata is editable by the user): never used to grant access.
export async function updateName(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(nameSchema, formData);
  if (state) return state;

  const { error } = await supabase.auth.updateUser({ data: { name: data.name } });
  if (error) return { error: authMessage(error) };
  // The name travels in the session token: a fresh one lets every page see it now.
  const refreshed = await supabase.auth.refreshSession();
  refresh();
  if (refreshed.error) return { error: "Se guardó el nombre, pero aparecerá al volver a entrar." };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
