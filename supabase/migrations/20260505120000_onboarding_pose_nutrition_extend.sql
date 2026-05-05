-- Onboarding snapshot, pose session logs, optional unique fitness profile per user,
-- and starter nutrition plan column guards.
-- Safe if public.fitness_profiles or public.nutrition_plans do not exist yet (run platform migration first for full schema).

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

-- Raw onboarding wizard answers (full payload) for analytics & coach context
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_answers_user_unique unique (user_id)
);

create index if not exists onboarding_answers_user_id_idx on public.onboarding_answers(user_id);

-- Pose workout sessions (MediaPipe / TFJS hook-up later)
create table if not exists public.pose_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null default 'squat',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_reps integer not null default 0,
  avg_form_score numeric(5, 2),
  device_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pose_sessions_user_started_idx on public.pose_sessions(user_id, started_at desc);

create table if not exists public.pose_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.pose_sessions(id) on delete cascade,
  message text not null,
  severity text not null default 'info' check (severity in ('info', 'warn', 'success')),
  rep_index integer,
  form_score numeric(5, 2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pose_feedback_session_idx on public.pose_feedback(session_id, created_at);
create index if not exists pose_feedback_user_idx on public.pose_feedback(user_id, created_at desc);

-- fitness_profiles: dedupe + unique(user_id) only when that table already exists
-- (created in e.g. 20260504230000_pulse_ai_platform_schema.sql)
do $$
begin
  if to_regclass('public.fitness_profiles') is not null then
    delete from public.fitness_profiles f
    using public.fitness_profiles f2
    where f.user_id = f2.user_id
      and f.created_at < f2.created_at;

    if not exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = 'fitness_profiles_one_per_user_idx'
    ) then
      execute
        'create unique index fitness_profiles_one_per_user_idx on public.fitness_profiles(user_id)';
    end if;
  end if;
end $$;

-- nutrition_plans: optional columns + trigger only when table exists
do $$
begin
  if to_regclass('public.nutrition_plans') is not null then
    alter table public.nutrition_plans add column if not exists user_id uuid references auth.users(id) on delete cascade;
    alter table public.nutrition_plans add column if not exists title text default 'Nutrition plan';
    alter table public.nutrition_plans add column if not exists notes text default '';
    alter table public.nutrition_plans add column if not exists updated_at timestamptz not null default now();

    drop trigger if exists nutrition_plans_set_updated_at on public.nutrition_plans;
    create trigger nutrition_plans_set_updated_at
    before update on public.nutrition_plans
    for each row execute function public.set_updated_at();
  end if;
end $$;

drop trigger if exists onboarding_answers_set_updated_at on public.onboarding_answers;
create trigger onboarding_answers_set_updated_at
before update on public.onboarding_answers
for each row execute function public.set_updated_at();

drop trigger if exists pose_sessions_set_updated_at on public.pose_sessions;
create trigger pose_sessions_set_updated_at
before update on public.pose_sessions
for each row execute function public.set_updated_at();

drop trigger if exists pose_feedback_set_updated_at on public.pose_feedback;
create trigger pose_feedback_set_updated_at
before update on public.pose_feedback
for each row execute function public.set_updated_at();

alter table public.onboarding_answers enable row level security;
alter table public.pose_sessions enable row level security;
alter table public.pose_feedback enable row level security;

grant select, insert, update, delete on public.onboarding_answers to authenticated;
grant select, insert, update, delete on public.pose_sessions to authenticated;
grant select, insert, update, delete on public.pose_feedback to authenticated;

drop policy if exists onboarding_answers_select_own on public.onboarding_answers;
drop policy if exists onboarding_answers_insert_own on public.onboarding_answers;
drop policy if exists onboarding_answers_update_own on public.onboarding_answers;
drop policy if exists onboarding_answers_delete_own on public.onboarding_answers;
create policy onboarding_answers_select_own on public.onboarding_answers for select to authenticated using (auth.uid() = user_id);
create policy onboarding_answers_insert_own on public.onboarding_answers for insert to authenticated with check (auth.uid() = user_id);
create policy onboarding_answers_update_own on public.onboarding_answers for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy onboarding_answers_delete_own on public.onboarding_answers for delete to authenticated using (auth.uid() = user_id);

drop policy if exists pose_sessions_select_own on public.pose_sessions;
drop policy if exists pose_sessions_insert_own on public.pose_sessions;
drop policy if exists pose_sessions_update_own on public.pose_sessions;
drop policy if exists pose_sessions_delete_own on public.pose_sessions;
create policy pose_sessions_select_own on public.pose_sessions for select to authenticated using (auth.uid() = user_id);
create policy pose_sessions_insert_own on public.pose_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy pose_sessions_update_own on public.pose_sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy pose_sessions_delete_own on public.pose_sessions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists pose_feedback_select_own on public.pose_feedback;
drop policy if exists pose_feedback_insert_own on public.pose_feedback;
drop policy if exists pose_feedback_update_own on public.pose_feedback;
drop policy if exists pose_feedback_delete_own on public.pose_feedback;
create policy pose_feedback_select_own on public.pose_feedback for select to authenticated using (auth.uid() = user_id);
create policy pose_feedback_insert_own on public.pose_feedback for insert to authenticated with check (auth.uid() = user_id);
create policy pose_feedback_update_own on public.pose_feedback for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy pose_feedback_delete_own on public.pose_feedback for delete to authenticated using (auth.uid() = user_id);
