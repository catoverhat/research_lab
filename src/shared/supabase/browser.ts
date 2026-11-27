import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/shared/database/database.types";
import { supabaseKey, supabaseUrl } from "./config";

// Only for what must run in the browser (passkey ceremonies). Data goes through Server Actions.
export const createClient = () => createBrowserClient<Database>(supabaseUrl, supabaseKey);
