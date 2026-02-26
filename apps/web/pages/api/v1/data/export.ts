// File: apps/web/pages/api/v1/data/export.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { checkRateLimit } from '@/utils/rateLimiter';
import { auditLog } from '@/utils/logger';
// auditLog writes to audit_logs table for critical events

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const identifier = (req.headers['x-forwarded-for'] as string) || (req.socket?.remoteAddress ?? 'unknown');
  const { ok, remaining } = checkRateLimit(identifier, 'export');
  if (!ok) return res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    // TODO: Generate ZIP with CSV/JSON + signed receipt URLs; for now return placeholder
    await auditLog(supabase, u.id, 'data_export', { format: 'zip' });
    return res.status(200).json({ message: 'Export queued', downloadUrl: null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
