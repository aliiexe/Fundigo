/**
 * Server-side Clerk token verification. Use in API routes to protect endpoints.
 * Test-mode fallback when CLERK_SECRET_KEY is not set (dev only).
 */

import type { GetServerSidePropsContext, NextApiRequest } from 'next';
import { getAuth } from '@clerk/nextjs/server';

export type ClerkUser = { userId: string; sessionId: string | null };

const DEMO_CLERK_ID = 'demo_fundigo_local';

function isDemoMode(req: NextApiRequest): boolean {
  const cookie = req.headers.cookie || '';
  return cookie.includes('demo_mode=true');
}

/**
 * Get authenticated user from request. Returns null if unauthenticated.
 * In development, cookie demo_mode=true uses demo user (demo_fundigo_local) so dashboard shows seeded data.
 */
export async function getClerkUser(req: NextApiRequest): Promise<ClerkUser | null> {
  if (process.env.NODE_ENV !== 'production' && isDemoMode(req)) {
    return { userId: DEMO_CLERK_ID, sessionId: null };
  }
  const { userId, sessionId } = getAuth(req as GetServerSidePropsContext['req']);
  if (!userId) return null;
  return { userId, sessionId: sessionId ?? null };
}

/**
 * Require auth; throws if not authenticated. Use in API route handlers.
 */
export async function requireClerkUser(req: NextApiRequest): Promise<ClerkUser> {
  const user = await getClerkUser(req);
  if (!user) throw new Error('Unauthorized');
  return user;
}
