# Fundigo — Your Personal Finance Companion

Privacy-first personal finance: track income, subscriptions, expenses; smart allocation (spend / save / invest); goals; Moroccan subscription catalog (MAD). Built with Next.js (App Router), Clerk, and Supabase.

## Setup (step-by-step)

### 1. Clone and install

```bash
git clone <repo-url>
cd Fundigo
npm install
```

### 2. Create Supabase project and tables

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase dashboard, open **SQL Editor**.
3. Copy the entire contents of **`db/schema.sql`** and paste into the SQL Editor.
4. Click **Run**. This creates all tables: `users`, `income_sources`, `subscriptions`, `subscription_catalog`, `expenses`, `goals`, `allocations`, `audit_logs`, `jobs`, `categories`.  
   **If you skip this step, the app and API will fail** (e.g. "relation does not exist").
5. In **Settings → API**, copy your **Project URL** and **service_role** (secret) key. You will need these for `.env.local`.

See **`db/README.md`** for more options (e.g. Supabase CLI).

### 3. Create Clerk app

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create an application.
2. Copy the **Publishable key** and **Secret key** from the API Keys page.

### 4. Environment variables

**Important:** The app runs from the **project root** (`npm run dev`). Next.js loads env from the root directory, so **`.env.local` must be in the project root** (not only in `apps/web/`).

```bash
cp .env.example .env.local
```

Edit **`.env.local`** in the project root and set:

- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** — from Clerk
- **CLERK_SECRET_KEY** — from Clerk
- **SUPABASE_URL** — from Supabase (Project URL)
- **SUPABASE_SECRET_KEY** — from Supabase (service_role key)
- **MASTER_ENC_KEY** — run `openssl rand -base64 32` and paste the output

**Do not commit `.env.local` to Git.**

### 5. Seed the database (optional but recommended)

This fills the **subscription_catalog** with Moroccan subscriptions (Netflix, Spotify, etc. in MAD) and creates a demo user with sample subscriptions:

```bash
npm run seed
```

The seed script reads `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from `.env.local` in the project root (or from `apps/web/.env.local`).

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or sign in with Clerk; you’ll be redirected to the dashboard. Add income, subscriptions, expenses, and goals; use the allocation widget to get suggestions.

## What’s included

- **Landing** — Hero, sign in / sign up (Clerk).
- **Dashboard** — Income vs expenses summary, allocation widget (suggest + apply).
- **Income** — List and add income sources (name, amount, frequency).
- **Subscriptions** — List and add subscriptions; quick-add from catalog (MAD).
- **Expenses** — List and add manual expenses (merchant, amount, date).
- **Goals** — List and create goals (name, target, current, deadline) with progress bars.
- **Settings** — Data export (rate-limited), account deletion (schedules purge job).

All data is stored in Supabase. Sensitive fields (e.g. expense merchant) are encrypted with **MASTER_ENC_KEY** (AES-256-GCM). Protected routes and API endpoints require a valid Clerk session.

## Scripts

| Command       | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Start Next.js dev server             |
| `npm run build` | Build for production               |
| `npm run start` | Run production build                |
| `npm run seed` | Seed catalog + demo user (uses .env.local) |
| `npm run lint` | Run ESLint                          |

## Project structure

- **app/** — Next.js App Router: pages and layout.
- **app/api/v1/** — API routes: auth, me, income, subscriptions, expenses, goals, allocations, dashboard, catalog, data/export.
- **lib/** — Supabase client, crypto, allocation logic, validators, auth helper.
- **utils/** — Logger, rate limiter.
- **db/schema.sql** — Full Postgres schema for Supabase.
- **scripts/seed_morocco_demo.ts** — Seed script for catalog and demo user.

## Security

- Do not commit `.env` or `.env.local`.
- Rotate Clerk and Supabase keys before production.
- Use GitHub Secrets / Vercel env vars for production.
- See **docs/SECURITY_CHECKLIST.md** for a full checklist.
