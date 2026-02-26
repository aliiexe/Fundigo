/**
 * In-memory rate limiter for dev. Production: use serverless-friendly approach (e.g. IP + clerkId).
 * Apply to /expenses/receipt and /data/export.
 */

const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // per window per key

function getKey(identifier: string, prefix: string): string {
  return `${prefix}:${identifier}`;
}

export function checkRateLimit(identifier: string, prefix: string = 'api'): { ok: boolean; remaining: number } {
  const key = getKey(identifier, prefix);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }
  entry.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const ok = entry.count <= MAX_REQUESTS;
  return { ok, remaining };
}

// TODO: Production — use Vercel KV or Upstash Redis for distributed rate limiting by IP + clerkId
