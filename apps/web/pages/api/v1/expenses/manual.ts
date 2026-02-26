// File: apps/web/pages/api/v1/expenses/manual.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { addExpenseManualBody } from '@/lib/validators';
import { encryptText } from '@/lib/crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = addExpenseManualBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id, e2e_encrypted').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    // SECURITY: Encrypt merchant and raw_text server-side unless E2E
    let merchantCipher = parsed.data.merchant;
    let rawTextCipher: string | null = null;
    if (!u.e2e_encrypted) {
      const encMerchant = encryptText(parsed.data.merchant);
      merchantCipher = JSON.stringify(encMerchant);
      if (parsed.data.raw_text) {
        const encRaw = encryptText(parsed.data.raw_text);
        rawTextCipher = JSON.stringify(encRaw);
      }
    }
    const { data, error } = await supabase.from('expenses').insert({
      user_id: u.id,
      merchant_cipher: merchantCipher,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      category_id: parsed.data.category_id ?? null,
      raw_text_cipher: rawTextCipher,
      date: parsed.data.date ?? new Date().toISOString().slice(0, 10),
    }).select('id').single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
