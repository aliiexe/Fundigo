-- Fundigo DB schema — Supabase Postgres
-- Run with: supabase db push or psql

-- Users (Clerk id + optional profile)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL UNIQUE,
  profession text,
  primary_goal text,
  preferred_currency text DEFAULT 'USD',
  starting_balance numeric DEFAULT 0,
  onboarding_completed_at timestamptz,
  e2e_encrypted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Income sources
CREATE TABLE IF NOT EXISTS income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly', 'irregular')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  plan text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  period text NOT NULL CHECK (period IN ('monthly', 'yearly')),
  next_billing_date date,
  paused_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories (optional for expenses)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Expenses (merchant/raw_text encrypted server-side unless e2e)
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_cipher text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  category_id uuid REFERENCES categories(id),
  raw_text_cipher text,
  date date NOT NULL DEFAULT current_date,
  receipt_storage_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Allocations (suggest + accept)
CREATE TABLE IF NOT EXISTS allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  spend_pct numeric NOT NULL,
  save_pct numeric NOT NULL,
  invest_pct numeric NOT NULL,
  keep_pct numeric DEFAULT 0,
  accepted boolean DEFAULT false,
  save_target text DEFAULT 'savings',
  goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  currency text DEFAULT 'USD',
  reasoning text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs (exports, deletes, etc.)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Job queue (OCR, purge_user, email, etc.)
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'failed', 'done')),
  attempts integer DEFAULT 0,
  run_after timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription catalog (Moroccan-focused reference data)
CREATE TABLE IF NOT EXISTS subscription_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  plan text NOT NULL,
  period text NOT NULL CHECK (period IN ('monthly', 'yearly')),
  price_mad numeric NOT NULL,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  UNIQUE(service, plan, period)
);

CREATE INDEX IF NOT EXISTS idx_subscription_catalog_service ON subscription_catalog(service);

-- Consent logs (GDPR)
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  version text NOT NULL DEFAULT '1.0',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Goal advice (AI-generated advice per goal)
CREATE TABLE IF NOT EXISTS goal_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  achievable boolean NOT NULL,
  advice text NOT NULL,
  monthly_needed numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Transactions (unified financial activity log)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'subscription', 'goal_contribution', 'allocation')),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  description text,
  reference_id uuid,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status_run_after ON jobs(status, run_after);
CREATE INDEX IF NOT EXISTS idx_goal_advice_goal_id ON goal_advice(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
