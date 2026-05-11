alter table public.pose_sessions
  add column if not exists ended_at timestamptz,
  add column if not exists exercise_totals jsonb not null default '{}'::jsonb,
  add column if not exists average_form_score numeric(5, 2),
  add column if not exists detected_issues jsonb not null default '[]'::jsonb,
  add column if not exists ai_coach_summary text default '';

update public.pose_sessions
set
  ended_at = coalesce(ended_at, completed_at, created_at, now()),
  average_form_score = greatest(0, least(100, coalesce(average_form_score, form_score, score, avg_form_score, 0))),
  exercise_totals = coalesce(exercise_totals, '{}'::jsonb),
  detected_issues = coalesce(detected_issues, '[]'::jsonb),
  ai_coach_summary = coalesce(ai_coach_summary, feedback_summary, summary, '')
where ended_at is null
   or average_form_score is null
   or exercise_totals is null
   or detected_issues is null
   or ai_coach_summary is null;

alter table public.pose_sessions
  alter column ended_at set default now(),
  alter column average_form_score set default 0;

alter table public.pose_sessions drop constraint if exists pose_sessions_average_form_score_check;
alter table public.pose_sessions
  add constraint pose_sessions_average_form_score_check
  check (average_form_score is null or average_form_score between 0 and 100);

create index if not exists pose_sessions_exercise_totals_gin_idx
  on public.pose_sessions using gin (exercise_totals);
