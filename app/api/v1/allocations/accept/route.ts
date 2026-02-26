import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { allocationsAcceptBody } from "@/lib/validators";
import { logTransaction } from "@/lib/transactions";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const parsed = allocationsAcceptBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const currency = u.preferred_currency || "USD";

    const { data: alloc } = await supabase
      .from("allocations")
      .select("id, amount, spend_pct, save_pct, invest_pct, keep_pct")
      .eq("user_id", u.id)
      .eq("id", parsed.data.allocation_id)
      .single();
    if (!alloc) return NextResponse.json({ error: "Allocation not found" }, { status: 404 });

    const update: Record<string, unknown> = {
      accepted: true,
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.spend_pct !== undefined) update.spend_pct = parsed.data.spend_pct;
    if (parsed.data.save_pct !== undefined) update.save_pct = parsed.data.save_pct;
    if (parsed.data.invest_pct !== undefined) update.invest_pct = parsed.data.invest_pct;
    if (parsed.data.keep_pct !== undefined) update.keep_pct = parsed.data.keep_pct;
    if (parsed.data.save_target) update.save_target = parsed.data.save_target;
    if (parsed.data.goal_id) update.goal_id = parsed.data.goal_id;
    update.currency = currency;

    const { error: updateErr } = await supabase.from("allocations").update(update).eq("id", alloc.id);
    if (updateErr && updateErr.message?.includes("column")) {
      const fallback = { accepted: true, updated_at: update.updated_at } as Record<string, unknown>;
      if (parsed.data.spend_pct !== undefined) fallback.spend_pct = parsed.data.spend_pct;
      if (parsed.data.save_pct !== undefined) fallback.save_pct = parsed.data.save_pct;
      if (parsed.data.invest_pct !== undefined) fallback.invest_pct = parsed.data.invest_pct;
      if (parsed.data.keep_pct !== undefined) fallback.keep_pct = parsed.data.keep_pct;
      await supabase.from("allocations").update(fallback).eq("id", alloc.id);
    }

    const finalSave = (parsed.data.save_pct ?? alloc.save_pct) || 0;
    const finalInvest = (parsed.data.invest_pct ?? alloc.invest_pct) || 0;
    const saveAmount = Math.round((alloc.amount * finalSave) / 100);
    const investAmount = Math.round((alloc.amount * finalInvest) / 100);

    await logTransaction(supabase, u.id, "allocation", alloc.amount, currency,
      `Allocation accepted: ${parsed.data.spend_pct ?? alloc.spend_pct}% spend, ${finalSave}% save, ${finalInvest}% invest`,
      alloc.id,
      { spend_pct: parsed.data.spend_pct, save_pct: finalSave, invest_pct: finalInvest, save_target: parsed.data.save_target }
    );

    if (parsed.data.save_target === "goal" && parsed.data.goal_id && saveAmount > 0) {
      const { data: goal } = await supabase
        .from("goals")
        .select("id, name, current_amount")
        .eq("id", parsed.data.goal_id)
        .eq("user_id", u.id)
        .single();

      if (goal) {
        const newAmount = Number(goal.current_amount) + saveAmount;
        await supabase.from("goals").update({
          current_amount: newAmount,
          updated_at: new Date().toISOString(),
        }).eq("id", goal.id);

        await logTransaction(supabase, u.id, "goal_contribution", saveAmount, currency,
          `Allocated ${saveAmount} to goal "${goal.name}"`,
          goal.id,
          { from_allocation: alloc.id, previous_amount: Number(goal.current_amount), new_amount: newAmount }
        );
      }
    }

    return NextResponse.json({
      accepted: true,
      saveAmount,
      investAmount,
      goalUpdated: parsed.data.save_target === "goal" && parsed.data.goal_id ? true : false,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
