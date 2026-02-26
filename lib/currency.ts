/**
 * Currency support: formatting and supported codes.
 * Uses Intl.NumberFormat for locale-aware, accurate display (symbol, decimals, grouping).
 */

export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "MAD", name: "Moroccan Dirham", flag: "🇲🇦" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "EGP", name: "Egyptian Pound", flag: "🇪🇬" },
  { code: "TND", name: "Tunisian Dinar", flag: "🇹🇳" },
  { code: "DZD", name: "Algerian Dinar", flag: "🇩🇿" },
] as const;

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);
/** App default currency: US dollars. Used for new users, forms, and fallbacks. */
export const DEFAULT_CURRENCY = "USD";

export type CurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

/**
 * Format an amount in the given currency using Intl.NumberFormat.
 * Accurate decimals and symbol placement per locale.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: { locale?: string; hideCode?: boolean }
): string {
  const code = SUPPORTED_CURRENCY_CODES.includes(currencyCode as CurrencyCode)
    ? currencyCode
    : DEFAULT_CURRENCY;
  const locale = options?.locale ?? "en-US";
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch {
    return `${code} ${Number(amount).toFixed(2)}`;
  }
}

/**
 * Check if a string is a supported currency code (case-sensitive, 3 letters).
 */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(code as CurrencyCode);
}
