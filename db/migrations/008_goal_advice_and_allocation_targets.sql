-- goal_advice: stores AI-generated advice per goal
CREATE TABLE IF NOT EXISTS goal_advice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  achievable boolean NOT NULL,
  advice text NOT NULL,
  monthly_needed numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goal_advice_goal_id ON goal_advice(goal_id);

-- allocations: add goal-targeting columns
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS save_target text DEFAULT 'savings';
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS reasoning text;

-- transactions: unified financial activity log
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
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
