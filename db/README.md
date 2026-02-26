# Database setup (Supabase)

Fundigo uses Supabase (Postgres). Create the tables before running the app or seed script.

## Option 1: Supabase Dashboard (recommended)

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor**.
3. Open **`schema.sql`** in this folder and copy its full contents.
4. Paste into the SQL Editor and click **Run**.
5. Confirm there are no errors. All tables and indexes will be created.

If you already had the schema applied earlier:
- Run **`db/migrations/001_add_preferred_currency.sql`** to add the `preferred_currency` column to `users`.
- Run **`db/migrations/002_income_frequency_irregular.sql`** to allow `irregular` as an income frequency.
- Run **`db/migrations/003_add_onboarding_completed_at.sql`** to add `onboarding_completed_at` to `users`.

## Option 2: Supabase CLI

If you use the Supabase CLI and have the project linked:

```bash
supabase db push
```

Or run the schema file directly:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

(Use your project’s connection string from **Settings → Database**.)

## Tables created

- `users` — Clerk user id + profile
- `income_sources` — Income entries (frequency: weekly, monthly, etc.)
- `subscriptions` — Recurring subscriptions
- `subscription_catalog` — Reference catalog (e.g. Moroccan MAD)
- `expenses` — Expense records (encrypted merchant/raw text)
- `categories` — Optional expense categories
- `goals` — Savings/goals with target and deadline
- `allocations` — Allocation suggestions (spend/save/invest)
- `audit_logs` — Exports, deletes, etc.
- `jobs` — Background jobs (OCR, purge, etc.)

After this, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local` and run `npm run seed` (optional) or `npm run dev`.
