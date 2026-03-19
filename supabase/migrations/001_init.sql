-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  notion_access_token text,
  google_access_token text,
  google_refresh_token text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Sync jobs
create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  notion_db_id text not null,
  notion_db_name text not null default '',
  google_sheet_id text not null,
  google_sheet_name text not null default '',
  mapping_json jsonb not null default '[]',
  interval_minutes integer not null default 30,
  last_synced_at timestamptz,
  status text not null default 'active' check (status in ('active', 'error', 'paused')),
  created_at timestamptz default now()
);

-- Sync logs
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.sync_jobs(id) on delete cascade not null,
  status text not null check (status in ('success', 'error', 'running')),
  message text not null,
  rows_synced integer,
  created_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.sync_logs enable row level security;

-- Users policies
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own data" on public.users
  for insert with check (auth.uid() = id);

-- Sync jobs policies
create policy "Users can view own sync jobs" on public.sync_jobs
  for select using (auth.uid() = user_id);

create policy "Users can create own sync jobs" on public.sync_jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sync jobs" on public.sync_jobs
  for update using (auth.uid() = user_id);

create policy "Users can delete own sync jobs" on public.sync_jobs
  for delete using (auth.uid() = user_id);

-- Sync logs policies
create policy "Users can view own sync logs" on public.sync_logs
  for select using (
    auth.uid() = (
      select user_id from public.sync_jobs where id = sync_job_id
    )
  );

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index if not exists sync_jobs_user_id_idx on public.sync_jobs(user_id);
create index if not exists sync_jobs_status_idx on public.sync_jobs(status);
create index if not exists sync_logs_job_id_idx on public.sync_logs(sync_job_id);
create index if not exists sync_logs_created_at_idx on public.sync_logs(created_at desc);

-- Grant table permissions to all roles
grant all on public.users to anon, authenticated, service_role;
grant all on public.sync_jobs to anon, authenticated, service_role;
grant all on public.sync_logs to anon, authenticated, service_role;
