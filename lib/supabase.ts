import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SECRET_KEY;

export function createServerClient(): SupabaseClient {
  if (!key) throw new Error("SUPABASE_SECRET_KEY is required.");
  return createClient(url, key);
}
