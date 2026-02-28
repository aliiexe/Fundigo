import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { ensureUserBody } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const parsed = ensureUserBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const { data: existing } = await supabase.from("users").select("id").eq("clerk_id", userId).single();
    const now = new Date().toISOString();
    if (existing) {
      const updatePayload: Record<string, unknown> = { updated_at: now };
      if (parsed.data.profession !== undefined) updatePayload.profession = parsed.data.profession ?? null;
      if (parsed.data.primary_goal !== undefined) updatePayload.primary_goal = parsed.data.primary_goal ?? null;
      if (parsed.data.preferred_currency !== undefined) updatePayload.preferred_currency = parsed.data.preferred_currency;
      if (parsed.data.country_code !== undefined) updatePayload.country_code = parsed.data.country_code ?? null;
      if (parsed.data.starting_balance !== undefined) updatePayload.starting_balance = parsed.data.starting_balance;
      if (parsed.data.complete_onboarding === true) updatePayload.onboarding_completed_at = now;
      await supabase.from("users").update(updatePayload).eq("id", existing.id);
      return NextResponse.json({ user: { id: existing.id, updated: true } });
    }
    const insertPayload: Record<string, unknown> = {
      clerk_id: userId,
      profession: parsed.data.profession ?? null,
      primary_goal: parsed.data.primary_goal ?? null,
      preferred_currency: parsed.data.preferred_currency ?? "USD",
      country_code: parsed.data.country_code ?? null,
      starting_balance: parsed.data.starting_balance ?? 0,
      updated_at: now,
      onboarding_completed_at: parsed.data.complete_onboarding === true ? now : null,
    };
    const { data: inserted, error } = await supabase
      .from("users")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ user: { id: inserted.id, created: true } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
