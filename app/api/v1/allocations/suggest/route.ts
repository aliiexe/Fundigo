import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { allocationsSuggestBody } from "@/lib/validators";
import { suggestAllocation } from "@/lib/allocation";
import { generateAllocationReasoning } from "@/lib/ai";

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

    const [incomesRes, expensesRes, subsRes, goalsRes] = await Promise.all([
      supabase.from("income_sources").select("amount, frequency").eq("user_id", u.id),
      supabase.from("expenses").select("amount").eq("user_id", u.id),
      supabase.from("subscriptions").select("amount, period").eq("user_id", u.id),
      supabase.from("goals").select("name, target_amount, current_amount").eq("user_id", u.id),
    ]);

    let monthlyIncome = 0;
    for (const i of incomesRes.data ?? []) {
      if (i.frequency === "monthly") monthlyIncome += Number(i.amount);
      else if (i.frequency === "yearly") monthlyIncome += Number(i.amount) / 12;
      else if (i.frequency === "weekly") monthlyIncome += Number(i.amount) * 4.33;
      else if (i.frequency === "biweekly") monthlyIncome += Number(i.amount) * 2.17;
      else if (i.frequency === "irregular") monthlyIncome += Number(i.amount);
    }

    let monthlySubs = 0;
    for (const s of subsRes.data ?? []) {
      monthlySubs += s.period === "yearly" ? Number(s.amount) / 12 : Number(s.amount);
    }

    const totalExpenses = (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

    const aiResult = await generateAllocationReasoning({
      profession: u.profession,
      primary_goal: u.primary_goal,
      monthly_income: monthlyIncome,
      monthly_expenses: totalExpenses,
      monthly_subscriptions: monthlySubs,
      goals: (goalsRes.data ?? []).map((g) => ({
        name: g.name,
        target: Number(g.target_amount),
        current: Number(g.current_amount),
      })),
      allocation: { spend: suggested.spend, save: suggested.save, invest: suggested.invest, keep: suggested.keep ?? 0 },
      amount: parsed.data.amount,
    });

    const reasoningText = aiResult?.reasoning || `Based on ${preset} preset for ${parsed.data.amount}.`;
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
      etaGoal: aiResult?.etaGoal,
      id: alloc.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
