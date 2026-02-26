-- Add preferred_currency to users (run if schema was applied before this column existed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD';
