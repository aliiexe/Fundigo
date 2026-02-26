-- Set income_sources.currency to the owner's preferred_currency when still the migration default 'USD'
UPDATE income_sources
SET currency = u.preferred_currency
FROM users u
WHERE income_sources.user_id = u.id
  AND income_sources.currency = 'USD'
  AND u.preferred_currency IS NOT NULL
  AND u.preferred_currency <> 'USD';

-- Same for goals
UPDATE goals
SET currency = u.preferred_currency
FROM users u
WHERE goals.user_id = u.id
  AND goals.currency = 'USD'
  AND u.preferred_currency IS NOT NULL
  AND u.preferred_currency <> 'USD';
