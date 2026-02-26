// File: apps/web/pages/api/v1/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = createServerClient();
    const { data, error } = await supabase.from('users').select('id, clerk_id, profession, primary_goal, e2e_encrypted').eq('clerk_id', user.userId).single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    const out: Record<string, unknown> = { id: data.id, clerk_id: data.clerk_id, profession: data.profession, primary_goal: data.primary_goal };
    if (data.e2e_encrypted) out.ciphertext_masked = '[E2E]';
    return res.status(200).json(out);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
