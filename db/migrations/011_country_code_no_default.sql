-- Country is required: no default. User must set it during onboarding.
ALTER TABLE users ALTER COLUMN country_code DROP DEFAULT;
