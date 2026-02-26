const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const TEXT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1-0528:free",
  "google/gemma-3-27b-it:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];
const VISION_MODEL = "google/gemma-3-27b-it:free";

function getApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

type Message = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

type ChatOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

async function tryModel(
  key: string,
  model: string,
  messages: Message[],
  opts: ChatOptions
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Fundigo",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`[AI] ${model} returned ${res.status}: ${body.slice(0, 200)}`);
    return { ok: false, status: res.status };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text ? { ok: true, text } : { ok: false, status: 0 };
}

async function chat(messages: Message[], opts: ChatOptions = {}): Promise<string | null> {
  const key = getApiKey();
  if (!key) return null;

  const models = opts.model ? [opts.model] : TEXT_MODELS;

  for (const model of models) {
    try {
      const result = await tryModel(key, model, messages, opts);
      if (result.ok) return result.text;
      if (result.status !== 429 && result.status !== 503) return null;
    } catch (e) {
      console.error(`[AI] ${model} request failed:`, e);
    }
  }

  console.error("[AI] All models exhausted or rate-limited");
  return null;
}

// ── Receipt parsing via vision model ──────────────────────────────────────

export type ParsedReceipt = {
  merchant: string;
  amount: number;
  date: string;
  currency: string;
  items: string[];
};

export async function parseReceiptImage(base64Image: string): Promise<ParsedReceipt | null> {
  const dataUrl = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const result = await chat(
    [
      {
        role: "system",
        content:
          'You are a receipt parser. Extract merchant name, total amount, date, currency, and line items from the receipt image. Respond ONLY with valid JSON: {"merchant":"...","amount":0.00,"date":"YYYY-MM-DD","currency":"USD","items":["item1","item2"]}. If you cannot parse a field, use reasonable defaults (merchant: "Unknown", amount: 0, date: today, currency: "USD", items: []).',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Parse this receipt:" },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    { model: VISION_MODEL, temperature: 0.1, max_tokens: 512 }
  );

  if (!result) return null;

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      merchant: String(parsed.merchant || "Unknown"),
      amount: Number(parsed.amount) || 0,
      date: parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
        ? parsed.date
        : new Date().toISOString().slice(0, 10),
      currency: String(parsed.currency || "USD").toUpperCase(),
      items: Array.isArray(parsed.items) ? parsed.items.map(String) : [],
    };
  } catch {
    console.error("[AI] Failed to parse receipt JSON:", result);
    return null;
  }
}

// ── Expense auto-categorization ───────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment",
  "Bills & Utilities", "Health & Medical", "Education", "Travel",
  "Personal Care", "Gifts & Donations", "Investments", "Other",
];

export async function categorizeExpense(
  merchant: string,
  amount: number
): Promise<string> {
  const result = await chat([
    {
      role: "system",
      content: `You are a financial categorizer. Given a merchant name and amount, classify the expense into exactly one of these categories: ${DEFAULT_CATEGORIES.join(", ")}. Respond with ONLY the category name, nothing else.`,
    },
    {
      role: "user",
      content: `Merchant: "${merchant}", Amount: ${amount}`,
    },
  ], { temperature: 0.1, max_tokens: 30 });

  if (result && DEFAULT_CATEGORIES.some((c) => result.includes(c))) {
    return DEFAULT_CATEGORIES.find((c) => result.includes(c)) || "Other";
  }
  return "Other";
}

// ── Smart allocation reasoning ────────────────────────────────────────────

type FinancialContext = {
  profession: string | null;
  primary_goal: string | null;
  monthly_income: number;
  monthly_expenses: number;
  monthly_subscriptions: number;
  goals: Array<{ name: string; target: number; current: number }>;
  allocation: { spend: number; save: number; invest: number; keep: number };
  amount: number;
};

export async function generateAllocationReasoning(
  ctx: FinancialContext
): Promise<{ reasoning: string; etaGoal?: string } | null> {
  const goalsSummary = ctx.goals.length > 0
    ? ctx.goals.map((g) => `"${g.name}": ${g.current}/${g.target}`).join(", ")
    : "none set";

  const result = await chat([
    {
      role: "system",
      content:
        "You are a personal finance advisor. Given a user's financial context and a suggested allocation split, provide a brief 2-3 sentence explanation of why this split makes sense. If they have savings goals, estimate how long to reach the nearest goal. Be encouraging and practical. Keep it under 100 words.",
    },
    {
      role: "user",
      content: `Profile: ${ctx.profession || "not specified"}, Goal: ${ctx.primary_goal || "not specified"}
Monthly income: $${ctx.monthly_income.toFixed(0)}, Expenses: $${ctx.monthly_expenses.toFixed(0)}, Subscriptions: $${ctx.monthly_subscriptions.toFixed(0)}
Savings goals: ${goalsSummary}
Amount received: $${ctx.amount.toFixed(2)}
Suggested split: Spend ${ctx.allocation.spend}%, Save ${ctx.allocation.save}%, Invest ${ctx.allocation.invest}%, Keep ${ctx.allocation.keep}%
Provide reasoning and ETA to nearest goal if applicable.`,
    },
  ], { temperature: 0.5, max_tokens: 200 });

  if (!result) return null;

  const etaMatch = result.match(/(\d+\s*(?:month|week|year)s?)/i);
  return {
    reasoning: result,
    etaGoal: etaMatch ? etaMatch[1] : undefined,
  };
}

// ── AI-powered financial recommendations ──────────────────────────────────

type SpendingProfile = {
  profession: string | null;
  primary_goal: string | null;
  currency: string;
  monthly_income: number;
  total_expenses: number;
  total_subscriptions: number;
  subscriptions: Array<{ name: string; amount: number; period: string; months_active: number }>;
  top_spending: Array<{ merchant: string; amount: number }>;
  savings_rate: number;
  goals: Array<{ name: string; target: number; current: number; deadline: string | null }>;
  income_sources: Array<{ name: string; amount: number; frequency: string }>;
};

export async function generateSmartRecommendations(
  profile: SpendingProfile
): Promise<string[] | null> {
  const c = profile.currency || "USD";
  const subsList = profile.subscriptions
    .map((s) => `${s.name}: ${c} ${s.amount}/${s.period} (${s.months_active}mo)`)
    .join("; ");
  const spendingList = profile.top_spending
    .map((s) => `${s.merchant}: ${c} ${s.amount}`)
    .join("; ");
  const goalsList = profile.goals
    .map((g) => `"${g.name}": ${c} ${g.current}/${c} ${g.target}${g.deadline ? ` by ${g.deadline}` : ""}`)
    .join("; ");
  const incomeList = profile.income_sources
    .map((i) => `${i.name}: ${c} ${i.amount}/${i.frequency}`)
    .join("; ");

  const isStudent = (profile.profession || "").toLowerCase().includes("student");
  const hasIrregularIncome = profile.income_sources.some((i) => i.frequency === "irregular");

  const result = await chat([
    {
      role: "system",
      content: `You are a supportive personal financial advisor for Fundigo, a finance app. Give SPECIFIC recommendations based on the user's actual data. Be encouraging and constructive — never judge or belittle.

Rules:
- If student: suggest student-specific strategies (discounts, campus resources, part-time gigs, shared costs).
- If irregular income: focus on percentage-based savings, cash flow buffers, and saving extra on good months.
- Reference actual subscription names, spending categories, goal names, and income sources from their data.
- Each tip MUST be specific to their situation — no generic "save more" or "spend less" advice.
- All amounts should use ${c} as the currency.
- Be warm and motivating. Frame everything as achievable steps, not criticism.
- Return ONLY a JSON array of 3-5 strings. Each string is one specific, actionable, encouraging sentence.`,
    },
    {
      role: "user",
      content: `MY PROFILE:
- Profession: ${profile.profession || "not specified"}
- Primary financial goal: ${profile.primary_goal || "not specified"}${isStudent ? "\n- I'm a student" : ""}${hasIrregularIncome ? "\n- My income is irregular" : ""}

INCOME (${c} ${profile.monthly_income.toFixed(0)}/month):
${incomeList || "No income sources recorded"}

SPENDING:
- Monthly expenses: ${c} ${profile.total_expenses.toFixed(0)}
- Monthly subscriptions: ${c} ${profile.total_subscriptions.toFixed(0)}
- Savings rate: ${(profile.savings_rate * 100).toFixed(0)}%
- Top spending: ${spendingList || "none recorded"}

SUBSCRIPTIONS: ${subsList || "none"}

GOALS: ${goalsList || "none set"}

Give me 3-5 personalized recommendations.`,
    },
  ], { temperature: 0.4, max_tokens: 500 });

  if (!result) return null;

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const tips = JSON.parse(jsonMatch[0]);
    return Array.isArray(tips) ? tips.filter((t: unknown) => typeof t === "string").slice(0, 5) : null;
  } catch {
    console.error("[AI] Failed to parse recommendations JSON:", result);
    return null;
  }
}

// ── AI-powered goal advice ────────────────────────────────────────────────

type GoalAdviceContext = {
  goal: { name: string; target: number; current: number; deadline: string | null };
  financials: {
    monthly_income: number;
    monthly_expenses: number;
    monthly_subscriptions: number;
    starting_balance: number;
  };
  profile: { profession: string | null; primary_goal: string | null };
  currency: string;
  income_sources: Array<{ name: string; amount: number; frequency: string }>;
  subscriptions: Array<{ name: string; amount: number }>;
  other_goals: Array<{ name: string; target: number; current: number }>;
};

export async function generateGoalAdvice(
  ctx: GoalAdviceContext
): Promise<{ achievable: boolean; advice: string; monthly_needed: number } | null> {
  const { goal, financials, profile, currency, income_sources, subscriptions, other_goals } = ctx;
  const remaining = Math.max(0, goal.target - goal.current);
  const monthlySavings = financials.monthly_income - financials.monthly_expenses - financials.monthly_subscriptions;

  let monthsLeft = 0;
  if (goal.deadline) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    monthsLeft = Math.max(0, (deadline.getFullYear() - now.getFullYear()) * 12 + deadline.getMonth() - now.getMonth());
  }

  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  const isStudent = (profile.profession || "").toLowerCase().includes("student");
  const hasIrregularIncome = income_sources.some((i) => i.frequency === "irregular");
  const totalOtherGoalGap = other_goals.reduce((s, g) => s + Math.max(0, g.target - g.current), 0);
  const progressPct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;

  const c = currency;
  const incomeDetail = income_sources.length > 0
    ? income_sources.map((i) => `${i.name}: ${c} ${i.amount}/${i.frequency}`).join(", ")
    : "no income sources recorded yet";
  const subDetail = subscriptions.length > 0
    ? subscriptions.map((s) => `${s.name}: ${c} ${s.amount}/mo`).join(", ")
    : "none";
  const otherGoalsDetail = other_goals.length > 0
    ? other_goals.map((g) => `"${g.name}" (${c} ${g.current} of ${c} ${g.target})`).join(", ")
    : "none";

  const result = await chat([
    {
      role: "system",
      content: `You are a supportive and encouraging personal finance coach inside a budgeting app. Your job is to give HELPFUL, SPECIFIC, and ENCOURAGING advice to help this person reach their savings goal.

TONE RULES (very important):
- Be warm, supportive, and motivating. Never be condescending, dismissive, or judgmental.
- Celebrate any progress they've already made, even if small.
- If their goal is ambitious, frame it as a challenge they can work toward — never mock or belittle them.
- Use "you" to speak directly to the user. Be conversational, like a knowledgeable friend.

CONTENT RULES:
- Give a clear YES/NO verdict on whether the goal is achievable by the deadline (if there is one).
- Calculate and state the exact monthly savings needed.
- If they're a student: suggest student-specific strategies (student discounts, meal prep, campus jobs, tutoring side gigs, selling old textbooks, free entertainment options).
- If they have irregular income: suggest saving a percentage (e.g., 30-40%) of each payment received rather than a fixed amount, and building a buffer on good months.
- If there are subscriptions, look at them individually and suggest which specific ones could be paused or downgraded to help reach the goal faster.
- If the goal seems unreachable by the deadline: be honest but kind — suggest extending the deadline or finding additional income, and show them a realistic alternative timeline.
- If they have competing goals, acknowledge the tradeoff and suggest which to prioritize.
- Reference their actual data by name (income sources, subscriptions, other goals).

FORMAT: Write 5-8 sentences of flowing advice. Do NOT use bullet points or numbered lists — write as natural paragraphs. All amounts should use ${c} as the currency.`,
    },
    {
      role: "user",
      content: `MY PROFILE: ${profile.profession || "not specified"}, main financial priority: ${profile.primary_goal || "not set"}${isStudent ? " — I'm a student" : ""}${hasIrregularIncome ? " — my income is irregular/unpredictable" : ""}

MY GOAL: "${goal.name}"
- Target: ${c} ${goal.target.toFixed(0)}
- Saved so far: ${c} ${goal.current.toFixed(0)} (${progressPct}% done)
- Still need: ${c} ${remaining.toFixed(0)}
${goal.deadline ? `- Deadline: ${goal.deadline} (${monthsLeft} month${monthsLeft !== 1 ? "s" : ""} left)` : "- No deadline set"}
${monthsLeft > 0 ? `- To hit deadline: need to save ${c} ${monthlyNeeded.toFixed(0)} per month` : ""}

MY FINANCES THIS MONTH:
- Starting balance: ${c} ${financials.starting_balance.toFixed(0)}
- Monthly income: ${c} ${financials.monthly_income.toFixed(0)} (from: ${incomeDetail})
- Monthly expenses: ${c} ${financials.monthly_expenses.toFixed(0)}
- Monthly subscriptions: ${c} ${financials.monthly_subscriptions.toFixed(0)} (${subDetail})
- Free cash after spending: ${c} ${monthlySavings.toFixed(0)}/month

OTHER GOALS I'M SAVING FOR: ${otherGoalsDetail}${totalOtherGoalGap > 0 ? ` (${c} ${totalOtherGoalGap.toFixed(0)} total remaining across all)` : ""}

Based on all of this, can I reach "${goal.name}"? What's your advice?`,
    },
  ], { temperature: 0.5, max_tokens: 600 });

  return {
    achievable: monthsLeft === 0 || monthlyNeeded <= Math.max(monthlySavings, 0),
    advice: result || (monthlyNeeded <= Math.max(monthlySavings, 0)
      ? `Great news! You need to save about ${c} ${monthlyNeeded.toFixed(0)} per month, and you currently have ${c} ${Math.max(monthlySavings, 0).toFixed(0)} available each month. This goal is very achievable — just stay consistent with your savings.`
      : `You'd need ${c} ${monthlyNeeded.toFixed(0)} per month to hit your target, but you currently have ${c} ${Math.max(monthlySavings, 0).toFixed(0)} free each month. Consider extending your deadline or finding ways to boost your income — you'll get there, it just might take a bit longer.`),
    monthly_needed: monthlyNeeded,
  };
}
