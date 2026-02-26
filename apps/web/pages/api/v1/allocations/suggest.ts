// File: apps/web/pages/api/v1/allocations/suggest.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { allocationsSuggestBody } from '@/lib/validators';
import { suggestAllocation } from '@/lib/allocation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = allocationsSuggestBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { suggested, reasoning, etaGoal } = await suggestAllocation(user.userId, parsed.data.amount);
    const { data: alloc, error } = await supabase.from('allocations').insert({
      user_id: u.id,
      amount: parsed.data.amount,
      spend_pct: suggested.spend,
      save_pct: suggested.save,
      invest_pct: suggested.invest,
      keep_pct: suggested.keep ?? 0,
      accepted: false,
    }).select('id').single();
    if (error) throw error;
    return res.status(200).json({ suggested, reasoning, etaGoal, id: alloc.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
