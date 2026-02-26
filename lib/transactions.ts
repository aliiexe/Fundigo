import type { SupabaseClient } from "@supabase/supabase-js";

export type TransactionType = "income" | "expense" | "subscription" | "goal_contribution" | "allocation";

export async function logTransaction(
  supabase: SupabaseClient,
  userId: string,
  type: TransactionType,
  amount: number,
  currency: string,
  description: string,
  referenceId?: string,
  meta?: Record<string, unknown>
) {
  try {
    await supabase.from("transactions").insert({
      user_id: userId,
      type,
      amount,
      currency,
      description,
      reference_id: referenceId,
      meta: meta ?? {},
    });
  } catch (e) {
    console.error("[transactions] Failed to log:", e);
  }
}
