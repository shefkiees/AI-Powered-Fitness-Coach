alter table public.pose_sessions
  add column if not exists exercise_type text not null default 'general',
  add column if not exists duration_seconds integer not null default 0 check (duration_seconds >= 0),
  add column if not exists form_score numeric(5, 2) not null default 0 check (form_score between 0 and 100),
  add column if not exists feedback_summary text default '';

update public.pose_sessions
set
  exercise_type = coalesce(exercise_type, 'general'),
  form_score = coalesce(form_score, score),
  feedback_summary = coalesce(nullif(feedback_summary, ''), summary, '')
where exercise_type is null
   or form_score is null
   or feedback_summary is null
   or feedback_summary = '';

create index if not exists pose_sessions_user_exercise_completed_idx
  on public.pose_sessions(user_id, exercise_type, completed_at desc);
