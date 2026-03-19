# SheetBridgeX

Sync Notion databases to Google Sheets automatically.

## Stack

- Next.js 16 (App Router) + TypeScript
- TailwindCSS
- Supabase (Auth + Postgres)
- Stripe (subscriptions)
- Vercel (hosting + cron)

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the migration at `supabase/migrations/001_init.sql` in the SQL editor
3. Copy your project URL and keys

### 3. Create a Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Set the redirect URI to `http://localhost:3000/api/auth/notion/callback`
4. Copy client ID and client secret

### 4. Create a Google OAuth app

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Enable Google Sheets API and Google Drive API
4. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy client ID and client secret

### 5. Create a Stripe account

1. Create a product + price in Stripe dashboard ($19/month)
2. Copy the price ID
3. Set up a webhook pointing to `/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`

### 6. Configure environment variables

Copy `.env.local` and fill in all values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# Notion
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
NOTION_REDIRECT_URI=http://localhost:3000/api/auth/notion/callback

# Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=any-random-secret
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
app/
  page.tsx                  # Landing page
  login/                    # Auth pages
  signup/
  dashboard/
    page.tsx                # Sync job list
    create/                 # Create sync wizard
    sync/[id]/              # Sync detail + logs
    usage/                  # Plan + usage
  api/
    auth/notion/            # Notion OAuth
    auth/google/            # Google OAuth
    sync/run/               # Manual sync trigger
    sync/create/            # Create sync job
    sync/cron/              # Cron endpoint (runs due jobs)
    sync/logs/              # Fetch logs
    notion/databases/       # List Notion databases
    google/sheets/          # List Google Sheets
    billing/checkout/       # Stripe checkout
    billing/portal/         # Stripe billing portal
    webhooks/stripe/        # Stripe webhook handler

lib/
  sync/engine.ts            # Core sync logic
  sync/notion.ts            # Notion API client
  sync/google.ts            # Google Sheets API client
  supabase/                 # Supabase clients
  stripe.ts                 # Stripe client
  types.ts                  # Shared types
```

## Deployment (Vercel)

1. Push to GitHub
2. Import into Vercel
3. Add all env variables in Vercel dashboard
4. Vercel cron runs `/api/sync/cron` every 5 minutes (see `vercel.json`)
5. Update OAuth redirect URIs to your production domain
