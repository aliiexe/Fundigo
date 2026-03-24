import { convertSync } from "@/lib/exchange";
import {
  EXPENSE_CSV_COLUMNS,
  pickCsvRow,
  toCsvColumns,
  csvHeaderOnly,
} from "@/lib/exportData";

/** Aggregated expense totals for export (JSON + CSV sections). */
export type ExpenseExportSummary = {
  preferred_currency: string;
  /** One row per (category, original currency). */
  by_category: { category: string; amount: number; currency: string }[];
  /** Per category, all amounts converted to preferred_currency. */
  by_category_preferred: { category: string; amount: number }[];
  /** One row per currency (all categories). */
  by_currency: { currency: string; amount: number }[];
  /** Sum of all expenses converted to preferred_currency (rates at export time). */
  global_total_preferred: number;
  /** Profile starting balance in preferred_currency (for this export). */
  starting_balance: number;
  /** starting_balance − global_total_preferred. */
  remaining_after_expenses: number;
};

const UNCATEGORIZED = "(Uncategorized)";

export function computeExpenseExportSummary(
  rows: Array<Record<string, unknown>>,
  preferredCurrency: string,
  rates: Record<string, number>,
  startingBalance = 0
): ExpenseExportSummary {
  const catCur = new Map<string, number>();
  const catPreferred = new Map<string, number>();
  const curOnly = new Map<string, number>();
  let preferredSum = 0;

  for (const r of rows) {
    const amt = Number(r.amount);
    if (!Number.isFinite(amt)) continue;
    const cur = String(r.currency ?? "USD");
    const catRaw = r.category != null && String(r.category).trim() !== "" ? String(r.category).trim() : UNCATEGORIZED;
    const k = `${catRaw}\0${cur}`;
    catCur.set(k, (catCur.get(k) ?? 0) + amt);
    curOnly.set(cur, (curOnly.get(cur) ?? 0) + amt);
    const inPref = convertSync(amt, cur, preferredCurrency, rates);
    preferredSum += inPref;
    catPreferred.set(catRaw, (catPreferred.get(catRaw) ?? 0) + inPref);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const by_category_preferred = [...catPreferred.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const by_category = [...catCur.entries()]
    .map(([key, amount]) => {
      const [category, currency] = key.split("\0");
      return { category, amount: round2(amount), currency };
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.currency.localeCompare(b.currency));

  const by_currency = [...curOnly.entries()]
    .map(([currency, amount]) => ({ currency, amount: round2(amount) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  const global_total_preferred = round2(preferredSum);
  const start = round2(startingBalance);

  return {
    preferred_currency: preferredCurrency,
    by_category,
    by_category_preferred,
    by_currency,
    global_total_preferred,
    starting_balance: start,
    remaining_after_expenses: round2(start - global_total_preferred),
  };
}

/**
 * One expenses.csv with three tables (blank line between):
 * 1) Line items — merchant, amount, currency, date, category
 * 2) Totals by category — category, amount, currency (amounts in preferred currency)
 * 3) Balance — label, amount, currency (starting balance, total expenses, remaining)
 */
export function buildExpensesExportCsv(detailRows: Record<string, unknown>[], summary: ExpenseExportSummary): string {
  const pref = summary.preferred_currency;

  const part1 =
    detailRows.length > 0
      ? toCsvColumns(
          detailRows.map((r) => pickCsvRow(r, [...EXPENSE_CSV_COLUMNS])),
          [...EXPENSE_CSV_COLUMNS]
        )
      : csvHeaderOnly([...EXPENSE_CSV_COLUMNS]);

  const categoryCols = ["category", "amount", "currency"] as const;
  const part2 =
    summary.by_category_preferred.length > 0
      ? toCsvColumns(
          summary.by_category_preferred.map((x) => ({
            category: x.category,
            amount: x.amount,
            currency: pref,
          })) as Record<string, unknown>[],
          [...categoryCols]
        )
      : csvHeaderOnly([...categoryCols]);

  const part3Rows = [
    { label: "Starting balance", amount: summary.starting_balance, currency: pref },
    { label: "Total expenses", amount: summary.global_total_preferred, currency: pref },
    { label: "Remaining", amount: summary.remaining_after_expenses, currency: pref },
  ];
  const part3 = toCsvColumns(part3Rows, ["label", "amount", "currency"]);

  return [part1, part2, part3].join("\r\n\r\n");
}
