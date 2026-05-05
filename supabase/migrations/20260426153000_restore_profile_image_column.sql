-- Restore profile image support for fitness_profiles.
-- This keeps the dashboard/profile editor able to store a user avatar URL.

alter table public.fitness_profiles
  add column if not exists profile_image text;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.fitness_profiles to anon, authenticated, service_role;
