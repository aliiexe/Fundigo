// File: apps/web/pages/api/v1/me/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', u.id);
    await supabase.from('jobs').insert({
      type: 'purge_user',
      payload: { user_id: u.id },
      status: 'pending',
    });
    return res.status(202).json({ message: 'Account deletion scheduled' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
