create table if not exists public.pose_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_name text not null default 'Movement check',
  exercise_type text not null default 'general',
  started_at timestamptz not null default now(),
  completed_at timestamptz default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  reps integer not null default 0 check (reps >= 0),
  score numeric(5, 2) not null default 0 check (score between 0 and 100),
  form_score numeric(5, 2) not null default 0 check (form_score between 0 and 100),
  summary text default '',
  feedback_summary text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pose_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pose_session_id uuid references public.pose_sessions(id) on delete cascade,
  exercise_name text not null default 'Movement check',
  rep_index integer check (rep_index is null or rep_index >= 0),
  score numeric(5, 2) check (score is null or score between 0 and 100),
  cue text not null default '',
  severity text not null default 'info',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pose_sessions
  alter column user_id set default auth.uid(),
  add column if not exists exercise_key text,
  add column if not exists exercise_name text,
  add column if not exists exercise_type text not null default 'general',
  add column if not exists ended_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists total_reps integer,
  add column if not exists reps integer not null default 0,
  add column if not exists avg_form_score numeric(5, 2),
  add column if not exists score numeric(5, 2) not null default 0,
  add column if not exists form_score numeric(5, 2) not null default 0,
  add column if not exists summary text default '',
  add column if not exists feedback_summary text default '',
  add column if not exists device_info jsonb not null default '{}'::jsonb;

update public.pose_sessions
set
  exercise_type = coalesce(nullif(exercise_type, ''), nullif(exercise_key, ''), 'general'),
  exercise_name = coalesce(
    nullif(exercise_name, ''),
    nullif(device_info->>'exercise_name', ''),
    initcap(replace(coalesce(nullif(exercise_type, ''), nullif(exercise_key, ''), 'general'), '_', ' '))
  ),
  completed_at = coalesce(completed_at, ended_at, created_at, now()),
  duration_seconds = greatest(
    0,
    coalesce(
      duration_seconds,
      nullif(device_info->>'duration_seconds', '')::integer,
      extract(epoch from (coalesce(ended_at, completed_at, created_at, now()) - started_at))::integer,
      0
    )
  ),
  reps = greatest(0, coalesce(reps, total_reps, 0)),
  score = greatest(0, least(100, coalesce(score, avg_form_score, form_score, 0))),
  form_score = greatest(0, least(100, coalesce(form_score, score, avg_form_score, 0))),
  summary = coalesce(nullif(summary, ''), nullif(device_info->>'feedback_summary', ''), ''),
  feedback_summary = coalesce(nullif(feedback_summary, ''), nullif(summary, ''), nullif(device_info->>'feedback_summary', ''), '')
where exercise_name is null
   or exercise_name = ''
   or completed_at is null
   or duration_seconds is null
   or reps is null
   or score is null
   or form_score is null
   or feedback_summary is null;

alter table public.pose_sessions
  alter column exercise_name set default 'Movement check',
  alter column exercise_name set not null,
  alter column completed_at set default now();

alter table public.pose_feedback
  alter column user_id set default auth.uid(),
  add column if not exists session_id uuid references public.pose_sessions(id) on delete cascade,
  add column if not exists pose_session_id uuid references public.pose_sessions(id) on delete cascade,
  add column if not exists exercise_name text,
  add column if not exists message text,
  add column if not exists form_score numeric(5, 2),
  add column if not exists score numeric(5, 2),
  add column if not exists cue text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.pose_feedback
set
  pose_session_id = coalesce(pose_session_id, session_id),
  exercise_name = coalesce(nullif(exercise_name, ''), metadata->>'exercise_name', 'Movement check'),
  score = coalesce(score, form_score),
  cue = coalesce(nullif(cue, ''), nullif(message, ''), '')
where pose_session_id is null
   or exercise_name is null
   or exercise_name = ''
   or cue is null;

alter table public.pose_feedback
  alter column exercise_name set default 'Movement check',
  alter column exercise_name set not null,
  alter column cue set default '',
  alter column cue set not null;

alter table public.pose_feedback drop constraint if exists pose_feedback_severity_check;
alter table public.pose_feedback
  add constraint pose_feedback_severity_check
  check (severity in ('positive', 'info', 'warning', 'success', 'warn'));

create index if not exists pose_sessions_user_exercise_completed_idx
  on public.pose_sessions(user_id, exercise_type, completed_at desc);

create index if not exists pose_feedback_pose_session_idx
  on public.pose_feedback(pose_session_id, created_at);

alter table public.pose_sessions enable row level security;
alter table public.pose_feedback enable row level security;

grant select, insert, update, delete on public.pose_sessions to authenticated;
grant select, insert, update, delete on public.pose_feedback to authenticated;

drop policy if exists pose_sessions_all_own on public.pose_sessions;
create policy pose_sessions_all_own
on public.pose_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists pose_feedback_all_own on public.pose_feedback;
create policy pose_feedback_all_own
on public.pose_feedback
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
