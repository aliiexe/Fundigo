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
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "PKR", name: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "BDT", name: "Bangladeshi Taka", flag: "🇧🇩" },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "RUB", name: "Russian Ruble", flag: "🇷🇺" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "PLN", name: "Polish Złoty", flag: "🇵🇱" },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", flag: "🇩🇰" },
  { code: "CZK", name: "Czech Koruna", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", flag: "🇭🇺" },
  { code: "RON", name: "Romanian Leu", flag: "🇷🇴" },
  { code: "BGN", name: "Bulgarian Lev", flag: "🇧🇬" },
  { code: "UAH", name: "Ukrainian Hryvnia", flag: "🇺🇦" },
  { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "GHS", name: "Ghanaian Cedi", flag: "🇬🇭" },
  { code: "ARS", name: "Argentine Peso", flag: "🇦🇷" },
  { code: "CLP", name: "Chilean Peso", flag: "🇨🇱" },
  { code: "COP", name: "Colombian Peso", flag: "🇨🇴" },
  { code: "PEN", name: "Peruvian Sol", flag: "🇵🇪" },
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
