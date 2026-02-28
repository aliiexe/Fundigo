import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { allocationsSuggestBody } from "@/lib/validators";
import { suggestAllocation, buildAllocationReasoning } from "@/lib/allocation";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const parsed = allocationsSuggestBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { suggested, preset, isAdaptive, historyCount, emaWeight } = await suggestAllocation(
      supabase, u.id, parsed.data.amount, u.profession, u.e2e_encrypted ?? false
    );

    const { data: goalsData } = await supabase
      .from("goals")
      .select("name")
      .eq("user_id", u.id);
    const goalNames = (goalsData ?? []).map((g) => g.name);

    const reasoningText = buildAllocationReasoning({
      amount: parsed.data.amount,
      suggested,
      preset,
      isAdaptive,
      goalNames,
      currency: u.preferred_currency || "USD",
    });
    let alloc: { id: string } | null = null;
    const insertData: Record<string, unknown> = {
      user_id: u.id,
      amount: parsed.data.amount,
      spend_pct: suggested.spend,
      save_pct: suggested.save,
      invest_pct: suggested.invest,
      keep_pct: suggested.keep ?? 0,
      currency: u.preferred_currency || "USD",
      reasoning: reasoningText,
      accepted: false,
    };
    const { data: a1, error: e1 } = await supabase.from("allocations").insert(insertData).select("id").single();
    if (e1 && e1.message?.includes("column")) {
      const { user_id, amount, spend_pct, save_pct, invest_pct, keep_pct, accepted } = insertData;
      const { data: a2, error: e2 } = await supabase.from("allocations")
        .insert({ user_id, amount, spend_pct, save_pct, invest_pct, keep_pct, accepted })
        .select("id").single();
      if (e2) throw e2;
      alloc = a2;
    } else if (e1) {
      throw e1;
    } else {
      alloc = a1;
    }
    if (!alloc) throw new Error("Failed to create allocation");

    return NextResponse.json({
      suggested,
      preset,
      isAdaptive,
      historyCount,
      emaWeight: Math.round(emaWeight * 100),
      reasoning: reasoningText,
      id: alloc.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
