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
  sanitizeForExport,
  type ExportSection,
} from "@/lib/exportData";

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
    const data = {
      dateStr: raw.dateStr,
      user: include.includes("profile") ? sanitizeForExport("profile", raw.user) : null,
      income: include.includes("income") ? sanitizeForExport("income", raw.income) : raw.income,
      subscriptions: include.includes("subscriptions") ? sanitizeForExport("subscriptions", raw.subscriptions) : raw.subscriptions,
      expenses: include.includes("expenses") ? sanitizeForExport("expenses", raw.expenses) : raw.expenses,
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
      if (include.includes("expenses")) payload.expenses = data.expenses;
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
    if (include.includes("income") && data.income.length > 0) {
      csvFiles.push({
        name: `income-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(data.income as Record<string, unknown>[])),
      });
    }
    if (include.includes("subscriptions") && data.subscriptions.length > 0) {
      csvFiles.push({
        name: `subscriptions-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(data.subscriptions as Record<string, unknown>[])),
      });
    }
    if (include.includes("expenses") && data.expenses.length > 0) {
      csvFiles.push({
        name: `expenses-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(data.expenses as Record<string, unknown>[])),
      });
    }
    if (include.includes("goals") && data.goals.length > 0) {
      csvFiles.push({
        name: `goals-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(data.goals as Record<string, unknown>[])),
      });
    }
    if (include.includes("allocations") && data.allocations.length > 0) {
      csvFiles.push({
        name: `allocations-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(data.allocations as Record<string, unknown>[])),
      });
    }
    if (include.includes("transactions") && data.transactions.length > 0) {
      csvFiles.push({
        name: `transactions-${data.dateStr}.csv`,
        content: toCsv(rowsToCsvRows(data.transactions as Record<string, unknown>[])),
      });
    }

    // Empty sections still get a header-only CSV so user has the file
    if (include.includes("income") && data.income.length === 0) {
      csvFiles.push({ name: `income-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("subscriptions") && data.subscriptions.length === 0) {
      csvFiles.push({ name: `subscriptions-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("expenses") && data.expenses.length === 0) {
      csvFiles.push({ name: `expenses-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("goals") && data.goals.length === 0) {
      csvFiles.push({ name: `goals-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("allocations") && data.allocations.length === 0) {
      csvFiles.push({ name: `allocations-${data.dateStr}.csv`, content: toCsv([]) });
    }
    if (include.includes("transactions") && data.transactions.length === 0) {
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
