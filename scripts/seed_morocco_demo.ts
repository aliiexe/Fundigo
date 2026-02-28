/**
 * Seed: demo user (demo@fundigo.local) + demo subscriptions.
 * For subscription_catalog (multi-country), run: npx tsx db/seed/subscription_catalog_multi_country.ts
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

const DEMO_CLERK_ID = 'demo_fundigo_local';

async function main() {
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
