// File: apps/web/pages/api/v1/income/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { addIncomeBody } from '@/lib/validators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const user = await getClerkUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const supabase = createServerClient();
      const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
      if (!u) return res.status(404).json({ error: 'User not found' });
      const { data, error } = await supabase.from('income_sources').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data ?? []);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  if (req.method === 'POST') {
    try {
      const user = await getClerkUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const parsed = addIncomeBody.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      const supabase = createServerClient();
      const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
      if (!u) return res.status(404).json({ error: 'User not found' });
      const { data, error } = await supabase.from('income_sources').insert({
        user_id: u.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
        note: parsed.data.note ?? null,
      }).select('id').single();
      if (error) throw error;
      return res.status(201).json(data);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
