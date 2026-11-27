import { createServerClient } from "@supabase/ssr";
import type { PostgrestError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/shared/database/database.types";
import { supabaseKey, supabaseUrl } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write cookies; the proxy refreshes the session.
        }
      },
    },
  });
}

export type Client = Awaited<ReturnType<typeof createClient>>;

/** Data of a query, or its error thrown to the error page. */
export function must<R extends { data: unknown; error: PostgrestError | null }>(result: R) {
  if (result.error) throw result.error;
  return result.data as Extract<R, { error: null }>["data"];
}

/** Every page and Server Action calls this: the proxy alone is not an auth check. RLS does the rest. */
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return supabase;
}
