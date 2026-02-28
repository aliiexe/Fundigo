import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { dashboardQuery } from "@/lib/validators";
import { decryptText } from "@/lib/crypto";
import { getRates, convertSync } from "@/lib/exchange";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const parsed = dashboardQuery.safeParse({ month: searchParams.get("month") });
    const month =
      parsed.success && parsed.data.month ? parsed.data.month : new Date().toISOString().slice(0, 7);
    const supabase = createServerClient();
    const user = await getOrCreateUser(supabase, userId);
    if (!user) return NextResponse.json({ error: "Could not load or create account" }, { status: 500 });
    const uid = user.id;
    const target = user.preferred_currency || "USD";
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const start = `${month}-01`;
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;

    const startTs = `${start}T00:00:00.000Z`;
    const endTs = `${end}T23:59:59.999Z`;

    const rangeStart = new Date(y, m - 1 - 3, 1);
    const rangeStartStr = `${rangeStart.getFullYear()}-${String(rangeStart.getMonth() + 1).padStart(2, "0")}-01`;

    const [incomeRes, expenseRes, expenseHistoryRes, subRes, goalRes, rates] = await Promise.all([
      supabase.from("income_sources").select("id, name, amount, currency, frequency, note, created_at").eq("user_id", uid),
      supabase
        .from("expenses")
        .select("id, merchant_cipher, amount, currency, category_id, date")
        .eq("user_id", uid)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
      supabase
        .from("expenses")
        .select("merchant_cipher, date")
        .eq("user_id", uid)
        .gte("date", rangeStartStr)
        .lte("date", end),
      supabase
        .from("subscriptions")
        .select("id, service_name, plan, amount, currency, period, paused_until")
        .eq("user_id", uid),
      supabase.from("goals").select("id, name, target_amount, current_amount, deadline").eq("user_id", uid),
      getRates("USD"),
    ]);

    const incomes = incomeRes.data ?? [];
    const rawExpenses = expenseRes.data ?? [];
    const rawHistory = expenseHistoryRes.data ?? [];
    const subscriptions = subRes.data ?? [];
    const goals = goalRes.data ?? [];

    const cx = (amount: number, from: string | null | undefined) =>
      convertSync(amount, from || target, target, rates);

    let recurringIncome = 0;
    let irregularIncome = 0;
    for (const i of incomes) {
      const amt = cx(Number(i.amount), i.currency);
      if (i.frequency === "irregular") {
        const created = i.created_at ? new Date(i.created_at) : null;
        if (created && created >= new Date(startTs) && created <= new Date(endTs)) {
          irregularIncome += amt;
        }
        continue;
      }
      if (i.frequency === "monthly") recurringIncome += amt;
      else if (i.frequency === "yearly") recurringIncome += amt / 12;
      else if (i.frequency === "weekly") recurringIncome += amt * 4.33;
      else if (i.frequency === "biweekly") recurringIncome += amt * 2.17;
    }
    const monthlyIncome = recurringIncome + irregularIncome;

    const monthStart = new Date(`${start}T00:00:00`);
    let monthlySubscriptions = 0;
    for (const s of subscriptions) {
      if (s.paused_until) {
        const pausedUntil = new Date(s.paused_until + "T23:59:59");
        if (pausedUntil >= monthStart) continue;
      }
      const amt = cx(Number(s.amount), s.currency);
      if (s.period === "monthly") monthlySubscriptions += amt;
      else if (s.period === "yearly") monthlySubscriptions += amt / 12;
    }

    const expenses = rawExpenses.map((e) => {
      let merchant = "Expense";
      try {
        const p = JSON.parse(e.merchant_cipher);
        if (p.ciphertext && p.iv && p.tag) {
          merchant = decryptText(p.ciphertext, p.iv, p.tag);
        }
      } catch {
        merchant = e.merchant_cipher;
      }
      return {
        id: e.id,
        merchant,
        amount: cx(Number(e.amount), e.currency),
        originalAmount: Number(e.amount),
        originalCurrency: e.currency,
        date: e.date,
      };
    });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const startingBalance = Number(user.starting_balance) || 0;
    const currentBalance = startingBalance + monthlyIncome - totalExpenses - monthlySubscriptions;

    const spendingByMerchant: Record<string, number> = {};
    for (const e of expenses) {
      const key = e.merchant || "Other";
      spendingByMerchant[key] = (spendingByMerchant[key] || 0) + e.amount;
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
    const dayOfMonth = Math.min(today.getDate(), lastDay);

    const merchantToDays: Record<string, number[]> = {};
    const merchantToMonths: Record<string, Set<string>> = {};
    for (const row of rawHistory) {
      let merchant = "Other";
      try {
        const p = JSON.parse(row.merchant_cipher);
        if (p.ciphertext && p.iv && p.tag) {
          merchant = decryptText(p.ciphertext, p.iv, p.tag);
        }
      } catch {
        merchant = row.merchant_cipher;
      }
      const key = (merchant || "").trim() || "Other";
      if (key === "Other") continue;
      const d = row.date ? new Date(row.date).getDate() : 1;
      const monthKey = row.date ? String(row.date).slice(0, 7) : "";
      if (!merchantToDays[key]) merchantToDays[key] = [];
      merchantToDays[key].push(d);
      if (!merchantToMonths[key]) merchantToMonths[key] = new Set();
      if (monthKey) merchantToMonths[key].add(monthKey);
    }

    const currentMonthMerchants = new Set(expenses.map((e) => (e.merchant || "").trim()).filter(Boolean));
    const reminders: { merchant: string; typicalDay: number; message: string }[] = [];
    for (const [merchant, days] of Object.entries(merchantToDays)) {
      if ((merchantToMonths[merchant]?.size ?? 0) < 2) continue;
      const typicalDay = days.sort((a, b) => a - b)[Math.floor(days.length / 2)] ?? 1;
      if (!isCurrentMonth || currentMonthMerchants.has(merchant)) continue;
      if (dayOfMonth >= typicalDay - 2 || dayOfMonth >= lastDay - 5) {
        const dayLabel =
          typicalDay === 1 ? "the 1st" : typicalDay === 2 ? "the 2nd" : typicalDay === 3 ? "the 3rd" : `around the ${typicalDay}`;
        reminders.push({
          merchant,
          typicalDay,
          message: `You usually log ${merchant} around ${dayLabel} — did you add it?`,
        });
      }
    }

    return NextResponse.json({
      month,
      currency: target,
      startingBalance,
      currentBalance,
      monthlyIncome,
      totalExpenses,
      monthlySubscriptions,
      netFlow: monthlyIncome - totalExpenses - monthlySubscriptions,
      incomes: incomes
        .filter((i) => {
          if (i.frequency !== "irregular") return true;
          const created = i.created_at ? new Date(i.created_at) : null;
          return created && created >= new Date(startTs) && created <= new Date(endTs);
        })
        .map((i) => ({
          ...i,
          convertedAmount: cx(Number(i.amount), i.currency || target),
        })),
      expenses,
      subscriptions: subscriptions.map((s) => ({
        ...s,
        convertedAmount: cx(Number(s.amount), s.currency),
        convertedMonthly: s.period === "yearly"
          ? cx(Number(s.amount), s.currency) / 12
          : cx(Number(s.amount), s.currency),
      })),
      goals,
      spendingByMerchant,
      rates,
      reminders,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
