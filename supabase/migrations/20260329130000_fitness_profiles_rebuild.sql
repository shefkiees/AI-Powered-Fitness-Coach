-- FitCoach: fitness_profiles + RLS + grants (fixes "permission denied for table")
-- WARNING: This DROPS existing fitness_profiles and all data. Run only if you accept reset.

drop table if exists public.fitness_profiles cascade;

create table public.fitness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  gender text not null,
  age integer not null,
  weight double precision not null,
  height double precision not null,
  goal text not null,
  activity_level text not null,
  created_at timestamptz not null default now(),
  constraint fitness_profiles_user_id_key unique (user_id)
);

create index fitness_profiles_user_id_idx on public.fitness_profiles (user_id);

alter table public.fitness_profiles enable row level security;

-- API roles need table + schema privileges (RLS still applies per row)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.fitness_profiles to anon, authenticated, service_role;

drop policy if exists "fp_select_own" on public.fitness_profiles;
drop policy if exists "fp_insert_own" on public.fitness_profiles;
drop policy if exists "fp_update_own" on public.fitness_profiles;
drop policy if exists "fp_delete_own" on public.fitness_profiles;

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
