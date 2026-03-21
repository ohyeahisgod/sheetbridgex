-- Add sync direction to sync_jobs
alter table public.sync_jobs
  add column if not exists sync_direction text not null default 'notion_to_sheets'
    check (sync_direction in ('notion_to_sheets', 'sheets_to_notion', 'bidirectional'));

-- Row-level state tracking for bidirectional sync
create table if not exists public.sync_row_state (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.sync_jobs(id) on delete cascade not null,
  notion_page_id text not null,
  sheet_row_index integer not null,  -- 1-based; row 1 = header, row 2 = first data row
  notion_hash text,                  -- hash of Notion fields at last sync
  sheet_hash text,                   -- hash of Sheet row at last sync
  notion_last_modified timestamptz,  -- Notion last_edited_time at last sync
  sheet_last_modified timestamptz,   -- when we last detected a sheet change
  status text not null default 'synced' check (status in ('synced', 'conflict', 'pending')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (sync_job_id, notion_page_id)
);

-- RLS
alter table public.sync_row_state enable row level security;

create policy "Users can view own row states" on public.sync_row_state
  for select using (
    auth.uid() = (select user_id from public.sync_jobs where id = sync_job_id)
  );

-- Indexes
create index if not exists sync_row_state_job_id_idx on public.sync_row_state(sync_job_id);
create index if not exists sync_row_state_sheet_row_idx on public.sync_row_state(sync_job_id, sheet_row_index);

-- Grant permissions
grant all on public.sync_row_state to anon, authenticated, service_role;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_sync_row_state_updated_at on public.sync_row_state;
create trigger set_sync_row_state_updated_at
  before update on public.sync_row_state
  for each row execute procedure public.set_updated_at();
