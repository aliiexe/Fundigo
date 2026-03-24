import type { SupabaseClient } from "@supabase/supabase-js";

/** Find or create a category row for this user; returns its id. */
export async function ensureUserCategoryId(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is empty");

  const { data: existing, error: findErr } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", trimmed)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing?.id) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: trimmed })
    .select("id")
    .single();
  if (insErr) throw insErr;
  if (!created?.id) throw new Error("Could not create category");
  return created.id;
}
