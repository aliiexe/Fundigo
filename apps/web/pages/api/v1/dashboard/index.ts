// File: apps/web/pages/api/v1/dashboard/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { dashboardQuery } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = dashboardQuery.safeParse({ month: req.query.month });
    const month = parsed.success && parsed.data.month ? parsed.data.month : new Date().toISOString().slice(0, 7);
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    const start = `${month}-01`;
    const end = `${month}-31`;
    const { data: incomes } = await supabase.from('income_sources').select('amount, frequency').eq('user_id', u.id);
    let totalIncome = 0;
    for (const i of incomes ?? []) {
      if (i.frequency === 'irregular') continue;
      if (i.frequency === 'monthly') totalIncome += i.amount;
      else if (i.frequency === 'yearly') totalIncome += i.amount / 12;
      else if (i.frequency === 'weekly') totalIncome += i.amount * 4.33;
      else if (i.frequency === 'biweekly') totalIncome += i.amount * 2.17;
    }
    const { data: expenses } = await supabase.from('expenses').select('amount').eq('user_id', u.id).gte('date', start).lte('date', end);
    const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
    return res.status(200).json({ month, totalIncome, totalExpenses });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
