/**
 * Zod schemas for API request/response validation.
 */

import { z } from 'zod';

export const ensureUserBody = z.object({
  profession: z.string().optional(),
  primary_goal: z.string().optional(),
});

export const addIncomeBody = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'yearly', 'irregular']),
  note: z.string().optional(),
});

export const addSubscriptionBody = z.object({
  service_name: z.string().min(1),
  plan: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  period: z.enum(['monthly', 'yearly']),
  next_billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const addExpenseManualBody = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  category_id: z.string().uuid().optional(),
  raw_text: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const allocationsSuggestBody = z.object({
  amount: z.number().positive(),
});

export const allocationsAcceptBody = z.object({
  allocation_id: z.string().uuid(),
});

export const createGoalBody = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  current_amount: z.number().nonnegative().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const dashboardQuery = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export type EnsureUserBody = z.infer<typeof ensureUserBody>;
export type AddIncomeBody = z.infer<typeof addIncomeBody>;
export type AddSubscriptionBody = z.infer<typeof addSubscriptionBody>;
export type AddExpenseManualBody = z.infer<typeof addExpenseManualBody>;
export type AllocationsSuggestBody = z.infer<typeof allocationsSuggestBody>;
export type AllocationsAcceptBody = z.infer<typeof allocationsAcceptBody>;
export type CreateGoalBody = z.infer<typeof createGoalBody>;
export type DashboardQuery = z.infer<typeof dashboardQuery>;
