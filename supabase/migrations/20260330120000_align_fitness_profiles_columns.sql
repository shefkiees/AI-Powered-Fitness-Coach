-- Run in Supabase → SQL Editor (safe: adds column + grants; keeps existing rows)
-- Fixes: "Could not find 'activity_level' column" and often "permission denied for table"

-- 1) Table privileges (required in addition to RLS)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.fitness_profiles to anon, authenticated, service_role;

-- 2) Add activity_level if you still have the old schema (e.g. only had "level")
alter table public.fitness_profiles
  add column if not exists activity_level text;

-- 3) Backfill from legacy "level" column if it exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fitness_profiles'
      and column_name = 'level'
  ) then
    execute $u$
      update public.fitness_profiles
      set activity_level = coalesce(nullif(trim(activity_level), ''), level::text)
      where activity_level is null or trim(activity_level) = '';
    $u$;
  end if;
end $$;

-- 4) Sensible default for any rows still null
update public.fitness_profiles
set activity_level = 'moderate'
where activity_level is null or trim(activity_level) = '';

-- 5) Enforce NOT NULL only when safe (skip if you have 0 rows — still ok)
alter table public.fitness_profiles
  alter column activity_level set default 'moderate';

alter table public.fitness_profiles
  alter column activity_level set not null;

-- 6) Enable RLS (idempotent) + policies (names match 20260329130000 migration)
alter table public.fitness_profiles enable row level security;

drop policy if exists "fp_select_own" on public.fitness_profiles;
drop policy if exists "fp_insert_own" on public.fitness_profiles;
drop policy if exists "fp_update_own" on public.fitness_profiles;
drop policy if exists "fp_delete_own" on public.fitness_profiles;
-- Legacy policy names from older docs
drop policy if exists "fitness_profiles_select_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_insert_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_update_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_delete_own" on public.fitness_profiles;

create policy "fp_select_own"
  on public.fitness_profiles for select
  using (auth.uid() = user_id);

create policy "fp_insert_own"
  on public.fitness_profiles for insert
  with check (auth.uid() = user_id);

create policy "fp_update_own"
  on public.fitness_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fp_delete_own"
  on public.fitness_profiles for delete
  using (auth.uid() = user_id);
