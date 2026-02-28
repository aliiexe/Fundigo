/**
 * Countries used for subscription catalog filtering.
 * User must choose their country during onboarding; no default.
 */

export const SUPPORTED_COUNTRIES = [
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
] as const;

export const COUNTRY_CODES = SUPPORTED_COUNTRIES.map((c) => c.code);
