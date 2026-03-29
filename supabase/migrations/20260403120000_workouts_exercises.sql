-- Exercise catalog, user workouts, and join table (RLS per-user on workouts)

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  muscle_group text not null default 'general',
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

drop policy if exists "exercises_select_auth" on public.exercises;
create policy "exercises_select_auth"
  on public.exercises for select
  to authenticated
  using (true);

grant select on table public.exercises to authenticated;

insert into public.exercises (name, description, muscle_group, image_url)
select 'Push-ups', 'Upper-body push pattern; keep a rigid plank.', 'chest',
  'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80&auto=format&fit=crop'
where not exists (select 1 from public.exercises e where lower(e.name) = lower('Push-ups'));

insert into public.exercises (name, description, muscle_group, image_url)
select 'Bodyweight squats', 'Hip and knee bend with chest tall.', 'legs',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80&auto=format&fit=crop'
where not exists (select 1 from public.exercises e where lower(e.name) = lower('Bodyweight squats'));

insert into public.exercises (name, description, muscle_group, image_url)
select 'Plank', 'Anti-extension core; ribs over hips.', 'core',
  'https://images.unsplash.com/photo-1566241140909-7e72a5731561?w=800&q=80&auto=format&fit=crop'
where not exists (select 1 from public.exercises e where lower(e.name) = lower('Plank'));

insert into public.exercises (name, description, muscle_group, image_url)
select 'Walking lunge', 'Step forward into a soft knee kiss.', 'legs',
  'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&q=80&auto=format&fit=crop'
where not exists (select 1 from public.exercises e where lower(e.name) = lower('Walking lunge'));

insert into public.exercises (name, description, muscle_group, image_url)
select 'Romanian deadlift', 'Hip hinge; hamstrings load.', 'legs',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop'
where not exists (select 1 from public.exercises e where lower(e.name) = lower('Romanian deadlift'));

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_id_idx on public.workouts (user_id);

alter table public.workouts enable row level security;

drop policy if exists "workouts_select_own" on public.workouts;
drop policy if exists "workouts_insert_own" on public.workouts;
drop policy if exists "workouts_update_own" on public.workouts;
drop policy if exists "workouts_delete_own" on public.workouts;

create policy "workouts_select_own"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "workouts_insert_own"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "workouts_update_own"
  on public.workouts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workouts_delete_own"
  on public.workouts for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.workouts to authenticated;

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sets text not null default '3',
  reps text not null default '10'
);

create index if not exists workout_exercises_workout_id_idx on public.workout_exercises (workout_id);

alter table public.workout_exercises enable row level security;

drop policy if exists "we_select_own" on public.workout_exercises;
drop policy if exists "we_insert_own" on public.workout_exercises;
drop policy if exists "we_update_own" on public.workout_exercises;
drop policy if exists "we_delete_own" on public.workout_exercises;

create policy "we_select_own"
  on public.workout_exercises for select
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

create policy "we_insert_own"
  on public.workout_exercises for insert
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

create policy "we_update_own"
  on public.workout_exercises for update
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

create policy "we_delete_own"
  on public.workout_exercises for delete
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.workout_exercises to authenticated;
