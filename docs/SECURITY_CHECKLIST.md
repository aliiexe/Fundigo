# Security checklist

Use this list for production hardening and before public beta.

## Transport & headers

- [ ] **TLS**: All production traffic over HTTPS (Vercel provides this).
- [ ] **HSTS**: Enable Strict-Transport-Security (e.g. via Vercel headers or Next.js config).
- [ ] **CSP**: Configure Content-Security-Policy headers to restrict script/style sources (see Next.js security headers).
- [ ] **X-Frame-Options**: Set to `DENY` or `SAMEORIGIN` to reduce clickjacking risk.
- [ ] **X-Content-Type-Options**: Set to `nosniff`.

## Authentication & authorization

- [ ] **Clerk**: Limit allowed origins in Clerk dashboard to your production and dev domains only.
- [ ] **Clerk keys**: Remove or rotate the test Clerk keys before production; use production keys from Clerk dashboard.
- [ ] **Protected routes**: All API routes under `/api/v1/*` (except auth) must verify Clerk session server-side (already implemented via `getClerkUser`).

## Secrets & keys

- [ ] **SUPABASE_SECRET_KEY**: Used only in server context (API routes, seeding). Never expose to client or commit to Git.
- [ ] **MASTER_ENC_KEY**: Stored only in server env (e.g. Vercel). Generate with `openssl rand -base64 32`. TODO: Migrate to KMS (e.g. HashiCorp Vault) for key management.
- [ ] **OCR_API_KEY**: Set in production for both Next.js app and OCR worker; use a strong random value.
- [ ] **.env / .env.local**: Never commit. Add to .gitignore. Use GitHub Secrets for CI and Vercel env vars for production.

## Data protection

- [ ] **Field-level encryption**: Sensitive fields (merchant, raw_text) encrypted with AES-256-GCM via `lib/crypto.ts` unless user has E2E encryption.
- [ ] **Audit logs**: Critical events (data export, account delete) written to `audit_logs` table (implemented in export and delete routes).
- [ ] **Rate limiting**: Applied to `/api/v1/expenses/receipt` and `/api/v1/data/export`. Production: use a serverless-friendly store (e.g. Vercel KV / Upstash Redis) keyed by IP + clerkId.

## Infrastructure

- [ ] **Supabase RLS**: Enable Row Level Security on tables and define policies so users can only access their own rows; use SUPABASE_SECRET_KEY only in trusted server code.
- [ ] **Storage**: Receipts bucket private; access via signed URLs or service role only.
- [ ] **Pen-test**: Conduct a security review or penetration test before public beta.

## Monitoring & response

- [ ] **Sentry**: Configure SENTRY_DSN so errors are reported; review and fix high-severity issues.
- [ ] **Logging**: Structured JSON logs to stdout; avoid logging secrets or full PII.
- [ ] **Incident response**: Document how to rotate keys and revoke access if a key is compromised.
