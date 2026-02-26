/**
 * Supabase server client. Uses SUPABASE_URL + SUPABASE_SECRET_KEY for all server-side operations (API routes, seeding).
 * SECURITY: SUPABASE_SECRET_KEY must only be used in server context. Never expose to client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export function createServerClient(): SupabaseClient {
  if (!supabaseSecretKey) {
    throw new Error('SUPABASE_SECRET_KEY is required for server-side Supabase client.');
  }
  return createClient(supabaseUrl, supabaseSecretKey);
}
