/**
 * Seed: subscription_catalog (Moroccan-focused) + demo user (demo@fundigo.local) + demo subscriptions.
 * Uses SUPABASE_URL and SUPABASE_SECRET_KEY.
 * Run from repo root: pnpm run seed (loads apps/web/.env.local)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load from root .env.local or apps/web/.env.local
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const CATALOG: Array<{ service: string; plan: string; period: string; price_mad: number }> = [
  { service: 'Netflix', plan: 'Basic', period: 'monthly', price_mad: 39 },
  { service: 'Netflix', plan: 'Standard', period: 'monthly', price_mad: 59 },
  { service: 'Netflix', plan: 'Premium', period: 'monthly', price_mad: 89 },
  { service: 'Spotify', plan: 'Individual', period: 'monthly', price_mad: 19 },
  { service: 'YouTube Premium', plan: 'Premium', period: 'monthly', price_mad: 29 },
  { service: 'Cursor', plan: 'Pro', period: 'monthly', price_mad: 200 },
  { service: 'Disney+', plan: 'Standard', period: 'monthly', price_mad: 49 },
  { service: 'Anghami', plan: 'Premium', period: 'monthly', price_mad: 19 },
  { service: 'Shahid', plan: 'VIP', period: 'monthly', price_mad: 35 },
  { service: 'Amazon Prime', plan: 'Prime', period: 'monthly', price_mad: 29 },
  { service: 'Canva', plan: 'Pro', period: 'monthly', price_mad: 60 },
  { service: 'Microsoft 365', plan: 'Personal', period: 'monthly', price_mad: 39 },
  { service: 'Dropbox', plan: 'Plus', period: 'monthly', price_mad: 29 },
  { service: 'Adobe Creative Cloud', plan: 'Photography', period: 'monthly', price_mad: 49 },
  { service: 'PlayStation Plus', plan: 'Essential', period: 'monthly', price_mad: 29 },
  { service: 'Nintendo Switch Online', plan: 'Individual', period: 'monthly', price_mad: 10 },
  { service: 'Tidal', plan: 'HiFi', period: 'monthly', price_mad: 29 },
  { service: 'Google One', plan: '100GB', period: 'monthly', price_mad: 19 },
];

const DEMO_CLERK_ID = 'demo_fundigo_local';

async function main() {
  console.log('Seeding subscription_catalog...');
  await supabase.from('subscription_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  for (const row of CATALOG) {
    const { error } = await supabase.from('subscription_catalog').insert({ ...row, currency: 'MAD' });
    if (error) console.warn('Catalog row:', row.service, error.message);
  }
  console.log('Catalog done.');

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', DEMO_CLERK_ID)
    .single();

  let demoUserId: string;
  if (existingUser) {
    demoUserId = existingUser.id;
    console.log('Demo user exists:', demoUserId);
  } else {
    const { data: inserted, error } = await supabase
      .from('users')
      .insert({
        clerk_id: DEMO_CLERK_ID,
        profession: 'student',
        primary_goal: 'buy_keyboard',
      })
      .select('id')
      .single();
    if (error) {
      console.error('Demo user insert failed:', error);
      process.exit(1);
    }
    demoUserId = inserted!.id;
    console.log('Demo user created (demo@fundigo.local / clerk_id:', DEMO_CLERK_ID, '):', demoUserId);
  }

  await supabase.from('subscriptions').delete().eq('user_id', demoUserId);

  const demoSubs = [
    { service_name: 'Netflix', plan: 'Standard', amount: 59, currency: 'MAD', period: 'monthly' as const },
    { service_name: 'Spotify', plan: 'Individual', amount: 19, currency: 'MAD', period: 'monthly' as const },
    { service_name: 'YouTube Premium', plan: 'Premium', amount: 29, currency: 'MAD', period: 'monthly' as const },
    { service_name: 'Disney+', plan: 'Standard', amount: 49, currency: 'MAD', period: 'monthly' as const },
    { service_name: 'Anghami', plan: 'Premium', amount: 19, currency: 'MAD', period: 'monthly' as const },
  ];

  for (const sub of demoSubs) {
    await supabase.from('subscriptions').insert({ user_id: demoUserId, ...sub });
  }
  console.log('Demo subscriptions attached. Seed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
