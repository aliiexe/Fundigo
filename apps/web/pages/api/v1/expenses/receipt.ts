// File: apps/web/pages/api/v1/expenses/receipt.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getClerkUser } from '@/lib/clerk';
import { createServerClient } from '@/lib/supabaseClient';
import { encryptText } from '@/lib/crypto';
import { checkRateLimit } from '@/utils/rateLimiter';
import { logger } from '@/utils/logger';

const OCR_WORKER_URL = process.env.OCR_WORKER_URL || 'http://localhost:3001';
const OCR_API_KEY = process.env.OCR_API_KEY;

async function callOcrWorker(fileUrl: string): Promise<{ merchant?: string; date?: string; total?: number; line_items?: Array<{ desc: string; amount: number }> }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (OCR_API_KEY) headers['X-OCR-API-Key'] = OCR_API_KEY;
  const res = await fetch(`${OCR_WORKER_URL}/ocr`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url: fileUrl }),
  });
  if (!res.ok) {
    logger.warn('OCR worker non-OK', { status: res.status });
    return {};
  }
  return res.json();
}

// TODO: For multipart file upload use formidable; then upload to Supabase Storage, get signed URL, call OCR.
// For MVP we accept JSON body with storage_path / signed_url after client uploads to Storage.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { ok, remaining } = checkRateLimit(req.headers['x-forwarded-for'] as string || 'unknown', 'receipt');
  if (!ok) return res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  try {
    const user = await getClerkUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = createServerClient();
    const { data: u } = await supabase.from('users').select('id, e2e_encrypted').eq('clerk_id', user.userId).single();
    if (!u) return res.status(404).json({ error: 'User not found' });
    // Multipart: in real impl use formidable/multer; for scaffold we expect JSON body with a pre-uploaded path or base64
    // TODO: Use formidable to parse multipart file upload, upload to Supabase Storage at receipts/{userId}/{uuid}.{ext}
    const body = typeof req.body === 'object' ? req.body : {};
    const storagePath = (body.storage_path as string) || `receipts/${u.id}/stub-${Date.now()}.txt`;
    const signed = body.signed_url as string;
    let parsed: { merchant?: string; date?: string; total?: number; line_items?: Array<{ desc: string; amount: number }> } = {};
    if (signed) {
      parsed = await callOcrWorker(signed);
    }
    if (!parsed.merchant && !parsed.total) {
      parsed = { merchant: 'Unknown', date: new Date().toISOString().slice(0, 10), total: 0 };
    }
    const rawText = JSON.stringify(parsed);
    let rawTextCipher: string;
    if (u.e2e_encrypted) {
      rawTextCipher = rawText;
    } else {
      const enc = encryptText(rawText);
      rawTextCipher = JSON.stringify(enc);
    }
    const merchantEnc = u.e2e_encrypted ? (parsed.merchant ?? '') : JSON.stringify(encryptText(parsed.merchant ?? 'Unknown'));
    const { data: expense, error: expErr } = await supabase.from('expenses').insert({
      user_id: u.id,
      merchant_cipher: merchantEnc,
      amount: parsed.total ?? 0,
      currency: 'USD',
      raw_text_cipher: rawTextCipher,
      date: parsed.date ?? new Date().toISOString().slice(0, 10),
      receipt_storage_path: storagePath,
    }).select('id').single();
    if (expErr) throw expErr;
    const { error: jobErr } = await supabase.from('jobs').insert({
      type: 'ocr',
      payload: { storage_path: storagePath, user_id: u.id },
      status: 'done',
      attempts: 1,
    });
    if (jobErr) logger.warn('jobs insert failed', { err: jobErr });
    return res.status(201).json({ parsed, expense_ids: [expense.id] });
  } catch (e) {
    logger.error('receipt upload failed', { err: e });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
