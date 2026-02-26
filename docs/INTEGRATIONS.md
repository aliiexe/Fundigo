# Integrations — step-by-step setup

## Clerk (auth)

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. In **API Keys**, copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `apps/web/.env.local`.
   - **Secret key** → `CLERK_SECRET_KEY` in `apps/web/.env.local`.
3. In **Settings → Paths**, set sign-in/sign-up paths if needed.
4. **Restrict origins**: In **Settings → Domains**, add only your production and dev domains. Do not allow wildcards in production.
5. **Security**: Rotate the test Clerk keys in `.env.example` before production. Never commit `.env` or `.env.local` to Git.

## Supabase (DB + seeding)

1. Create a project at [supabase.com](https://supabase.com).
2. In **Settings → API** copy:
   - **Project URL** → `SUPABASE_URL` in `apps/web/.env.local`.
   - **service_role** (or secret key) → `SUPABASE_SECRET_KEY` in `apps/web/.env.local`. This key is used for **all** server-side operations (API routes and seeding). Never expose to the client.
3. Run the schema: in SQL Editor paste and run `db/schema.sql` (includes `subscription_catalog` and all other tables).
4. **Seed**: From repo root run `pnpm run seed`. This uses `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from `apps/web/.env.local` to insert the Moroccan subscription catalog and the demo user (clerk_id `demo_fundigo_local`) with sample subscriptions.
5. Create a **Storage** bucket named `receipts` (private) for receipt uploads if you use the receipt/OCR flow.

## Vercel (deployment)

1. Import the repo in [vercel.com](https://vercel.com); set root to `apps/web` (or monorepo root with Next.js).
2. Add environment variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `MASTER_ENC_KEY`, `OCR_WORKER_URL`, `OCR_API_KEY`, `SENTRY_DSN` (optional). Use production keys.
3. For CI: set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub Secrets.

## Sentry (errors, optional)

1. Create a project at [sentry.io](https://sentry.io).
2. Add `SENTRY_DSN` (and optionally `SENTRY_ORG`, `SENTRY_PROJECT`) to `.env.local` and Vercel.

## Encryption key (MASTER_ENC_KEY)

```bash
openssl rand -base64 32
```

Put the output in `MASTER_ENC_KEY` in `.env.local` and in production. TODO: KMS (e.g. HashiCorp Vault) for production.

## OCR worker

- **Local**: `docker-compose up ocr-worker`. Set `TESSERACT_AVAILABLE=true` for real OCR.
- **Production**: Set `OCR_WORKER_URL` and `OCR_API_KEY`; protect worker with the same key.

## Env summary

| Variable | Where | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | .env.local, Vercel | Rotate test keys |
| `CLERK_SECRET_KEY` | .env.local, Vercel | Server-only |
| `SUPABASE_URL` | .env.local, Vercel | Project URL |
| `SUPABASE_SECRET_KEY` | .env.local, Vercel, GitHub Secrets | Server-only; used for API + seeding |
| `MASTER_ENC_KEY` | .env.local, Vercel | `openssl rand -base64 32` |
| `OCR_WORKER_URL`, `OCR_API_KEY` | .env.local, Vercel | Optional |

**SECURITY**: Do not commit `.env` or `.env.local`. Rotate Clerk keys before production.
