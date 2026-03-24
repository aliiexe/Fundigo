/**
 * Preset expense category labels — must match what we store in `categories.name`.
 */
export const EXPENSE_CATEGORY_PRESET_VALUES = [
  "Food & dining",
  "Transport",
  "Shopping",
  "Bills & utilities",
  "Entertainment",
  "Health & fitness",
  "Travel",
] as const;

export const EXPENSE_CATEGORY_OTHER = "__other__";

export const expenseCategoryPresetOptions = EXPENSE_CATEGORY_PRESET_VALUES.map((v) => ({
  value: v,
  label: v,
}));

export function expenseCategoryDropdownOptions(mode: "add" | "edit"): { value: string; label: string }[] {
  const first =
    mode === "add"
      ? { value: "", label: "Suggest automatically" }
      : { value: "", label: "No category" };
  return [first, ...expenseCategoryPresetOptions, { value: EXPENSE_CATEGORY_OTHER, label: "Other…" }];
}

/** Map stored category name from API → form preset + custom (for Other). */
export function categoryFormFromStored(name?: string | null): { preset: string; custom: string } {
  if (!name?.trim()) return { preset: "", custom: "" };
  const t = name.trim();
  const found = (EXPENSE_CATEGORY_PRESET_VALUES as readonly string[]).find(
    (p) => p.toLowerCase() === t.toLowerCase()
  );
  if (found) return { preset: found, custom: "" };
  return { preset: EXPENSE_CATEGORY_OTHER, custom: t };
}

/**
 * Add expense: undefined = omit field (AI suggest). string = save this category.
 */
export function categoryForAddSubmit(preset: string, custom: string): string | undefined {
  if (preset === "") return undefined;
  if (preset === EXPENSE_CATEGORY_OTHER) return custom.trim() || undefined;
  return preset;
}

/**
 * Edit expense: null = clear. string = set (trimmed).
 */
export function categoryForEditSubmit(preset: string, custom: string): string | null {
  if (preset === "") return null;
  if (preset === EXPENSE_CATEGORY_OTHER) return custom.trim() || null;
  return preset;
}
