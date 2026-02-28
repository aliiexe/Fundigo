import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { decryptText } from "@/lib/crypto";
import { generateSmartRecommendations } from "@/lib/ai";

type Recommendation = {
  type: "cancel" | "downgrade" | "alternative" | "ai";
  subscription_id?: string;
  service_name?: string;
  message: string;
  potential_savings?: number;
};

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const country = u.country_code?.toUpperCase() ?? "";
    const [subsRes, catalogRes, incomesRes, expensesRes, goalsRes] = await Promise.all([
      supabase.from("subscriptions").select("id, service_name, plan, amount, currency, period, created_at").eq("user_id", u.id),
      supabase.from("subscription_catalog").select("service, plan, period, price_mad, currency").eq("country_code", country || "_none_"),
      supabase.from("income_sources").select("name, amount, frequency, created_at").eq("user_id", u.id),
      supabase.from("expenses").select("merchant_cipher, amount").eq("user_id", u.id).order("date", { ascending: false }).limit(100),
      supabase.from("goals").select("name, target_amount, current_amount, deadline").eq("user_id", u.id),
    ]);

    const subs = subsRes.data ?? [];
    const catalog = catalogRes.data ?? [];

    let monthlyIncome = 0;
    const now = new Date();
    for (const i of incomesRes.data ?? []) {
      const amt = Number(i.amount);
      if (i.frequency === "monthly") monthlyIncome += amt;
      else if (i.frequency === "yearly") monthlyIncome += amt / 12;
      else if (i.frequency === "weekly") monthlyIncome += amt * 4.33;
      else if (i.frequency === "biweekly") monthlyIncome += amt * 2.17;
      else if (i.frequency === "irregular") {
        const created = i.created_at ? new Date(i.created_at) : null;
        if (created && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
          monthlyIncome += amt;
        }
      }
    }

    const totalMonthlySubs = subs.reduce((sum, s) => {
      return sum + (s.period === "yearly" ? Number(s.amount) / 12 : Number(s.amount));
    }, 0);

    const recommendations: Recommendation[] = [];

    if (monthlyIncome > 0 && totalMonthlySubs / monthlyIncome > 0.15) {
      const highestSub = [...subs].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
      if (highestSub) {
        recommendations.push({
          type: "cancel",
          subscription_id: highestSub.id,
          service_name: highestSub.service_name,
          message: `Subscriptions take ${Math.round((totalMonthlySubs / monthlyIncome) * 100)}% of your income. Consider reviewing ${highestSub.service_name} (your most expensive).`,
          potential_savings: Number(highestSub.amount),
        });
      }
    }

    for (const sub of subs) {
      const alternatives = catalog.filter(
        (c) =>
          c.service.toLowerCase() === sub.service_name.toLowerCase() &&
          c.period === sub.period &&
          Number(c.price_mad) < Number(sub.amount)
      );
      if (alternatives.length > 0) {
        const cheapest = alternatives.sort((a, b) => Number(a.price_mad) - Number(b.price_mad))[0];
        recommendations.push({
          type: "downgrade",
          subscription_id: sub.id,
          service_name: sub.service_name,
          message: `${sub.service_name} has a cheaper plan: ${cheapest.plan} at ${cheapest.price_mad} ${cheapest.currency}/${cheapest.period}.`,
          potential_savings: Number(sub.amount) - Number(cheapest.price_mad),
        });
      }
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    for (const sub of subs) {
      if (new Date(sub.created_at) < threeMonthsAgo && !recommendations.some((r) => r.subscription_id === sub.id)) {
        recommendations.push({
          type: "cancel",
          subscription_id: sub.id,
          service_name: sub.service_name,
          message: `You've had ${sub.service_name} for over 3 months. Still using it? Consider cancelling to save ${sub.amount} ${sub.currency}/${sub.period}.`,
          potential_savings: Number(sub.amount),
        });
      }
    }

    // AI-powered insights
    const spendingByMerchant: Record<string, number> = {};
    for (const e of expensesRes.data ?? []) {
      let merchant = "Other";
      try {
        const p = JSON.parse(e.merchant_cipher);
        if (p.ciphertext && p.iv && p.tag) merchant = decryptText(p.ciphertext, p.iv, p.tag);
      } catch { /* use default */ }
      spendingByMerchant[merchant] = (spendingByMerchant[merchant] || 0) + Number(e.amount);
    }
    const topSpending = Object.entries(spendingByMerchant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([merchant, amount]) => ({ merchant, amount }));

    const totalExpenses = Object.values(spendingByMerchant).reduce((s, v) => s + v, 0);
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - totalExpenses - totalMonthlySubs) / monthlyIncome : 0;

    const aiTips = await generateSmartRecommendations({
      profession: u.profession,
      primary_goal: u.primary_goal,
      currency: u.preferred_currency || "USD",
      monthly_income: monthlyIncome,
      total_expenses: totalExpenses,
      total_subscriptions: totalMonthlySubs,
      subscriptions: subs.map((s) => ({
        name: s.service_name,
        amount: Number(s.amount),
        period: s.period,
        months_active: Math.max(1, Math.round((now.getTime() - new Date(s.created_at).getTime()) / (30 * 86400000))),
      })),
      top_spending: topSpending,
      savings_rate: savingsRate,
      goals: (goalsRes.data ?? []).map((g) => ({
        name: g.name,
        target: Number(g.target_amount),
        current: Number(g.current_amount),
        deadline: g.deadline,
      })),
      income_sources: (incomesRes.data ?? []).map((i) => ({
        name: i.name,
        amount: Number(i.amount),
        frequency: i.frequency,
      })),
    });

    if (aiTips) {
      for (const tip of aiTips) {
        recommendations.push({ type: "ai", message: tip });
      }
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 8),
      totalMonthlySubs,
      subToIncomeRatio: monthlyIncome > 0 ? totalMonthlySubs / monthlyIncome : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
