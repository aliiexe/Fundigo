// File: apps/web/pages/api/v1/auth/ensure-user.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { ensureUserBody } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = ensureUserBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    const supabase = createServerClient();
    const { data: existing } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    const payload = {
      clerk_id: user.userId,
      profession: parsed.data.profession ?? null,
      primary_goal: parsed.data.primary_goal ?? null,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      await supabase.from('users').update(payload).eq('id', existing.id);
      return res.status(200).json({ user: { id: existing.id, updated: true } });
    }
    const { data: inserted, error } = await supabase.from('users').insert({ ...payload, id: undefined }).select('id').single();
    if (error) throw error;
    return res.status(201).json({ user: { id: inserted.id, created: true } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
