/**
 * Helpers for data export: CSV serialization, option validation.
 */

export const EXPORT_SECTIONS = [
  "profile",
  "income",
  "expenses",
  "subscriptions",
  "goals",
  "allocations",
  "transactions",
] as const;

export type ExportSection = (typeof EXPORT_SECTIONS)[number];

export const EXPORT_SECTION_LABELS: Record<ExportSection, string> = {
  profile: "Profile",
  income: "Income",
  expenses: "Expenses",
  subscriptions: "Subscriptions",
  goals: "Goals",
  allocations: "Allocations",
  transactions: "Transactions",
};

export type ExportFormat = "json" | "csv";

export type ExportOptions = {
  format: ExportFormat;
  include: ExportSection[];
};

const EXPORT_OPTIONS_STORAGE_KEY = "fundigo-export-options";

function isValidSection(s: string): s is ExportSection {
  return EXPORT_SECTIONS.includes(s as ExportSection);
}

/** Read saved export options from localStorage. Returns null if missing or invalid. */
export function getStoredExportOptions(): ExportOptions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EXPORT_OPTIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { format?: string; include?: unknown };
    const format: ExportFormat = parsed.format === "csv" ? "csv" : "json";
    const include: ExportSection[] = Array.isArray(parsed.include)
      ? parsed.include.filter(isValidSection)
      : [];
    if (include.length === 0) return null;
    return { format, include };
  } catch {
    return null;
  }
}

/** Save export options to localStorage. */
export function setStoredExportOptions(options: ExportOptions): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXPORT_OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch {
    // ignore quota / private mode
  }
}

/** Default options when nothing is stored. */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "json",
  include: [...EXPORT_SECTIONS],
};

/** Safe fields only: no ids, user_id, created_at, updated_at, or internal refs. */
export const EXPORT_SAFE_FIELDS: Record<ExportSection, readonly string[]> = {
  profile: ["preferred_currency", "starting_balance", "profession", "primary_goal"],
  income: ["name", "amount", "currency", "frequency", "note"],
  expenses: ["merchant", "amount", "currency", "date", "category", "recorded_at", "details"],
  subscriptions: ["service_name", "plan", "amount", "currency", "period", "next_billing_date", "paused_until"],
  goals: ["name", "target_amount", "current_amount", "currency", "deadline"],
  allocations: ["amount", "spend_pct", "save_pct", "invest_pct", "keep_pct", "accepted", "save_target", "currency", "reasoning"],
  transactions: ["type", "amount", "currency", "description"],
};

function pickSafe<T extends Record<string, unknown>>(row: T, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in row) out[k] = row[k];
  }
  return out;
}

/** Sanitize a single row for export (only safe fields). */
export function sanitizeRowForExport(section: ExportSection, row: Record<string, unknown>): Record<string, unknown> {
  return pickSafe(row, EXPORT_SAFE_FIELDS[section]);
}

/** Sanitize profile (single object) or array of rows for export. */
export function sanitizeForExport(
  section: ExportSection,
  data: Record<string, unknown> | Record<string, unknown>[] | null
): Record<string, unknown> | Record<string, unknown>[] | null {
  if (data == null) return null;
  if (Array.isArray(data)) {
    return data.map((row) => sanitizeRowForExport(section, row));
  }
  return sanitizeRowForExport(section, data);
}

const DEFAULT_INCLUDE: ExportSection[] = [...EXPORT_SECTIONS];

function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Slimmer CSV columns (JSON export keeps full `EXPORT_SAFE_FIELDS`). */
export const EXPENSE_CSV_COLUMNS = ["merchant", "amount", "currency", "date", "category"] as const;
export const ALLOCATIONS_CSV_COLUMNS = [
  "amount",
  "spend_pct",
  "save_pct",
  "invest_pct",
  "keep_pct",
  "accepted",
  "save_target",
  "currency",
] as const;
export const TRANSACTIONS_CSV_COLUMNS = ["type", "amount", "currency"] as const;

export function pickCsvRow(row: Record<string, unknown>, columns: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const c of columns) out[c] = row[c] ?? "";
  return out;
}

/** Header row only (e.g. empty detail table). */
export function csvHeaderOnly(columns: readonly string[]): string {
  return columns.map(escapeCsvCell).join(",");
}

/** CSV with explicit column order (all rows must include at least these keys). */
export function toCsvColumns(rows: Record<string, unknown>[], columns: readonly string[]): string {
  if (rows.length === 0) return "";
  const header = columns.map(escapeCsvCell).join(",");
  const dataRows = rows.map((row) => columns.map((c) => escapeCsvCell(row[c])).join(","));
  return [header, ...dataRows].join("\r\n");
}

/** Turn array of objects into a CSV string (header row + data rows). */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]!);
  const header = keys.map(escapeCsvCell).join(",");
  const dataRows = rows.map((row) => keys.map((k) => escapeCsvCell(row[k])).join(","));
  return [header, ...dataRows].join("\r\n");
}

export function parseExportBody(body: unknown): ExportOptions {
  if (!body || typeof body !== "object" || !("format" in body)) {
    return { format: "json", include: DEFAULT_INCLUDE };
  }
  const b = body as { format?: string; include?: unknown };
  const format: ExportFormat =
    b.format === "csv" ? "csv" : "json";
  let include: ExportSection[] = DEFAULT_INCLUDE;
  if (Array.isArray(b.include) && b.include.length > 0) {
    const valid = b.include.filter((s): s is ExportSection =>
      typeof s === "string" && EXPORT_SECTIONS.includes(s as ExportSection)
    );
    if (valid.length > 0) include = valid;
  }
  return { format, include };
}
