import type { SupabaseClient } from "@supabase/supabase-js";

export type Allocation = { spend: number; save: number; invest: number; keep?: number };

const BASE_ALPHA = 0.3;
const MIN_HISTORY_FOR_ADAPTIVE = 3;
const MAX_HISTORY = 12;

export type Preset = "student" | "standard" | "aggressive";

export const PRESETS: Record<Preset, Allocation> = {
  student:    { spend: 60, save: 30, invest: 10 },
  standard:   { spend: 50, save: 30, invest: 20 },
  aggressive: { spend: 40, save: 40, invest: 20 },
};

export const PRESET_LABELS: Record<Preset, string> = {
  student: "Student (60 / 30 / 10)",
  standard: "Standard (50 / 30 / 20)",
  aggressive: "Aggressive Saver (40 / 40 / 20)",
};

const PRESET_DESCRIPTIONS: Record<Preset, string> = {
  student: "Student",
  standard: "Standard",
  aggressive: "Aggressive saver",
};

/** Build clear, deterministic reasoning for an allocation (no AI). */
export function buildAllocationReasoning(opts: {
  amount: number;
  suggested: Allocation;
  preset: Preset;
  isAdaptive: boolean;
  goalNames: string[];
  currency: string;
}): string {
  const { amount, suggested, preset, isAdaptive, goalNames, currency } = opts;
  const spendAmt = (amount * (suggested.spend / 100));
  const saveAmt = (amount * ((suggested.save ?? 0) / 100));
  const investAmt = (amount * ((suggested.invest ?? 0) / 100));
  const keepAmt = (amount * ((suggested.keep ?? 0) / 100));
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

  const parts: string[] = [];
  parts.push(`On ${fmt(amount)}: ${suggested.spend}% to spend (${fmt(spendAmt)}), ${suggested.save ?? 0}% to save (${fmt(saveAmt)}), ${suggested.invest ?? 0}% to invest (${fmt(investAmt)}).`);
  if (keepAmt > 0) parts.push(`${suggested.keep}% kept as buffer (${fmt(keepAmt)}).`);
  parts.push(`This follows the ${PRESET_DESCRIPTIONS[preset]} preset.`);
  if (isAdaptive) parts.push("Adjusted slightly based on your past accepted allocations.");
  if (goalNames.length > 0) parts.push(`Your save portion can go toward: ${goalNames.slice(0, 3).join(", ")}.`);

  return parts.join(" ");
}

function normalize(a: Allocation): Allocation {
  const total = a.spend + a.save + a.invest + (a.keep ?? 0);
  if (total === 0) return { ...PRESETS.standard };
  return {
    spend: Math.round((a.spend / total) * 100),
    save: Math.round((a.save / total) * 100),
    invest: Math.round((a.invest / total) * 100),
    keep: Math.round(((a.keep ?? 0) / total) * 100),
  };
}

function emaStep(current: Allocation, previous: Allocation, alpha: number): Allocation {
  return {
    spend: alpha * current.spend + (1 - alpha) * previous.spend,
    save: alpha * current.save + (1 - alpha) * previous.save,
    invest: alpha * current.invest + (1 - alpha) * previous.invest,
    keep: alpha * (current.keep ?? 0) + (1 - alpha) * (previous.keep ?? 0),
  };
}

export function detectPreset(profession: string | null): Preset {
  const p = (profession || "").toLowerCase();
  if (p.includes("student")) return "student";
  if (p.includes("aggressive") || p.includes("saver")) return "aggressive";
  return "standard";
}

/**
 * Compute actual spending ratios from real financial data.
 * actual_spend_pct = (expenses + subs) / income
 * actual_save_pct  = whatever the user put in savings goals this period
 * actual_invest_pct = remainder or inferred
 */
async function computeActualRatios(
  supabase: SupabaseClient,
  userId: string
): Promise<Allocation | null> {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const start = threeMonthsAgo.toISOString().slice(0, 10);

  const [incomesRes, expensesRes, subsRes, goalsRes] = await Promise.all([
    supabase.from("income_sources").select("amount, frequency").eq("user_id", userId),
    supabase.from("expenses").select("amount").eq("user_id", userId).gte("date", start),
    supabase.from("subscriptions").select("amount, period").eq("user_id", userId),
    supabase.from("goals").select("current_amount").eq("user_id", userId),
  ]);

  let monthlyIncome = 0;
  for (const i of incomesRes.data ?? []) {
    if (i.frequency === "irregular") monthlyIncome += Number(i.amount);
    else if (i.frequency === "monthly") monthlyIncome += Number(i.amount);
    else if (i.frequency === "yearly") monthlyIncome += Number(i.amount) / 12;
    else if (i.frequency === "weekly") monthlyIncome += Number(i.amount) * 4.33;
    else if (i.frequency === "biweekly") monthlyIncome += Number(i.amount) * 2.17;
  }

  if (monthlyIncome <= 0) return null;

  const months = Math.max(1, Math.ceil((now.getTime() - threeMonthsAgo.getTime()) / (30 * 86400000)));
  const totalExpenses = (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const avgMonthlyExpenses = totalExpenses / months;

  let monthlySubs = 0;
  for (const s of subsRes.data ?? []) {
    monthlySubs += s.period === "yearly" ? Number(s.amount) / 12 : Number(s.amount);
  }

  const totalSavedInGoals = (goalsRes.data ?? []).reduce((s, g) => s + Number(g.current_amount), 0);
  const avgMonthlySaved = totalSavedInGoals / Math.max(months, 3);

  const spendPct = Math.min(100, ((avgMonthlyExpenses + monthlySubs) / monthlyIncome) * 100);
  const savePct = Math.min(100 - spendPct, (avgMonthlySaved / monthlyIncome) * 100);
  const investPct = Math.max(0, 100 - spendPct - savePct);

  return { spend: spendPct, save: savePct, invest: investPct, keep: 0 };
}

export type SuggestionResult = {
  suggested: Allocation;
  preset: Preset;
  isAdaptive: boolean;
  historyCount: number;
  emaWeight: number;
};

export async function suggestAllocation(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  profession: string | null,
  isE2E: boolean = false
): Promise<SuggestionResult> {
  const preset = detectPreset(profession);
  const baseline = { ...PRESETS[preset] };

  if (isE2E) {
    return { suggested: normalize(baseline), preset, isAdaptive: false, historyCount: 0, emaWeight: 0 };
  }

  const { data: pastAllocations } = await supabase
    .from("allocations")
    .select("spend_pct, save_pct, invest_pct, keep_pct")
    .eq("user_id", userId)
    .eq("accepted", true)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY);

  const historyCount = pastAllocations?.length ?? 0;

  if (historyCount < MIN_HISTORY_FOR_ADAPTIVE) {
    return { suggested: normalize(baseline), preset, isAdaptive: false, historyCount, emaWeight: 0 };
  }

  const actualRatios = await computeActualRatios(supabase, userId);

  let behaviorEMA: Allocation = {
    spend: pastAllocations![0].spend_pct,
    save: pastAllocations![0].save_pct,
    invest: pastAllocations![0].invest_pct,
    keep: pastAllocations![0].keep_pct ?? 0,
  };
  for (let i = 1; i < pastAllocations!.length; i++) {
    behaviorEMA = emaStep(
      {
        spend: pastAllocations![i].spend_pct,
        save: pastAllocations![i].save_pct,
        invest: pastAllocations![i].invest_pct,
        keep: pastAllocations![i].keep_pct ?? 0,
      },
      behaviorEMA,
      BASE_ALPHA
    );
  }

  if (actualRatios) {
    behaviorEMA = emaStep(actualRatios, behaviorEMA, BASE_ALPHA);
  }

  const emaWeight = Math.min(0.8, historyCount / (MAX_HISTORY + 2));
  const blended = emaStep(behaviorEMA, baseline, emaWeight);
  const suggested = normalize(blended);

  return { suggested, preset, isAdaptive: true, historyCount, emaWeight };
}
