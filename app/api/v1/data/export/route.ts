import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { checkRateLimit } from "@/utils/rateLimiter";
import { auditLog } from "@/utils/logger";
import {
  parseExportBody,
  toCsv,
  toCsvColumns,
  pickCsvRow,
  sanitizeForExport,
  ALLOCATIONS_CSV_COLUMNS,
  TRANSACTIONS_CSV_COLUMNS,
  type ExportSection,
} from "@/lib/exportData";
import { computeExpenseExportSummary, buildExpensesExportCsv } from "@/lib/expenseExportSummary";
import { decryptText } from "@/lib/crypto";
import { getRates } from "@/lib/exchange";

export const dynamic = "force-dynamic";

async function fetchSections(
  supabase: ReturnType<typeof createServerClient>,
  dbUserId: string,
  include: ExportSection[]
) {
  const set = new Set(include);
  const dateStr = new Date().toISOString().slice(0, 10);

  const [userRow, income, subscriptions, expenses, goals, allocations, transactions] =
    await Promise.all([
      set.has("profile")
        ? supabase.from("users").select("*").eq("id", dbUserId).single()
        : Promise.resolve({ data: null }),
      set.has("income")
        ? supabase
            .from("income_sources")
            .select("*")
            .eq("user_id", dbUserId)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      set.has("subscriptions")
        ? supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", dbUserId)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      set.has("expenses")
        ? supabase
            .from("expenses")
            .select("*")
            .eq("user_id", dbUserId)
            .order("date", { ascending: false })
        : Promise.resolve({ data: [] }),
      set.has("goals")
        ? supabase
            .from("goals")
            .select("*")
            .eq("user_id", dbUserId)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
      set.has("allocations")
        ? supabase
            .from("allocations")
            .select("*")
            .eq("user_id", dbUserId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      set.has("transactions")
        ? supabase
            .from("transactions")
            .select("*")
            .eq("user_id", dbUserId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

  return {
    dateStr,
    user: userRow?.data ?? null,
    income: income?.data ?? [],
    subscriptions: subscriptions?.data ?? [],
    expenses: expenses?.data ?? [],
    goals: goals?.data ?? [],
    allocations: allocations?.data ?? [],
    transactions: transactions?.data ?? [],
  };
}

function rowsToCsvRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => ({ ...r }));
}

function decryptExpenseCipher(cipher: string | null | undefined): string {
  if (cipher == null || cipher === "") return "";
  try {
    const p = JSON.parse(cipher) as { ciphertext?: string; iv?: string; tag?: string };
    if (p.ciphertext && p.iv && p.tag) return decryptText(p.ciphertext, p.iv, p.tag);
  } catch {
    return cipher;
  }
  return cipher;
}

async function buildExportExpenseRows(
  supabase: ReturnType<typeof createServerClient>,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const catIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean))] as string[];
  const idToName: Record<string, string> = {};
  if (catIds.length > 0) {
    const { data } = await supabase.from("categories").select("id, name").in("id", catIds);
    for (const c of data ?? []) {
      if (c && typeof c === "object" && "id" in c && "name" in c) {
        idToName[String(c.id)] = String(c.name);
      }
    }
  }

  return rows.map((r) => {
    const merchant = decryptExpenseCipher(r.merchant_cipher as string | undefined) || "Expense";
    const details = decryptExpenseCipher(r.raw_text_cipher as string | undefined);
    const catId = r.category_id as string | null | undefined;
    const category = catId ? idToName[catId] ?? "" : "";
    const created = r.created_at as string | null | undefined;
    const recorded_at = created ? new Date(created).toISOString() : "";

    return {
      merchant,
      amount: Number(r.amount),
      currency: r.currency,
      date: r.date,
      category,
      recorded_at,
      details,
    };
  });
}

export async function POST(request: Request) {
  const forwarded =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const { ok } = checkRateLimit(forwarded, "export");
  if (!ok) {
    return NextResponse.json({ error: "Too many requests", retryAfter: 60 }, { status: 429 });
  }
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { format, include } = parseExportBody(body);

    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) {
      return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    }
    const dbUserId = u.id;

    const raw = await fetchSections(supabase, dbUserId, include);
    const expenseExportRows = include.includes("expenses")
      ? await buildExportExpenseRows(supabase, raw.expenses as Record<string, unknown>[])
      : [];

    const expensesSanitized = include.includes("expenses")
      ? (sanitizeForExport("expenses", expenseExportRows) as Record<string, unknown>[])
      : null;
    const preferredCurrency = u.preferred_currency ?? "USD";
    const startingBalance = Number(u.starting_balance) || 0;
    const expensesSummary = include.includes("expenses")
      ? computeExpenseExportSummary(
          expensesSanitized ?? [],
          preferredCurrency,
          await getRates("USD"),
          startingBalance
        )
      : null;

    const data = {
      dateStr: raw.dateStr,
      user: include.includes("profile") ? sanitizeForExport("profile", raw.user) : null,
      income: include.includes("income") ? sanitizeForExport("income", raw.income) : raw.income,
      subscriptions: include.includes("subscriptions") ? sanitizeForExport("subscriptions", raw.subscriptions) : raw.subscriptions,
      expenses: include.includes("expenses") ? expensesSanitized : raw.expenses,
      expenses_summary: expensesSummary,
      goals: include.includes("goals") ? sanitizeForExport("goals", raw.goals) : raw.goals,
      allocations: include.includes("allocations") ? sanitizeForExport("allocations", raw.allocations) : raw.allocations,
      transactions: include.includes("transactions") ? sanitizeForExport("transactions", raw.transactions) : raw.transactions,
    };

    await auditLog(supabase, dbUserId, "data_export", { format, include });

    if (format === "json") {
      const payload: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };
      if (include.includes("profile")) payload.user = data.user;
      if (include.includes("income")) payload.income_sources = data.income;
      if (include.includes("subscriptions")) payload.subscriptions = data.subscriptions;
      if (include.includes("expenses")) {
        payload.expenses = data.expenses;
        if (data.expenses_summary) payload.expenses_summary = data.expenses_summary;
      }
      if (include.includes("goals")) payload.goals = data.goals;
      if (include.includes("allocations")) payload.allocations = data.allocations;
      if (include.includes("transactions")) payload.transactions = data.transactions;

      const filename = `fundigo-export-${data.dateStr}.json`;
      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // CSV: one file per section; if multiple, zip
    const csvFiles: { name: string; content: string }[] = [];
    if (include.includes("profile")) {
      csvFiles.push({
        name: `profile-${data.dateStr}.csv`,
        content: toCsv(
          data.user
            ? rowsToCsvRows([data.user as Record<string, unknown>])
            : []
        ),
      });
    }
    const incomeRows = Array.isArray(data.income) ? data.income : [];
    const subscriptionsRows = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const expensesRows = Array.isArray(data.expenses) ? data.expenses : [];
    const goalsRows = Array.isArray(data.goals) ? data.goals : [];
    const allocationsRows = Array.isArray(data.allocations) ? data.allocations : [];
    const transactionsRows = Array.isArray(data.transactions) ? data.transactions : [];

    if (include.includes("income") && incomeRows.length > 0) {
      csvFiles.push({
        name: `income-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(incomeRows as Record<string, unknown>[])),
      });
    }
    if (include.includes("subscriptions") && subscriptionsRows.length > 0) {
      csvFiles.push({
        name: `subscriptions-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(subscriptionsRows as Record<string, unknown>[])),
      });
    }
    if (include.includes("expenses") && data.expenses_summary != null) {
      csvFiles.push({
        name: `expenses-${data.dateStr}.csv`,
        content: buildExpensesExportCsv(expensesRows as Record<string, unknown>[], data.expenses_summary),
      });
    }
    if (include.includes("goals") && goalsRows.length > 0) {
      csvFiles.push({
        name: `goals-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(goalsRows as Record<string, unknown>[])),
      });
    }
    if (include.includes("allocations") && allocationsRows.length > 0) {
      csvFiles.push({
        name: `allocations-${data.dateStr}.csv`,
        content: toCsvColumns(
          (allocationsRows as Record<string, unknown>[]).map((r) => pickCsvRow(r, [...ALLOCATIONS_CSV_COLUMNS])),
          [...ALLOCATIONS_CSV_COLUMNS]
        ),
      });
    }
    if (include.includes("transactions") && transactionsRows.length > 0) {
      csvFiles.push({
        name: `transactions-${data.dateStr}.csv`,
        content: toCsvColumns(
          (transactionsRows as Record<string, unknown>[]).map((r) => pickCsvRow(r, [...TRANSACTIONS_CSV_COLUMNS])),
          [...TRANSACTIONS_CSV_COLUMNS]
        ),
      });
    }

    // Empty sections still get a header-only CSV so user has the file
    if (include.includes("income") && incomeRows.length === 0) {
      csvFiles.push({ name: `income-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("subscriptions") && subscriptionsRows.length === 0) {
      csvFiles.push({ name: `subscriptions-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("goals") && goalsRows.length === 0) {
      csvFiles.push({ name: `goals-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("allocations") && allocationsRows.length === 0) {
      csvFiles.push({ name: `allocations-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("transactions") && transactionsRows.length === 0) {
      csvFiles.push({ name: `transactions-${data.dateStr}.csv`, content: toCsv([]) });
    }

    if (csvFiles.length === 0) {
      // Only profile selected and null, or no data at all: single CSV
      const filename = `fundigo-export-${data.dateStr}.csv`;
      return new NextResponse("", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (csvFiles.length === 1) {
      const filename = csvFiles[0]!.name;
      return new NextResponse(csvFiles[0]!.content, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const zip = new JSZip();
    for (const f of csvFiles) {
      zip.file(f.name, f.content);
    }
    const zipBlob = await zip.generateAsync({ type: "nodebuffer" });
    const filename = `fundigo-export-${data.dateStr}.zip`;
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[data/export]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
