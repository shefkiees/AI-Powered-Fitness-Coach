-- Supabase REST needs table privileges in addition to RLS policies.
-- Grants are guarded so this migration remains safe while the schema evolves.

grant usage on schema public to anon, authenticated, service_role;

create or replace function public.grant_app_table_if_exists(table_name text)
returns void
language plpgsql
as $$
begin
  if to_regclass(format('public.%I', table_name)) is not null then
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end if;
end;
$$;

select public.grant_app_table_if_exists('profiles');
select public.grant_app_table_if_exists('workouts');
select public.grant_app_table_if_exists('exercises');
select public.grant_app_table_if_exists('workout_logs');
select public.grant_app_table_if_exists('nutrition_plans');
select public.grant_app_table_if_exists('meals');
select public.grant_app_table_if_exists('progress');
select public.grant_app_table_if_exists('goals');

do $$
begin
  if to_regclass('public.exercise_library') is not null then
    execute 'grant select on table public.exercise_library to authenticated';
    execute 'grant all on table public.exercise_library to service_role';
  end if;
end $$;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

drop function public.grant_app_table_if_exists(text);
