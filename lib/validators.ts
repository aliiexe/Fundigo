import { z } from "zod";
import { SUPPORTED_CURRENCY_CODES } from "@/lib/currency";

const currencySchema = z
  .string()
  .length(3)
  .refine(
    (c): c is (typeof SUPPORTED_CURRENCY_CODES)[number] =>
      (SUPPORTED_CURRENCY_CODES as readonly string[]).includes(c),
    { message: "Unsupported currency" }
  );

export const ensureUserBody = z.object({
  profession: z.string().optional(),
  primary_goal: z.string().optional(),
  preferred_currency: currencySchema.optional(),
  starting_balance: z.number().nonnegative().optional(),
  complete_onboarding: z.boolean().optional(),
});

export const addIncomeBody = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "yearly", "irregular"]),
  note: z.string().optional(),
});

export const addSubscriptionBody = z.object({
  service_name: z.string().min(1),
  plan: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: currencySchema.default("USD"),
  period: z.enum(["monthly", "yearly"]),
  next_billing_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const addExpenseManualBody = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  currency: currencySchema.default("USD"),
  category: z.string().optional(),
  category_id: z.string().uuid().optional(),
  raw_text: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const allocationsSuggestBody = z.object({ amount: z.number().positive() });
export const allocationsAcceptBody = z.object({
  allocation_id: z.string().uuid(),
  spend_pct: z.number().min(0).max(100).optional(),
  save_pct: z.number().min(0).max(100).optional(),
  invest_pct: z.number().min(0).max(100).optional(),
  keep_pct: z.number().min(0).max(100).optional(),
  save_target: z.enum(["savings", "goal"]).optional(),
  goal_id: z.string().uuid().optional(),
});

export const createGoalBody = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  current_amount: z.number().nonnegative().optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const dashboardQuery = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});
