-- Run this script in Supabase Dashboard > SQL Editor.
-- Browser clients may only read/write their own rows. Never expose service_role keys.

create table if not exists public.saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled analysis',
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_analyses_user_created_idx
  on public.saved_analyses (user_id, created_at desc);

alter table public.saved_analyses enable row level security;

drop policy if exists "Users can read their own analyses" on public.saved_analyses;
create policy "Users can read their own analyses"
  on public.saved_analyses for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own analyses" on public.saved_analyses;
create policy "Users can insert their own analyses"
  on public.saved_analyses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own analyses" on public.saved_analyses;
create policy "Users can delete their own analyses"
  on public.saved_analyses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- No update policy is needed for the starter app.
