-- Allow 'irregular' frequency for income_sources (run if schema was applied before this)
-- Drop existing check and re-add with 'irregular' included
ALTER TABLE income_sources DROP CONSTRAINT IF EXISTS income_sources_frequency_check;
ALTER TABLE income_sources ADD CONSTRAINT income_sources_frequency_check
  CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly', 'irregular'));
