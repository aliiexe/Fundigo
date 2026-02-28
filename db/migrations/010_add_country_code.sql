-- Add country_code for multi-country subscription catalog and user region
-- Morocco (MA) is top priority; users see catalog for their country only.

ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'MA';

ALTER TABLE subscription_catalog ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'MA';

-- Allow same service/plan/period in different countries (different prices)
ALTER TABLE subscription_catalog DROP CONSTRAINT IF EXISTS subscription_catalog_service_plan_period_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_catalog_service_plan_period_country
  ON subscription_catalog (service, plan, period, country_code);

CREATE INDEX IF NOT EXISTS idx_subscription_catalog_country ON subscription_catalog(country_code);
CREATE INDEX IF NOT EXISTS idx_users_country_code ON users(country_code);
