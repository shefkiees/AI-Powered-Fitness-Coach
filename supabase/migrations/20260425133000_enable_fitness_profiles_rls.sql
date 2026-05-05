-- Re-enable RLS for fitness_profiles without deleting existing rows.
-- Each authenticated user can only read and manage their own profile row.

alter table public.fitness_profiles enable row level security;
alter table public.fitness_profiles force row level security;

grant usage on schema public to authenticated, service_role;
revoke all on table public.fitness_profiles from anon;
grant select, insert, update, delete on table public.fitness_profiles to authenticated;
grant all on table public.fitness_profiles to service_role;

drop policy if exists "fp_select_own" on public.fitness_profiles;
drop policy if exists "fp_insert_own" on public.fitness_profiles;
drop policy if exists "fp_update_own" on public.fitness_profiles;
drop policy if exists "fp_delete_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_select_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_insert_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_update_own" on public.fitness_profiles;
drop policy if exists "fitness_profiles_delete_own" on public.fitness_profiles;

create policy "fp_select_own"
  on public.fitness_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "fp_insert_own"
  on public.fitness_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "fp_update_own"
  on public.fitness_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fp_delete_own"
  on public.fitness_profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);
