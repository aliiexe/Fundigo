-- Track onboarding completion (run if schema was applied before this)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
