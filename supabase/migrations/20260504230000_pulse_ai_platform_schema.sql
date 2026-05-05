-- Pulse AI Fitness Coach platform schema
-- Additive, SQL Editor-ready migration for the premium dashboard rebuild.

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
alter table public.profiles add column if not exists preferred_workout_days text[] not null default '{}'::text[];
alter table public.profiles add column if not exists equipment_available text[] not null default '{}'::text[];
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.fitness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fitness_level text not null default 'beginner',
  main_goal text not null default 'improve_fitness',
  target_weight_kg numeric(6, 2),
  weekly_workout_target integer not null default 3,
  preferred_workout_days text[] not null default '{}'::text[],
  equipment_available text[] not null default '{}'::text[],
  injuries_limitations text default '',
  coaching_style text default 'balanced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  slug text,
  title text not null,
  description text default '',
  category text not null default 'General',
  muscle_group text not null default 'Full body',
  difficulty text default 'Beginner',
  duration_minutes integer,
  equipment text default 'Bodyweight',
  thumbnail_url text,
  video_url text,
  image_url text,
  goal_tags text[] not null default '{}'::text[],
  is_public boolean not null default false,
  source text not null default 'custom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workouts add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.workouts alter column user_id drop not null;
alter table public.workouts add column if not exists slug text;
alter table public.workouts add column if not exists category text not null default 'General';
alter table public.workouts add column if not exists muscle_group text not null default 'Full body';
alter table public.workouts add column if not exists difficulty text default 'Beginner';
alter table public.workouts add column if not exists duration_minutes integer;
alter table public.workouts add column if not exists equipment text default 'Bodyweight';
alter table public.workouts add column if not exists thumbnail_url text;
alter table public.workouts add column if not exists video_url text;
alter table public.workouts add column if not exists image_url text;
alter table public.workouts add column if not exists goal_tags text[] not null default '{}'::text[];
alter table public.workouts add column if not exists is_public boolean not null default false;
alter table public.workouts add column if not exists source text not null default 'custom';
alter table public.workouts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete cascade,
  slug text,
  name text not null,
  description text default '',
  category text default 'Strength',
  muscle_group text not null default 'Full body',
  difficulty text default 'Beginner',
  instructions text default '',
  sets integer,
  reps text,
  time_seconds integer,
  rest_seconds integer,
  equipment text default 'Bodyweight',
  video_url text,
  image_url text,
  is_public boolean not null default false,
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercises add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.exercises alter column user_id drop not null;
alter table public.exercises add column if not exists workout_id uuid references public.workouts(id) on delete cascade;
alter table public.exercises add column if not exists slug text;
alter table public.exercises add column if not exists description text default '';
alter table public.exercises add column if not exists category text default 'Strength';
alter table public.exercises add column if not exists muscle_group text not null default 'Full body';
alter table public.exercises add column if not exists difficulty text default 'Beginner';
alter table public.exercises add column if not exists instructions text default '';
alter table public.exercises add column if not exists sets integer;
alter table public.exercises add column if not exists reps text;
alter table public.exercises add column if not exists time_seconds integer;
alter table public.exercises add column if not exists rest_seconds integer;
alter table public.exercises add column if not exists equipment text default 'Bodyweight';
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists image_url text;
alter table public.exercises add column if not exists is_public boolean not null default false;
alter table public.exercises add column if not exists order_index integer not null default 1;
alter table public.exercises add column if not exists updated_at timestamptz not null default now();

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text,
  sets integer,
  reps text,
  time_seconds integer,
  rest_seconds integer,
  notes text default '',
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_exercises add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.workout_exercises alter column user_id drop not null;
alter table public.workout_exercises add column if not exists exercise_name text;
alter table public.workout_exercises add column if not exists time_seconds integer;
alter table public.workout_exercises add column if not exists rest_seconds integer;
alter table public.workout_exercises add column if not exists notes text default '';
alter table public.workout_exercises add column if not exists order_index integer not null default 1;
alter table public.workout_exercises add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  goal text,
  difficulty text default 'Beginner',
  start_date date,
  end_date date,
  status text not null default 'active',
  plan_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  plan_id uuid references public.user_workout_plans(id) on delete set null,
  title text not null,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'scheduled',
  duration_minutes integer,
  calories_burned integer,
  notes text default '',
  session_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.completed_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  session_id uuid references public.user_workout_sessions(id) on delete set null,
  workout_title text not null,
  duration_minutes integer,
  calories_burned integer,
  rating integer,
  notes text default '',
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  calories integer default 0,
  protein_g integer default 0,
  carbs_g integer default 0,
  fat_g integer default 0,
  fiber_g integer default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  nutrition_log_id uuid references public.nutrition_logs(id) on delete cascade,
  plan_id uuid,
  title text not null,
  description text default '',
  meal_type text default 'meal',
  calories integer default 0,
  protein_g integer default 0,
  carbs_g integer default 0,
  fat_g integer default 0,
  order_index integer not null default 1,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meals add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.meals alter column user_id drop not null;
alter table public.meals add column if not exists nutrition_log_id uuid references public.nutrition_logs(id) on delete cascade;
alter table public.meals add column if not exists meal_type text default 'meal';
alter table public.meals add column if not exists is_template boolean not null default false;
alter table public.meals add column if not exists updated_at timestamptz not null default now();

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  amount_ml integer not null default 0,
  target_ml integer not null default 2500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_at date not null default current_date,
  chest_cm numeric(6, 2),
  waist_cm numeric(6, 2),
  hips_cm numeric(6, 2),
  arm_cm numeric(6, 2),
  thigh_cm numeric(6, 2),
  body_fat_percent numeric(5, 2),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weight_kg numeric(6, 2) not null,
  logged_at timestamptz not null default now(),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  goal_type text default 'fitness',
  target_value numeric(10, 2),
  current_value numeric(10, 2) not null default 0,
  unit text,
  status text not null default 'active',
  deadline date,
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals add column if not exists goal_type text default 'fitness';
alter table public.goals add column if not exists milestones jsonb not null default '[]'::jsonb;
alter table public.goals add column if not exists updated_at timestamptz not null default now();

create table if not exists public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  category text default 'coaching',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,
  weight_kg numeric(6, 2),
  calories_burned integer default 0,
  workouts_completed integer default 0,
  streak_days integer default 0,
  goal_progress_percent numeric(5, 2) default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fitness_profiles_user_id_idx on public.fitness_profiles(user_id);
create index if not exists workouts_user_created_idx on public.workouts(user_id, created_at desc);
create index if not exists workouts_public_filters_idx on public.workouts(is_public, category, difficulty, muscle_group);
create unique index if not exists workouts_public_slug_unique_idx on public.workouts(slug) where is_public and slug is not null;
create index if not exists exercises_user_created_idx on public.exercises(user_id, created_at desc);
create index if not exists exercises_public_filters_idx on public.exercises(is_public, category, muscle_group, difficulty);
create unique index if not exists exercises_public_slug_unique_idx on public.exercises(slug) where is_public and slug is not null;
create index if not exists workout_exercises_workout_order_idx on public.workout_exercises(workout_id, order_index);
create index if not exists workout_exercises_user_idx on public.workout_exercises(user_id);
create index if not exists user_workout_plans_user_status_idx on public.user_workout_plans(user_id, status, created_at desc);
create index if not exists user_workout_sessions_user_status_idx on public.user_workout_sessions(user_id, status, scheduled_for);
create index if not exists completed_workouts_user_completed_idx on public.completed_workouts(user_id, completed_at desc);
create unique index if not exists favorite_workouts_user_workout_unique_idx on public.favorite_workouts(user_id, workout_id);
create index if not exists nutrition_logs_user_date_idx on public.nutrition_logs(user_id, log_date desc);
create index if not exists meals_user_created_idx on public.meals(user_id, created_at desc);
create index if not exists meals_nutrition_log_idx on public.meals(nutrition_log_id, order_index);
create index if not exists water_logs_user_date_idx on public.water_logs(user_id, log_date desc);
create index if not exists body_measurements_user_date_idx on public.body_measurements(user_id, measured_at desc);
create index if not exists weight_logs_user_logged_idx on public.weight_logs(user_id, logged_at desc);
create index if not exists goals_user_status_idx on public.goals(user_id, status, created_at desc);
create index if not exists ai_coach_messages_user_created_idx on public.ai_coach_messages(user_id, created_at desc);
create unique index if not exists progress_snapshots_user_date_unique_idx on public.progress_snapshots(user_id, snapshot_date);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'fitness_profiles', 'workouts', 'exercises', 'workout_exercises',
    'user_workout_plans', 'user_workout_sessions', 'completed_workouts',
    'favorite_workouts', 'nutrition_logs', 'meals', 'water_logs',
    'body_measurements', 'weight_logs', 'goals', 'ai_coach_messages',
    'progress_snapshots'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end $$;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.fitness_profiles to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workout_exercises to authenticated;
grant select, insert, update, delete on public.user_workout_plans to authenticated;
grant select, insert, update, delete on public.user_workout_sessions to authenticated;
grant select, insert, update, delete on public.completed_workouts to authenticated;
grant select, insert, update, delete on public.favorite_workouts to authenticated;
grant select, insert, update, delete on public.nutrition_logs to authenticated;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.water_logs to authenticated;
grant select, insert, update, delete on public.body_measurements to authenticated;
grant select, insert, update, delete on public.weight_logs to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.ai_coach_messages to authenticated;
grant select, insert, update, delete on public.progress_snapshots to authenticated;
grant usage, select on all sequences in schema public to authenticated, service_role;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);

drop policy if exists "workouts_select_visible" on public.workouts;
drop policy if exists "workouts_insert_own" on public.workouts;
drop policy if exists "workouts_update_own" on public.workouts;
drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_select_visible" on public.workouts for select to authenticated using (is_public or auth.uid() = user_id);
create policy "workouts_insert_own" on public.workouts for insert to authenticated with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy "workouts_update_own" on public.workouts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy "workouts_delete_own" on public.workouts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "exercises_select_visible" on public.exercises;
drop policy if exists "exercises_insert_own" on public.exercises;
drop policy if exists "exercises_update_own" on public.exercises;
drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_select_visible" on public.exercises for select to authenticated using (is_public or auth.uid() = user_id or exists (select 1 from public.workouts where workouts.id = exercises.workout_id and workouts.user_id = auth.uid()));
create policy "exercises_insert_own" on public.exercises for insert to authenticated with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy "exercises_update_own" on public.exercises for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy "exercises_delete_own" on public.exercises for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "workout_exercises_select_visible" on public.workout_exercises;
drop policy if exists "workout_exercises_insert_own" on public.workout_exercises;
drop policy if exists "workout_exercises_update_own" on public.workout_exercises;
drop policy if exists "workout_exercises_delete_own" on public.workout_exercises;
create policy "workout_exercises_select_visible" on public.workout_exercises for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.workouts where workouts.id = workout_exercises.workout_id and (workouts.is_public or workouts.user_id = auth.uid())));
create policy "workout_exercises_insert_own" on public.workout_exercises for insert to authenticated with check (auth.uid() = user_id);
create policy "workout_exercises_update_own" on public.workout_exercises for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_exercises_delete_own" on public.workout_exercises for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "meals_select_visible" on public.meals;
drop policy if exists "meals_insert_own" on public.meals;
drop policy if exists "meals_update_own" on public.meals;
drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_select_visible" on public.meals for select to authenticated using (is_template or auth.uid() = user_id or exists (select 1 from public.nutrition_logs where nutrition_logs.id = meals.nutrition_log_id and nutrition_logs.user_id = auth.uid()));
create policy "meals_insert_own" on public.meals for insert to authenticated with check (auth.uid() = user_id and coalesce(is_template, false) = false);
create policy "meals_update_own" on public.meals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and coalesce(is_template, false) = false);
create policy "meals_delete_own" on public.meals for delete to authenticated using (auth.uid() = user_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'fitness_profiles', 'user_workout_plans', 'user_workout_sessions',
    'completed_workouts', 'favorite_workouts', 'nutrition_logs', 'water_logs',
    'body_measurements', 'weight_logs', 'goals', 'ai_coach_messages',
    'progress_snapshots'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)', table_name || '_delete_own', table_name);
  end loop;
end $$;

insert into public.exercises (
  user_id, slug, name, description, category, muscle_group, difficulty, instructions,
  sets, reps, time_seconds, rest_seconds, equipment, image_url, is_public
)
values
  (null, 'bodyweight-squat', 'Bodyweight Squat', 'Foundational lower-body movement for legs and core control.', 'Strength', 'Legs', 'Beginner', 'Stand tall, sit hips back, bend knees, then press through both feet to stand.', 3, '10-12', null, 60, 'Bodyweight', '/pulse-assets/workout-strength.jpg', true),
  (null, 'push-up', 'Push-up', 'Upper-body press for chest, shoulders, triceps, and core.', 'Strength', 'Chest', 'Beginner', 'Hands under shoulders, lower with control, keep a straight body line, then press up.', 3, '8-12', null, 60, 'Bodyweight', '/pulse-assets/demo-push.svg', true),
  (null, 'dumbbell-row', 'Dumbbell Row', 'Back-focused pulling exercise for posture and upper-body strength.', 'Strength', 'Back', 'Beginner', 'Support one hand, pull the dumbbell toward your hip, pause, then lower slowly.', 3, '10 each side', null, 75, 'Dumbbells', '/pulse-assets/workout-strength.jpg', true),
  (null, 'reverse-lunge', 'Reverse Lunge', 'Single-leg lower-body movement with balance and glute focus.', 'Strength', 'Legs', 'Beginner', 'Step back, lower both knees, then drive through the front foot to return.', 3, '8 each side', null, 75, 'Bodyweight', '/pulse-assets/workout-strength.jpg', true),
  (null, 'plank', 'Plank', 'Core stability hold for bracing and posture.', 'Core', 'Core', 'Beginner', 'Elbows under shoulders, glutes tight, ribs down, and breathe steadily.', 3, '30 sec', 30, 45, 'Mat', '/pulse-assets/demo-core.svg', true),
  (null, 'mountain-climber', 'Mountain Climber', 'Conditioning move for cardio and core control.', 'Cardio', 'Full body', 'Intermediate', 'Keep shoulders over wrists and alternate knees toward the chest without bouncing hips.', 4, '30 sec', 30, 35, 'Bodyweight', '/pulse-assets/demo-cardio.svg', true)
on conflict do nothing;

insert into public.workouts (
  user_id, slug, title, description, category, muscle_group, difficulty, duration_minutes,
  equipment, thumbnail_url, image_url, goal_tags, is_public, source
)
values
  (null, 'pulse-foundation-strength', 'Pulse Foundation Strength', 'A balanced strength session for building consistency, control, and confidence.', 'Strength', 'Full body', 'Beginner', 35, 'Bodyweight', '/pulse-assets/workout-strength.jpg', '/pulse-assets/workout-strength.jpg', array['improve_fitness', 'build_muscle', 'beginner'], true, 'platform_seed'),
  (null, 'metabolic-cardio-flow', 'Metabolic Cardio Flow', 'Low-impact conditioning with short rounds and clean movement quality.', 'Cardio', 'Full body', 'Beginner', 24, 'Bodyweight', '/pulse-assets/workout-cardio.jpg', '/pulse-assets/workout-cardio.jpg', array['lose_weight', 'improve_fitness', 'beginner'], true, 'platform_seed'),
  (null, 'upper-body-primer', 'Upper Body Primer', 'A premium starter session for chest, shoulders, back, and arms.', 'Strength', 'Upper body', 'Intermediate', 42, 'Dumbbells', '/pulse-assets/workout-boxing.jpg', '/pulse-assets/workout-boxing.jpg', array['build_muscle', 'intermediate'], true, 'platform_seed'),
  (null, 'mobility-reset', 'Mobility Reset', 'A focused recovery session for hips, back, shoulders, and breathing.', 'Mobility', 'Full body', 'Beginner', 18, 'Mat', '/pulse-assets/workout-stretch.jpg', '/pulse-assets/workout-stretch.jpg', array['maintain', 'improve_fitness', 'recovery'], true, 'platform_seed')
on conflict do nothing;

insert into public.workout_exercises (
  user_id, workout_id, exercise_id, exercise_name, sets, reps, time_seconds, rest_seconds, order_index
)
select
  null,
  w.id,
  e.id,
  e.name,
  e.sets,
  e.reps,
  e.time_seconds,
  e.rest_seconds,
  row_number() over (partition by w.id order by e.name)::integer
from public.workouts w
join public.exercises e on (
  (w.slug = 'pulse-foundation-strength' and e.slug in ('bodyweight-squat', 'push-up', 'reverse-lunge', 'plank')) or
  (w.slug = 'metabolic-cardio-flow' and e.slug in ('mountain-climber', 'bodyweight-squat', 'plank')) or
  (w.slug = 'upper-body-primer' and e.slug in ('push-up', 'dumbbell-row', 'plank')) or
  (w.slug = 'mobility-reset' and e.slug in ('plank', 'reverse-lunge'))
)
where w.is_public
  and not exists (
    select 1
    from public.workout_exercises we
    where we.workout_id = w.id
      and we.exercise_id = e.id
  );
