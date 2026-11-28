import type { Client } from "@/shared/supabase/server";

type Claims = { email?: string; user_metadata?: { name?: unknown } } | undefined;

/** The name saved in Cuenta (it travels in the session token); null when there is none. */
export const savedNameOf = (claims: Claims) => {
  const name = claims?.user_metadata?.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
};

/** How the signed-in person is named in their records: their name, or what goes before the @. */
export const displayName = (claims: Claims) => savedNameOf(claims) ?? claims?.email?.split("@")[0] ?? "";

export async function sessionClaims(supabase: Client): Promise<Claims> {
  const { data } = await supabase.auth.getClaims();
  return data?.claims;
}
