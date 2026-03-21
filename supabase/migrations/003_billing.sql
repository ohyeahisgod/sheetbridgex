-- ============================================================
-- Plan limits (reference table, seeded below)
-- ============================================================
create table if not exists public.plan_limits (
  plan text primary key,
  max_connections integer not null default 1,     -- -1 = unlimited
  max_rows_per_month integer not null default 100,-- -1 = unlimited
  min_interval_minutes integer not null default 30,
  bidirectional_sync boolean not null default false,
  max_sync_runs_per_month integer not null default -1, -- -1 = unlimited
  price_monthly_cents integer not null default 0,
  features jsonb not null default '{}'::jsonb
);

-- Seed plan definitions
insert into public.plan_limits
  (plan, max_connections, max_rows_per_month, min_interval_minutes, bidirectional_sync, max_sync_runs_per_month, price_monthly_cents, features)
values
  ('free',     1,  100,    30, false, -1, 0,    '{"priority_support": false, "team_members": 1}'::jsonb),
  ('pro',     10,  5000,    5, true,  -1, 1900, '{"priority_support": true,  "team_members": 1}'::jsonb),
  ('business', -1, 100000,  1, true,  -1, 4900, '{"priority_support": true,  "team_members": 5}'::jsonb)
on conflict (plan) do update set
  max_connections         = excluded.max_connections,
  max_rows_per_month      = excluded.max_rows_per_month,
  min_interval_minutes    = excluded.min_interval_minutes,
  bidirectional_sync      = excluded.bidirectional_sync,
  max_sync_runs_per_month = excluded.max_sync_runs_per_month,
  price_monthly_cents     = excluded.price_monthly_cents,
  features                = excluded.features;

-- ============================================================
-- Usage records (raw events per sync run)
-- ============================================================
create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  sync_job_id uuid references public.sync_jobs(id) on delete set null,
  sync_runs integer not null default 1,
  rows_processed integer not null default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- Usage monthly summary (aggregated per user per month)
-- ============================================================
create table if not exists public.usage_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  month text not null,   -- YYYY-MM
  sync_runs integer not null default 0,
  rows_processed integer not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, month)
);

-- ============================================================
-- Subscriptions (Stripe-ready, populated by webhook)
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  plan text not null default 'free',
  status text not null default 'active'
    check (status in ('active', 'canceled', 'trialing', 'past_due', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.plan_limits enable row level security;
alter table public.usage_records enable row level security;
alter table public.usage_monthly enable row level security;
alter table public.subscriptions enable row level security;

-- plan_limits: readable by everyone (reference data)
create policy "Plan limits are public" on public.plan_limits
  for select using (true);

-- usage_records: own data only
create policy "Users can view own usage records" on public.usage_records
  for select using (auth.uid() = user_id);

-- usage_monthly: own data only
create policy "Users can view own monthly usage" on public.usage_monthly
  for select using (auth.uid() = user_id);

-- subscriptions: own data only
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ============================================================
-- Grants
-- ============================================================
grant all on public.plan_limits to anon, authenticated, service_role;
grant all on public.usage_records to anon, authenticated, service_role;
grant all on public.usage_monthly to anon, authenticated, service_role;
grant all on public.subscriptions to anon, authenticated, service_role;

-- ============================================================
-- Atomic increment function for monthly usage
-- ============================================================
create or replace function public.increment_monthly_usage(
  p_user_id uuid,
  p_month text,
  p_sync_runs integer,
  p_rows_processed integer
) returns void as $$
begin
  insert into public.usage_monthly (user_id, month, sync_runs, rows_processed)
  values (p_user_id, p_month, p_sync_runs, p_rows_processed)
  on conflict (user_id, month) do update set
    sync_runs      = usage_monthly.sync_runs + p_sync_runs,
    rows_processed = usage_monthly.rows_processed + p_rows_processed,
    updated_at     = now();
end;
$$ language plpgsql security definer;

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists usage_records_user_id_idx on public.usage_records(user_id);
create index if not exists usage_records_created_at_idx on public.usage_records(created_at desc);
create index if not exists usage_monthly_user_month_idx on public.usage_monthly(user_id, month);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);
