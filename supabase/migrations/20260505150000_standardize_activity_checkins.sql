-- Standardize Activity check-ins so the UI can store weight, calories, steps, and notes.

create extension if not exists "pgcrypto";

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  weight_kg numeric(6, 2),
  calories_burned integer,
  steps integer,
  notes text default '',
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weight_logs add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.weight_logs add column if not exists weight_kg numeric(6, 2);
alter table public.weight_logs add column if not exists calories_burned integer;
alter table public.weight_logs add column if not exists steps integer;
alter table public.weight_logs add column if not exists notes text default '';
alter table public.weight_logs add column if not exists logged_at timestamptz not null default now();
alter table public.weight_logs add column if not exists created_at timestamptz not null default now();
alter table public.weight_logs add column if not exists updated_at timestamptz not null default now();
alter table public.weight_logs alter column weight_kg drop not null;
alter table public.weight_logs alter column user_id set default auth.uid();

do $$
begin
  if to_regclass('public.progress') is not null then
    insert into public.weight_logs (
      user_id,
      weight_kg,
      calories_burned,
      steps,
      notes,
      logged_at,
      created_at,
      updated_at
    )
    select
      progress.user_id,
      progress.weight_kg,
      progress.calories,
      progress.steps,
      coalesce(progress.note, ''),
      progress.logged_at,
      progress.created_at,
      progress.updated_at
    from public.progress
    where not exists (
      select 1
      from public.weight_logs
      where weight_logs.user_id = progress.user_id
        and weight_logs.logged_at = progress.logged_at
    );
  end if;
end $$;

create index if not exists weight_logs_user_logged_idx on public.weight_logs(user_id, logged_at desc);

drop trigger if exists weight_logs_set_updated_at on public.weight_logs;
create trigger weight_logs_set_updated_at
before update on public.weight_logs
for each row execute function public.set_updated_at();

alter table public.weight_logs enable row level security;
grant select, insert, update, delete on public.weight_logs to authenticated;
grant all on public.weight_logs to service_role;

drop policy if exists weight_logs_all_own on public.weight_logs;
create policy weight_logs_all_own
on public.weight_logs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
