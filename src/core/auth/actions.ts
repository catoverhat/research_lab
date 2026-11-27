"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, parseForm } from "@/shared/forms";
import { createClient } from "@/shared/supabase/server";
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
