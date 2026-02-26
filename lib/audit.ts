import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  meta: Record<string, unknown>
) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    meta,
  }).then(({ error }) => {
    if (error) console.error("[audit]", error);
  });
}
