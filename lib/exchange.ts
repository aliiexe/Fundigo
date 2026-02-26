/**
 * Exchange rate service with in-memory cache.
 * Uses exchangerate-api.com free tier (no key needed).
 * Rates are cached for 30 minutes to avoid excessive API calls.
 */

const CACHE_TTL_MS = 30 * 60 * 1000;
const API_BASE = "https://api.exchangerate-api.com/v4/latest";

type RateCache = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
};

let cache: RateCache | null = null;

export async function getRates(base: string = "USD"): Promise<Record<string, number>> {
  const now = Date.now();

  if (cache && cache.base === base && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  try {
    const res = await fetch(`${API_BASE}/${base}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error(`[exchange] API returned ${res.status}`);
      return cache?.rates ?? {};
    }

    const data = await res.json();
    const rates: Record<string, number> = data.rates ?? {};

    cache = { base, rates, fetchedAt: now };
    return rates;
  } catch (e) {
    console.error("[exchange] Failed to fetch rates:", e);
    return cache?.rates ?? {};
  }
}

/**
 * Convert an amount from one currency to another using live rates.
 * Returns the original amount if rates are unavailable or currencies match.
 */
export async function convert(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to || amount === 0) return amount;

  const rates = await getRates("USD");
  if (!rates[from] || !rates[to]) return amount;

  const inUSD = amount / rates[from];
  return inUSD * rates[to];
}

/**
 * Synchronous conversion using a pre-fetched rates object.
 * Use this when you already have rates and need to convert many amounts.
 */
export function convertSync(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to || amount === 0) return amount;
  if (!rates[from] || !rates[to]) return amount;

  const inUSD = amount / rates[from];
  return inUSD * rates[to];
}
