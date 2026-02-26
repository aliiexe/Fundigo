// File: apps/web/pages/api/v1/expenses/list.ts
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
    const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { data, error } = await supabase.from('expenses').select('id, amount, date').eq('user_id', u.id).order('date', { ascending: false }).limit(100);
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
