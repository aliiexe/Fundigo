import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { generateGoalAdvice } from "@/lib/ai";
import { getRates, convertSync } from "@/lib/exchange";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const currency = u.preferred_currency || "USD";
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    const [y, m] = monthStr.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const start = `${monthStr}-01`;
    const end = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const [goalRes, incomesRes, expensesRes, subsRes, allGoalsRes, rates] = await Promise.all([
      supabase.from("goals").select("name, target_amount, current_amount, currency, deadline").eq("id", id).eq("user_id", u.id).single(),
      supabase.from("income_sources").select("name, amount, currency, frequency, created_at").eq("user_id", u.id),
      supabase
        .from("expenses")
        .select("amount, currency")
        .eq("user_id", u.id)
        .gte("date", start)
        .lte("date", end),
      supabase.from("subscriptions").select("service_name, amount, currency, period").eq("user_id", u.id),
      supabase.from("goals").select("name, target_amount, current_amount, currency").eq("user_id", u.id).neq("id", id),
      getRates("USD"),
    ]);

    if (!goalRes.data) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    const goal = goalRes.data;

    try {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("goal_advice")
        .select("achievable, advice, monthly_needed, created_at")
        .eq("goal_id", id)
        .eq("user_id", u.id)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return NextResponse.json({
          achievable: cached.achievable,
          advice: cached.advice,
          monthly_needed: cached.monthly_needed,
        });
      }
    } catch { /* table may not exist yet */ }

    const cx = (amount: number, from: string | null | undefined) =>
      convertSync(amount, from || currency, currency, rates);

    let recurringIncome = 0;
    let irregularIncome = 0;
    const incomeSources = (incomesRes.data ?? []).map((i) => {
      const amt = cx(Number(i.amount), i.currency);
      if (i.frequency === "irregular") {
        const created = i.created_at ? new Date(i.created_at) : null;
        if (created && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
          irregularIncome += amt;
        }
      } else if (i.frequency === "monthly") recurringIncome += amt;
      else if (i.frequency === "yearly") recurringIncome += amt / 12;
      else if (i.frequency === "weekly") recurringIncome += amt * 4.33;
      else if (i.frequency === "biweekly") recurringIncome += amt * 2.17;
      return { name: i.name, amount: Math.round(amt), frequency: i.frequency };
    });
    const monthlyIncome = recurringIncome + irregularIncome;

    let monthlySubs = 0;
    const subscriptions = (subsRes.data ?? []).map((s) => {
      const base = cx(Number(s.amount), s.currency);
      const mo = s.period === "yearly" ? base / 12 : base;
      monthlySubs += mo;
      return { name: s.service_name, amount: Math.round(mo) };
    });

    const totalExpenses = (expensesRes.data ?? []).reduce(
      (s, e) => s + cx(Number(e.amount), e.currency), 0
    );

    const startingBalance = Number(u.starting_balance) || 0;

    const advice = await generateGoalAdvice({
      goal: {
        name: goal.name,
        target: cx(Number(goal.target_amount), goal.currency),
        current: cx(Number(goal.current_amount), goal.currency),
        deadline: goal.deadline,
      },
      financials: {
        monthly_income: monthlyIncome,
        monthly_expenses: totalExpenses,
        monthly_subscriptions: monthlySubs,
        starting_balance: startingBalance,
      },
      profile: {
        profession: u.profession,
        primary_goal: u.primary_goal,
      },
      currency,
      income_sources: incomeSources,
      subscriptions,
      other_goals: (allGoalsRes.data ?? []).map((g) => ({
        name: g.name,
        target: cx(Number(g.target_amount), g.currency),
        current: cx(Number(g.current_amount), g.currency),
      })),
    });

    const result = advice || {
      achievable: false,
      advice: "Unable to generate advice right now. Try again later.",
      monthly_needed: 0,
    };

    try {
      await supabase.from("goal_advice").insert({
        user_id: u.id,
        goal_id: id,
        achievable: result.achievable,
        advice: result.advice,
        monthly_needed: result.monthly_needed,
      });
    } catch { /* table may not exist yet */ }

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
