-- AI Fitness Coach final unified Supabase schema.
-- Apply in Supabase SQL Editor for a clean production-ready reset.
-- This drops old duplicate app tables. Back up production data before running.

create extension if not exists "pgcrypto";

drop table if exists public.pose_feedback cascade;
drop table if exists public.pose_sessions cascade;
drop table if exists public.onboarding_answers cascade;
drop table if exists public.progress_snapshots cascade;
drop table if exists public.ai_coach_messages cascade;
drop table if exists public.body_measurements cascade;
drop table if exists public.weight_logs cascade;
drop table if exists public.water_logs cascade;
drop table if exists public.meals cascade;
drop table if exists public.nutrition_logs cascade;
drop table if exists public.favorite_workouts cascade;
drop table if exists public.completed_workouts cascade;
drop table if exists public.user_workout_sessions cascade;
drop table if exists public.user_workout_plans cascade;
drop table if exists public.workout_exercises cascade;
drop table if exists public.exercises cascade;
drop table if exists public.workouts cascade;
drop table if exists public.fitness_profiles cascade;
drop table if exists public.goals cascade;
drop table if exists public.profiles cascade;

drop table if exists public.progress cascade;
drop table if exists public.workout_logs cascade;
drop table if exists public.nutrition_plans cascade;
drop table if exists public.exercise_library cascade;
drop table if exists public.user_completed_workouts cascade;
drop table if exists public.user_workout_preferences cascade;
drop table if exists public.workout_steps cascade;
drop table if exists public.workout_media cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text,
  age integer check (age is null or age between 13 and 100),
  gender text,
  height_cm numeric(6, 2) check (height_cm is null or height_cm between 80 and 260),
  weight_kg numeric(6, 2) check (weight_kg is null or weight_kg between 25 and 400),
  goal text,
  fitness_level text not null default 'beginner',
  workout_days_per_week integer not null default 3 check (workout_days_per_week between 1 and 7),
  dietary_preference text not null default 'standard',
  injuries text not null default '',
  preferred_workout_days text[] not null default '{}'::text[],
  equipment_available text[] not null default '{}'::text[],
  profile_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fitness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fitness_level text not null default 'beginner',
  main_goal text not null default 'improve_fitness',
  target_weight_kg numeric(6, 2),
  weekly_workout_target integer not null default 3 check (weekly_workout_target between 1 and 7),
  preferred_workout_days text[] not null default '{}'::text[],
  equipment_available text[] not null default '{}'::text[],
  injuries_limitations text,
  coaching_style text not null default 'balanced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 2),
  description text default '',
  goal_type text not null default 'fitness',
  target_value numeric(10, 2),
  current_value numeric(10, 2) not null default 0,
  unit text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  deadline date,
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  slug text,
  title text not null check (char_length(trim(title)) >= 2),
  description text default '',
  category text not null default 'General',
  muscle_group text not null default 'Full body',
  difficulty text not null default 'Beginner',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
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

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete cascade,
  slug text,
  name text not null check (char_length(trim(name)) >= 2),
  description text default '',
  category text not null default 'Strength',
  muscle_group text not null default 'Full body',
  difficulty text not null default 'Beginner',
  instructions text default '',
  sets integer check (sets is null or sets > 0),
  reps text,
  time_seconds integer check (time_seconds is null or time_seconds >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  equipment text default 'Bodyweight',
  video_url text,
  image_url text,
  is_public boolean not null default false,
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text,
  sets integer check (sets is null or sets > 0),
  reps text,
  time_seconds integer check (time_seconds is null or time_seconds >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  notes text default '',
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  goal text,
  difficulty text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'archived', 'paused', 'completed')),
  plan_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  plan_id uuid references public.user_workout_plans(id) on delete set null,
  title text not null,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled')),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  calories_burned integer check (calories_burned is null or calories_burned >= 0),
  notes text default '',
  session_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.completed_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  session_id uuid references public.user_workout_sessions(id) on delete set null,
  workout_title text not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  calories_burned integer check (calories_burned is null or calories_burned >= 0),
  rating integer check (rating is null or rating between 1 and 5),
  notes text default '',
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorite_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_id)
);

create table public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  target_calories integer not null default 2000 check (target_calories > 0),
  target_protein_g integer not null default 120 check (target_protein_g >= 0),
  target_carbs_g integer not null default 200 check (target_carbs_g >= 0),
  target_fat_g integer not null default 60 check (target_fat_g >= 0),
  consumed_calories integer not null default 0 check (consumed_calories >= 0),
  consumed_protein_g integer not null default 0 check (consumed_protein_g >= 0),
  consumed_carbs_g integer not null default 0 check (consumed_carbs_g >= 0),
  consumed_fat_g integer not null default 0 check (consumed_fat_g >= 0),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  nutrition_log_id uuid references public.nutrition_logs(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 2),
  description text default '',
  meal_type text not null default 'meal',
  calories integer check (calories is null or calories >= 0),
  protein_g integer check (protein_g is null or protein_g >= 0),
  carbs_g integer check (carbs_g is null or carbs_g >= 0),
  fat_g integer check (fat_g is null or fat_g >= 0),
  order_index integer not null default 1,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  amount_ml integer not null default 0 check (amount_ml >= 0),
  target_ml integer not null default 2500 check (target_ml > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weight_kg numeric(6, 2) check (weight_kg is null or weight_kg between 25 and 400),
  calories_burned integer check (calories_burned is null or calories_burned >= 0),
  steps integer check (steps is null or steps >= 0),
  notes text default '',
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
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

create table public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  category text default 'chat',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,
  weight_kg numeric(6, 2),
  calories_burned integer not null default 0 check (calories_burned >= 0),
  workouts_completed integer not null default 0 check (workouts_completed >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  goal_progress_percent numeric(5, 2) not null default 0 check (goal_progress_percent between 0 and 100),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create table public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.pose_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_name text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  reps integer not null default 0 check (reps >= 0),
  score numeric(5, 2) not null default 0 check (score between 0 and 100),
  summary text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pose_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pose_session_id uuid not null references public.pose_sessions(id) on delete cascade,
  exercise_name text not null,
  rep_index integer check (rep_index is null or rep_index >= 0),
  score numeric(5, 2) check (score is null or score between 0 and 100),
  cue text not null,
  severity text not null default 'info' check (severity in ('positive', 'info', 'warning')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fitness_profiles_user_created_idx on public.fitness_profiles(user_id, created_at desc);
create index goals_user_status_idx on public.goals(user_id, status, created_at desc);
create index workouts_public_filters_idx on public.workouts(is_public, category, difficulty, muscle_group);
create index workouts_user_created_idx on public.workouts(user_id, created_at desc);
create unique index workouts_public_slug_unique_idx on public.workouts(slug) where is_public and slug is not null;
create index exercises_public_filters_idx on public.exercises(is_public, muscle_group, difficulty);
create index workout_exercises_workout_order_idx on public.workout_exercises(workout_id, order_index);
create index user_workout_plans_user_status_idx on public.user_workout_plans(user_id, status, created_at desc);
create index user_workout_sessions_user_schedule_idx on public.user_workout_sessions(user_id, scheduled_for);
create index completed_workouts_user_completed_idx on public.completed_workouts(user_id, completed_at desc);
create index nutrition_logs_user_date_idx on public.nutrition_logs(user_id, log_date desc);
create index meals_log_order_idx on public.meals(nutrition_log_id, order_index);
create index water_logs_user_date_idx on public.water_logs(user_id, log_date desc);
create index weight_logs_user_logged_idx on public.weight_logs(user_id, logged_at desc);
create index ai_coach_messages_user_created_idx on public.ai_coach_messages(user_id, created_at desc);
create index progress_snapshots_user_date_idx on public.progress_snapshots(user_id, snapshot_date desc);
create index pose_sessions_user_completed_idx on public.pose_sessions(user_id, completed_at desc);
create index pose_feedback_session_idx on public.pose_feedback(pose_session_id, created_at);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger fitness_profiles_set_updated_at before update on public.fitness_profiles for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals for each row execute function public.set_updated_at();
create trigger workouts_set_updated_at before update on public.workouts for each row execute function public.set_updated_at();
create trigger exercises_set_updated_at before update on public.exercises for each row execute function public.set_updated_at();
create trigger workout_exercises_set_updated_at before update on public.workout_exercises for each row execute function public.set_updated_at();
create trigger user_workout_plans_set_updated_at before update on public.user_workout_plans for each row execute function public.set_updated_at();
create trigger user_workout_sessions_set_updated_at before update on public.user_workout_sessions for each row execute function public.set_updated_at();
create trigger completed_workouts_set_updated_at before update on public.completed_workouts for each row execute function public.set_updated_at();
create trigger favorite_workouts_set_updated_at before update on public.favorite_workouts for each row execute function public.set_updated_at();
create trigger nutrition_logs_set_updated_at before update on public.nutrition_logs for each row execute function public.set_updated_at();
create trigger meals_set_updated_at before update on public.meals for each row execute function public.set_updated_at();
create trigger water_logs_set_updated_at before update on public.water_logs for each row execute function public.set_updated_at();
create trigger weight_logs_set_updated_at before update on public.weight_logs for each row execute function public.set_updated_at();
create trigger body_measurements_set_updated_at before update on public.body_measurements for each row execute function public.set_updated_at();
create trigger ai_coach_messages_set_updated_at before update on public.ai_coach_messages for each row execute function public.set_updated_at();
create trigger progress_snapshots_set_updated_at before update on public.progress_snapshots for each row execute function public.set_updated_at();
create trigger onboarding_answers_set_updated_at before update on public.onboarding_answers for each row execute function public.set_updated_at();
create trigger pose_sessions_set_updated_at before update on public.pose_sessions for each row execute function public.set_updated_at();
create trigger pose_feedback_set_updated_at before update on public.pose_feedback for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.fitness_profiles enable row level security;
alter table public.goals enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.user_workout_plans enable row level security;
alter table public.user_workout_sessions enable row level security;
alter table public.completed_workouts enable row level security;
alter table public.favorite_workouts enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.meals enable row level security;
alter table public.water_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.ai_coach_messages enable row level security;
alter table public.progress_snapshots enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.pose_sessions enable row level security;
alter table public.pose_feedback enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles for delete to authenticated using (auth.uid() = id);

create policy fitness_profiles_all_own on public.fitness_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy goals_all_own on public.goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy workouts_select_visible on public.workouts for select to authenticated using (is_public or auth.uid() = user_id);
create policy workouts_insert_own on public.workouts for insert to authenticated with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy workouts_update_own on public.workouts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy workouts_delete_own on public.workouts for delete to authenticated using (auth.uid() = user_id);

create policy exercises_select_visible on public.exercises for select to authenticated using (
  is_public or auth.uid() = user_id or exists (
    select 1 from public.workouts where workouts.id = exercises.workout_id and (workouts.is_public or workouts.user_id = auth.uid())
  )
);
create policy exercises_insert_own on public.exercises for insert to authenticated with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy exercises_update_own on public.exercises for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and coalesce(is_public, false) = false);
create policy exercises_delete_own on public.exercises for delete to authenticated using (auth.uid() = user_id);

create policy workout_exercises_select_visible on public.workout_exercises for select to authenticated using (
  auth.uid() = user_id or exists (
    select 1 from public.workouts where workouts.id = workout_exercises.workout_id and (workouts.is_public or workouts.user_id = auth.uid())
  )
);
create policy workout_exercises_insert_own on public.workout_exercises for insert to authenticated with check (auth.uid() = user_id);
create policy workout_exercises_update_own on public.workout_exercises for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy workout_exercises_delete_own on public.workout_exercises for delete to authenticated using (auth.uid() = user_id);

create policy user_workout_plans_all_own on public.user_workout_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_workout_sessions_all_own on public.user_workout_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy completed_workouts_all_own on public.completed_workouts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy favorite_workouts_all_own on public.favorite_workouts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy nutrition_logs_all_own on public.nutrition_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy meals_select_own on public.meals for select to authenticated using (
  auth.uid() = user_id or exists (
    select 1 from public.nutrition_logs where nutrition_logs.id = meals.nutrition_log_id and nutrition_logs.user_id = auth.uid()
  )
);
create policy meals_insert_own on public.meals for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.nutrition_logs where nutrition_logs.id = meals.nutrition_log_id and nutrition_logs.user_id = auth.uid()
  )
);
create policy meals_update_own on public.meals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy meals_delete_own on public.meals for delete to authenticated using (auth.uid() = user_id);

create policy water_logs_all_own on public.water_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy weight_logs_all_own on public.weight_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy body_measurements_all_own on public.body_measurements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ai_coach_messages_all_own on public.ai_coach_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy progress_snapshots_all_own on public.progress_snapshots for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy onboarding_answers_all_own on public.onboarding_answers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy pose_sessions_all_own on public.pose_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy pose_feedback_all_own on public.pose_feedback for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.exercises (user_id, slug, name, description, category, muscle_group, difficulty, instructions, sets, reps, time_seconds, rest_seconds, equipment, is_public, order_index)
values
  (null, 'bodyweight-squat', 'Bodyweight Squat', 'Foundational lower body pattern.', 'Strength', 'Legs', 'Beginner', 'Stand tall, sit hips back, keep chest proud, and drive through your feet.', 3, '10-12', 45, 60, 'Bodyweight', true, 1),
  (null, 'push-up', 'Push-up', 'Upper body push with core control.', 'Strength', 'Chest', 'Beginner', 'Keep a straight line from head to heels. Use an incline if needed.', 3, '6-12', 40, 60, 'Bodyweight', true, 2),
  (null, 'dumbbell-row', 'Dumbbell Row', 'Back strength and posture.', 'Strength', 'Back', 'Beginner', 'Pull elbow toward hip, pause, and lower with control.', 3, '10-12 each side', 45, 60, 'Dumbbells', true, 3),
  (null, 'reverse-lunge', 'Reverse Lunge', 'Single-leg control and balance.', 'Strength', 'Legs', 'Beginner', 'Step back, lower both knees, then push through the front foot.', 3, '8-10 each side', 45, 60, 'Bodyweight', true, 4),
  (null, 'plank', 'Plank', 'Core stability.', 'Strength', 'Core', 'Beginner', 'Keep ribs down, glutes on, and breathe steadily.', 3, '30-45 sec', 40, 45, 'Bodyweight', true, 5),
  (null, 'marching-intervals', 'Marching Intervals', 'Low-impact conditioning.', 'Cardio', 'Full body', 'Beginner', 'Stay tall and move at a pace that raises breathing without pain.', 4, '45 sec', 45, 30, 'Bodyweight', true, 6)
on conflict do nothing;

insert into public.workouts (user_id, slug, title, description, category, muscle_group, difficulty, duration_minutes, equipment, thumbnail_url, goal_tags, is_public, source)
values
  (null, 'pulse-foundation-strength', 'Pulse Foundation Strength', 'A balanced beginner-friendly full-body session with simple cues and safe pacing.', 'Strength', 'Full body', 'Beginner', 32, 'Bodyweight, Dumbbells', '/pulse-assets/workout-strength.jpg', array['improve_fitness','build_muscle','maintain'], true, 'seed')
on conflict do nothing;

insert into public.workout_exercises (user_id, workout_id, exercise_id, exercise_name, sets, reps, time_seconds, rest_seconds, notes, order_index)
select null, w.id, e.id, e.name, e.sets, e.reps, e.time_seconds, e.rest_seconds, e.instructions, e.order_index
from public.workouts w
join public.exercises e on e.slug in ('bodyweight-squat', 'push-up', 'dumbbell-row', 'reverse-lunge', 'plank')
where w.slug = 'pulse-foundation-strength'
on conflict do nothing;
