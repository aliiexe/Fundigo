import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRow = {
  id: string;
  clerk_id: string;
  profession: string | null;
  primary_goal: string | null;
  preferred_currency: string | null;
  country_code: string | null;
  starting_balance: number;
  onboarding_completed_at: string | null;
  e2e_encrypted?: boolean;
};

const USER_SELECT =
  "id, clerk_id, profession, primary_goal, preferred_currency, country_code, starting_balance, onboarding_completed_at, e2e_encrypted";

export async function getOrCreateUser(
  supabase: SupabaseClient,
  clerkId: string
): Promise<UserRow | null> {
  const { data: existing } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("clerk_id", clerkId)
    .single();

  if (existing) return existing as UserRow;

  const now = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      clerk_id: clerkId,
      preferred_currency: "USD",
      starting_balance: 0,
      updated_at: now,
    })
    .select(USER_SELECT)
    .single();

  if (error) {
    console.error("[getOrCreateUser] insert failed:", error);
    return null;
  }
  return inserted as UserRow;
}
