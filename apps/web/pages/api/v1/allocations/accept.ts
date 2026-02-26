// File: apps/web/pages/api/v1/allocations/accept.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { allocationsAcceptBody } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = allocationsAcceptBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { data: alloc } = await supabase.from('allocations').select('id, amount, save_pct, invest_pct').eq('user_id', u.id).eq('id', parsed.data.allocation_id).single();
    if (!alloc) return res.status(404).json({ error: 'Allocation not found' });
    await supabase.from('allocations').update({ accepted: true, updated_at: new Date().toISOString() }).eq('id', alloc.id);
    const saveAmount = (alloc.amount * (alloc.save_pct ?? 0)) / 100;
    const investAmount = (alloc.amount * (alloc.invest_pct ?? 0)) / 100;
    // TODO: Update goals/saved amounts (e.g. goals.current_amount += saveAmount for default goal)
    return res.status(200).json({ accepted: true, saveAmount, investAmount });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
