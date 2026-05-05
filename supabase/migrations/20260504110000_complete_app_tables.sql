-- Current app tables for workout history, persisted nutrition plans, and exercise library.
-- This migration is additive for existing projects. For a clean rebuild, use supabase-schema.sql.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text,
  age integer,
  gender text,
  height_cm numeric(6, 2),
  weight_kg numeric(6, 2),
  goal text,
  fitness_level text default 'beginner',
  workout_days_per_week integer default 3,
  dietary_preference text default 'standard',
  injuries text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles alter column id set default auth.uid();
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists height_cm numeric(6, 2);
alter table public.profiles add column if not exists weight_kg numeric(6, 2);
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists fitness_level text default 'beginner';
alter table public.profiles add column if not exists workout_days_per_week integer default 3;
alter table public.profiles add column if not exists dietary_preference text default 'standard';
alter table public.profiles add column if not exists injuries text default '';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  target_value numeric(10, 2),
  current_value numeric(10, 2) not null default 0,
  unit text,
  status text not null default 'active',
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  day_of_week text,
  difficulty text default 'Beginner',
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workouts add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.workouts add column if not exists description text default '';
alter table public.workouts add column if not exists day_of_week text;
alter table public.workouts add column if not exists difficulty text default 'Beginner';
alter table public.workouts add column if not exists duration_minutes integer;
alter table public.workouts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts(id) on delete cascade,
  name text not null,
  sets integer,
  reps text,
  weight_kg numeric(7, 2),
  rest_seconds integer,
  notes text default '',
  order_index integer default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercises add column if not exists workout_id uuid references public.workouts(id) on delete cascade;
alter table public.exercises add column if not exists sets integer;
alter table public.exercises add column if not exists reps text;
alter table public.exercises add column if not exists weight_kg numeric(7, 2);
alter table public.exercises add column if not exists rest_seconds integer;
alter table public.exercises add column if not exists notes text default '';
alter table public.exercises add column if not exists order_index integer default 1;
alter table public.exercises add column if not exists updated_at timestamptz not null default now();
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'image_url'
  ) then
    alter table public.exercises alter column image_url drop not null;
  end if;
end $$;

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weight_kg numeric(6, 2),
  calories integer,
  steps integer,
  note text default '',
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  workout_title text not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  notes text default '',
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  calories integer not null check (calories > 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 2),
  description text default '',
  calories integer check (calories is null or calories >= 0),
  protein_g integer check (protein_g is null or protein_g >= 0),
  carbs_g integer check (carbs_g is null or carbs_g >= 0),
  fat_g integer check (fat_g is null or fat_g >= 0),
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  muscle_group text not null default 'General',
  equipment text default 'Bodyweight',
  difficulty text default 'Beginner',
  instructions text default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_goal_idx on public.profiles(goal);
create index if not exists goals_user_id_created_at_idx on public.goals(user_id, created_at desc);
create index if not exists goals_user_id_status_idx on public.goals(user_id, status);
create index if not exists workouts_user_id_created_at_idx on public.workouts(user_id, created_at desc);
create index if not exists exercises_workout_id_order_idx on public.exercises(workout_id, order_index);
create index if not exists progress_user_id_logged_at_idx on public.progress(user_id, logged_at desc);
create index if not exists workout_logs_user_id_completed_at_idx on public.workout_logs(user_id, completed_at desc);
create index if not exists nutrition_plans_user_id_created_at_idx on public.nutrition_plans(user_id, created_at desc);
create index if not exists meals_plan_id_order_idx on public.meals(plan_id, order_index);
create unique index if not exists exercise_library_name_unique_idx on public.exercise_library(lower(name));

drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

drop trigger if exists workout_logs_set_updated_at on public.workout_logs;
create trigger workout_logs_set_updated_at
before update on public.workout_logs
for each row execute function public.set_updated_at();

drop trigger if exists nutrition_plans_set_updated_at on public.nutrition_plans;
create trigger nutrition_plans_set_updated_at
before update on public.nutrition_plans
for each row execute function public.set_updated_at();

drop trigger if exists meals_set_updated_at on public.meals;
create trigger meals_set_updated_at
before update on public.meals
for each row execute function public.set_updated_at();

drop trigger if exists exercise_library_set_updated_at on public.exercise_library;
create trigger exercise_library_set_updated_at
before update on public.exercise_library
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.progress enable row level security;
alter table public.workout_logs enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.meals enable row level security;
alter table public.exercise_library enable row level security;

alter table public.profiles force row level security;
alter table public.goals force row level security;
alter table public.workouts force row level security;
alter table public.exercises force row level security;
alter table public.progress force row level security;
alter table public.workout_logs force row level security;
alter table public.nutrition_plans force row level security;
alter table public.meals force row level security;
alter table public.exercise_library force row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.progress to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;
grant select, insert, update, delete on public.nutrition_plans to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select on public.exercise_library to authenticated;
grant all on public.profiles to service_role;
grant all on public.goals to service_role;
grant all on public.workouts to service_role;
grant all on public.exercises to service_role;
grant all on public.progress to service_role;
grant all on public.workout_logs to service_role;
grant all on public.nutrition_plans to service_role;
grant all on public.meals to service_role;
grant all on public.exercise_library to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
for delete to authenticated
using (auth.uid() = id);

drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

create policy "goals_select_own" on public.goals
for select to authenticated
using (auth.uid() = user_id);

create policy "goals_insert_own" on public.goals
for insert to authenticated
with check (auth.uid() = user_id);

create policy "goals_update_own" on public.goals
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goals_delete_own" on public.goals
for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "workouts_select_own" on public.workouts;
drop policy if exists "workouts_insert_own" on public.workouts;
drop policy if exists "workouts_update_own" on public.workouts;
drop policy if exists "workouts_delete_own" on public.workouts;

create policy "workouts_select_own" on public.workouts
for select to authenticated
using (auth.uid() = user_id);

create policy "workouts_insert_own" on public.workouts
for insert to authenticated
with check (auth.uid() = user_id);

create policy "workouts_update_own" on public.workouts
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workouts_delete_own" on public.workouts
for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "exercises_select_auth" on public.exercises;
drop policy if exists "exercises_select_own" on public.exercises;
drop policy if exists "exercises_insert_own" on public.exercises;
drop policy if exists "exercises_update_own" on public.exercises;
drop policy if exists "exercises_delete_own" on public.exercises;

create policy "exercises_select_own" on public.exercises
for select to authenticated
using (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

create policy "exercises_insert_own" on public.exercises
for insert to authenticated
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

create policy "exercises_update_own" on public.exercises
for update to authenticated
using (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

create policy "exercises_delete_own" on public.exercises
for delete to authenticated
using (
  exists (
    select 1 from public.workouts
    where workouts.id = exercises.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "progress_select_own" on public.progress;
drop policy if exists "progress_insert_own" on public.progress;
drop policy if exists "progress_update_own" on public.progress;
drop policy if exists "progress_delete_own" on public.progress;

create policy "progress_select_own" on public.progress
for select to authenticated
using (auth.uid() = user_id);

create policy "progress_insert_own" on public.progress
for insert to authenticated
with check (auth.uid() = user_id);

create policy "progress_update_own" on public.progress
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "progress_delete_own" on public.progress
for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_logs_select_own" on public.workout_logs;
drop policy if exists "workout_logs_insert_own" on public.workout_logs;
drop policy if exists "workout_logs_update_own" on public.workout_logs;
drop policy if exists "workout_logs_delete_own" on public.workout_logs;

create policy "workout_logs_select_own" on public.workout_logs
for select to authenticated
using (auth.uid() = user_id);

create policy "workout_logs_insert_own" on public.workout_logs
for insert to authenticated
with check (auth.uid() = user_id);

create policy "workout_logs_update_own" on public.workout_logs
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workout_logs_delete_own" on public.workout_logs
for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "nutrition_plans_select_own" on public.nutrition_plans;
drop policy if exists "nutrition_plans_insert_own" on public.nutrition_plans;
drop policy if exists "nutrition_plans_update_own" on public.nutrition_plans;
drop policy if exists "nutrition_plans_delete_own" on public.nutrition_plans;

create policy "nutrition_plans_select_own" on public.nutrition_plans
for select to authenticated
using (auth.uid() = user_id);

create policy "nutrition_plans_insert_own" on public.nutrition_plans
for insert to authenticated
with check (auth.uid() = user_id);

create policy "nutrition_plans_update_own" on public.nutrition_plans
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "nutrition_plans_delete_own" on public.nutrition_plans
for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "meals_select_own" on public.meals;
drop policy if exists "meals_insert_own" on public.meals;
drop policy if exists "meals_update_own" on public.meals;
drop policy if exists "meals_delete_own" on public.meals;

create policy "meals_select_own" on public.meals
for select to authenticated
using (
  exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = meals.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

create policy "meals_insert_own" on public.meals
for insert to authenticated
with check (
  exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = meals.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

create policy "meals_update_own" on public.meals
for update to authenticated
using (
  exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = meals.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = meals.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

create policy "meals_delete_own" on public.meals
for delete to authenticated
using (
  exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = meals.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

drop policy if exists "exercise_library_select_authenticated" on public.exercise_library;
create policy "exercise_library_select_authenticated" on public.exercise_library
for select to authenticated
using (true);

insert into public.exercise_library (name, muscle_group, equipment, difficulty, instructions)
values
  ('Bodyweight Squat', 'Legs', 'Bodyweight', 'Beginner', 'Stand tall, sit hips back, bend knees, then drive through your feet to stand.'),
  ('Push-up', 'Chest', 'Bodyweight', 'Beginner', 'Keep hands under shoulders, lower with control, and press back up with a firm core.'),
  ('Dumbbell Row', 'Back', 'Dumbbells', 'Beginner', 'Support one hand, pull the dumbbell toward your hip, and lower slowly.'),
  ('Reverse Lunge', 'Legs', 'Bodyweight', 'Beginner', 'Step back, lower both knees, then push through the front foot to return.'),
  ('Plank', 'Core', 'Bodyweight', 'Beginner', 'Keep elbows under shoulders, squeeze glutes, and breathe steadily.'),
  ('Romanian Deadlift', 'Hamstrings', 'Dumbbells', 'Intermediate', 'Hinge at hips, keep weights close, and stand by squeezing glutes.'),
  ('Goblet Squat', 'Legs', 'Dumbbell', 'Intermediate', 'Hold one dumbbell at chest height and squat with a tall torso.'),
  ('Shoulder Press', 'Shoulders', 'Dumbbells', 'Intermediate', 'Brace your core and press weights overhead without shrugging.'),
  ('Lat Pulldown', 'Back', 'Machine', 'Intermediate', 'Pull the bar toward your upper chest and control it back up.'),
  ('Mountain Climber', 'Core', 'Bodyweight', 'Intermediate', 'Keep shoulders over wrists and alternate knees toward your chest.'),
  ('Step-up', 'Legs', 'Bench', 'Beginner', 'Step onto a stable box and drive through the full foot.'),
  ('Side Plank', 'Core', 'Bodyweight', 'Intermediate', 'Stack feet, lift hips, and hold a straight line from head to heels.')
on conflict do nothing;

create or replace function public.replace_workout_plan(plan jsonb)
returns void
language plpgsql
as $$
declare
  workout_item jsonb;
  exercise_item jsonb;
  created_workout_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  delete from public.workouts
  where user_id = auth.uid();

  for workout_item in
    select value from jsonb_array_elements(coalesce(plan, '[]'::jsonb))
  loop
    insert into public.workouts (user_id, title, description, day_of_week, difficulty, duration_minutes)
    values (
      auth.uid(),
      workout_item->>'title',
      coalesce(workout_item->>'description', ''),
      nullif(workout_item->>'day_of_week', ''),
      coalesce(nullif(workout_item->>'difficulty', ''), 'Beginner'),
      nullif(workout_item->>'duration_minutes', '')::integer
    )
    returning id into created_workout_id;

    for exercise_item in
      select value from jsonb_array_elements(coalesce(workout_item->'exercises', '[]'::jsonb))
    loop
      insert into public.exercises (workout_id, name, sets, reps, weight_kg, rest_seconds, notes, order_index)
      values (
        created_workout_id,
        exercise_item->>'name',
        nullif(exercise_item->>'sets', '')::integer,
        nullif(exercise_item->>'reps', ''),
        nullif(exercise_item->>'weight_kg', '')::numeric,
        nullif(exercise_item->>'rest_seconds', '')::integer,
        coalesce(exercise_item->>'notes', ''),
        coalesce(nullif(exercise_item->>'order_index', '')::integer, 1)
      );
    end loop;
  end loop;
end;
$$;

grant execute on function public.replace_workout_plan(jsonb) to authenticated;
