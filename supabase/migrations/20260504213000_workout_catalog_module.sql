-- Workouts module: catalog metadata, exercise steps, media, favorites, and completions.
-- Additive migration for the existing Pulse schema.

create extension if not exists "pgcrypto";

alter table public.workouts alter column user_id drop not null;
alter table public.workouts alter column user_id set default auth.uid();
alter table public.workouts add column if not exists slug text;
alter table public.workouts add column if not exists category text not null default 'General';
alter table public.workouts add column if not exists muscle_group text not null default 'Full body';
alter table public.workouts add column if not exists equipment text default 'Bodyweight';
alter table public.workouts add column if not exists thumbnail_url text;
alter table public.workouts add column if not exists goal_tags text[] not null default '{}'::text[];
alter table public.workouts add column if not exists is_public boolean not null default false;
alter table public.workouts add column if not exists source text not null default 'custom';
alter table public.workouts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.workout_steps (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 2),
  description text default '',
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_media (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video', 'animation')),
  media_url text not null,
  thumbnail_url text,
  alt_text text default '',
  is_primary boolean not null default false,
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_workout_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  is_favorite boolean not null default false,
  selected_at timestamptz,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_completed_workouts (
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

create unique index if not exists workouts_public_slug_unique_idx
  on public.workouts(slug)
  where is_public and slug is not null;
create index if not exists workouts_public_filters_idx
  on public.workouts(is_public, category, difficulty, muscle_group);
create index if not exists workouts_goal_tags_gin_idx
  on public.workouts using gin(goal_tags);
create index if not exists workout_steps_workout_order_idx
  on public.workout_steps(workout_id, order_index);
create index if not exists workout_media_workout_order_idx
  on public.workout_media(workout_id, order_index);
create unique index if not exists workout_media_one_primary_idx
  on public.workout_media(workout_id)
  where is_primary;
create unique index if not exists user_workout_preferences_user_workout_unique_idx
  on public.user_workout_preferences(user_id, workout_id);
create index if not exists user_workout_preferences_user_favorite_idx
  on public.user_workout_preferences(user_id, is_favorite, updated_at desc);
create index if not exists user_completed_workouts_user_completed_idx
  on public.user_completed_workouts(user_id, completed_at desc);
create index if not exists user_completed_workouts_workout_idx
  on public.user_completed_workouts(workout_id);

drop trigger if exists workout_steps_set_updated_at on public.workout_steps;
create trigger workout_steps_set_updated_at
before update on public.workout_steps
for each row execute function public.set_updated_at();

drop trigger if exists workout_media_set_updated_at on public.workout_media;
create trigger workout_media_set_updated_at
before update on public.workout_media
for each row execute function public.set_updated_at();

drop trigger if exists user_workout_preferences_set_updated_at on public.user_workout_preferences;
create trigger user_workout_preferences_set_updated_at
before update on public.user_workout_preferences
for each row execute function public.set_updated_at();

drop trigger if exists user_completed_workouts_set_updated_at on public.user_completed_workouts;
create trigger user_completed_workouts_set_updated_at
before update on public.user_completed_workouts
for each row execute function public.set_updated_at();

alter table public.workouts enable row level security;
alter table public.workout_steps enable row level security;
alter table public.workout_media enable row level security;
alter table public.user_workout_preferences enable row level security;
alter table public.user_completed_workouts enable row level security;

alter table public.workouts force row level security;
alter table public.workout_steps force row level security;
alter table public.workout_media force row level security;
alter table public.user_workout_preferences force row level security;
alter table public.user_completed_workouts force row level security;

grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.workout_steps to authenticated;
grant select, insert, update, delete on public.workout_media to authenticated;
grant select, insert, update, delete on public.user_workout_preferences to authenticated;
grant select, insert, update, delete on public.user_completed_workouts to authenticated;
grant all on public.workouts to service_role;
grant all on public.workout_steps to service_role;
grant all on public.workout_media to service_role;
grant all on public.user_workout_preferences to service_role;
grant all on public.user_completed_workouts to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

drop policy if exists "workouts_select_own" on public.workouts;
drop policy if exists "workouts_select_visible" on public.workouts;
drop policy if exists "workouts_insert_own" on public.workouts;
drop policy if exists "workouts_update_own" on public.workouts;
drop policy if exists "workouts_delete_own" on public.workouts;

create policy "workouts_select_visible"
on public.workouts
for select
to authenticated
using (is_public or auth.uid() = user_id);

create policy "workouts_insert_own"
on public.workouts
for insert
to authenticated
with check (auth.uid() = user_id and coalesce(is_public, false) = false);

create policy "workouts_update_own"
on public.workouts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and coalesce(is_public, false) = false);

create policy "workouts_delete_own"
on public.workouts
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_steps_select_visible" on public.workout_steps;
drop policy if exists "workout_steps_insert_own" on public.workout_steps;
drop policy if exists "workout_steps_update_own" on public.workout_steps;
drop policy if exists "workout_steps_delete_own" on public.workout_steps;

create policy "workout_steps_select_visible"
on public.workout_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_steps.workout_id
      and (workouts.is_public or workouts.user_id = auth.uid())
  )
);

create policy "workout_steps_insert_own"
on public.workout_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_steps.workout_id
      and workouts.user_id = auth.uid()
      and workouts.is_public = false
  )
);

create policy "workout_steps_update_own"
on public.workout_steps
for update
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_steps.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_steps.workout_id
      and workouts.user_id = auth.uid()
      and workouts.is_public = false
  )
);

create policy "workout_steps_delete_own"
on public.workout_steps
for delete
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_steps.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "workout_media_select_visible" on public.workout_media;
drop policy if exists "workout_media_insert_own" on public.workout_media;
drop policy if exists "workout_media_update_own" on public.workout_media;
drop policy if exists "workout_media_delete_own" on public.workout_media;

create policy "workout_media_select_visible"
on public.workout_media
for select
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_media.workout_id
      and (workouts.is_public or workouts.user_id = auth.uid())
  )
);

create policy "workout_media_insert_own"
on public.workout_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_media.workout_id
      and workouts.user_id = auth.uid()
      and workouts.is_public = false
  )
);

create policy "workout_media_update_own"
on public.workout_media
for update
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_media.workout_id
      and workouts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_media.workout_id
      and workouts.user_id = auth.uid()
      and workouts.is_public = false
  )
);

create policy "workout_media_delete_own"
on public.workout_media
for delete
to authenticated
using (
  exists (
    select 1
    from public.workouts
    where workouts.id = workout_media.workout_id
      and workouts.user_id = auth.uid()
  )
);

drop policy if exists "user_workout_preferences_select_own" on public.user_workout_preferences;
drop policy if exists "user_workout_preferences_insert_own" on public.user_workout_preferences;
drop policy if exists "user_workout_preferences_update_own" on public.user_workout_preferences;
drop policy if exists "user_workout_preferences_delete_own" on public.user_workout_preferences;

create policy "user_workout_preferences_select_own"
on public.user_workout_preferences
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_workout_preferences_insert_own"
on public.user_workout_preferences
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workouts
    where workouts.id = user_workout_preferences.workout_id
      and (workouts.is_public or workouts.user_id = auth.uid())
  )
);

create policy "user_workout_preferences_update_own"
on public.user_workout_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_workout_preferences_delete_own"
on public.user_workout_preferences
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_completed_workouts_select_own" on public.user_completed_workouts;
drop policy if exists "user_completed_workouts_insert_own" on public.user_completed_workouts;
drop policy if exists "user_completed_workouts_update_own" on public.user_completed_workouts;
drop policy if exists "user_completed_workouts_delete_own" on public.user_completed_workouts;

create policy "user_completed_workouts_select_own"
on public.user_completed_workouts
for select
to authenticated
using (auth.uid() = user_id);

create policy "user_completed_workouts_insert_own"
on public.user_completed_workouts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    workout_id is null
    or exists (
      select 1
      from public.workouts
      where workouts.id = user_completed_workouts.workout_id
        and (workouts.is_public or workouts.user_id = auth.uid())
    )
  )
);

create policy "user_completed_workouts_update_own"
on public.user_completed_workouts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_completed_workouts_delete_own"
on public.user_completed_workouts
for delete
to authenticated
using (auth.uid() = user_id);

insert into public.workouts (
  user_id, is_public, source, slug, title, category, muscle_group, difficulty,
  duration_minutes, description, thumbnail_url, equipment, goal_tags
)
select null, true, 'catalog', 'full-body-starter-strength', 'Full Body Starter Strength',
  'Strength', 'Full body', 'Beginner', 32,
  'A simple full-body strength session with controlled reps and clear rest periods.',
  '/pulse-assets/workout-strength.jpg', 'Bodyweight',
  array['maintain', 'improve_fitness', 'build_muscle', 'beginner']
where not exists (
  select 1 from public.workouts where slug = 'full-body-starter-strength' and is_public
);

insert into public.workouts (
  user_id, is_public, source, slug, title, category, muscle_group, difficulty,
  duration_minutes, description, thumbnail_url, equipment, goal_tags
)
select null, true, 'catalog', 'upper-body-push-basics', 'Upper Body Push Basics',
  'Strength', 'Chest', 'Beginner', 24,
  'Pressing basics for chest, shoulders, arms, and core control.',
  '/pulse-assets/workout-strength.jpg', 'Bodyweight',
  array['build_muscle', 'improve_fitness', 'beginner']
where not exists (
  select 1 from public.workouts where slug = 'upper-body-push-basics' and is_public
);

insert into public.workouts (
  user_id, is_public, source, slug, title, category, muscle_group, difficulty,
  duration_minutes, description, thumbnail_url, equipment, goal_tags
)
select null, true, 'catalog', 'low-impact-cardio-burn', 'Low Impact Cardio Burn',
  'Cardio', 'Full body', 'Beginner', 22,
  'Low-impact intervals that raise your heart rate without jumping.',
  '/pulse-assets/workout-cardio.jpg', 'Bodyweight',
  array['lose_weight', 'improve_fitness', 'beginner']
where not exists (
  select 1 from public.workouts where slug = 'low-impact-cardio-burn' and is_public
);

insert into public.workouts (
  user_id, is_public, source, slug, title, category, muscle_group, difficulty,
  duration_minutes, description, thumbnail_url, equipment, goal_tags
)
select null, true, 'catalog', 'core-stability-flow', 'Core Stability Flow',
  'Core', 'Core', 'Intermediate', 28,
  'A steady core workout built around bracing, balance, and slow control.',
  '/pulse-assets/workout-yoga.jpg', 'Mat',
  array['maintain', 'improve_fitness', 'intermediate']
where not exists (
  select 1 from public.workouts where slug = 'core-stability-flow' and is_public
);

insert into public.workouts (
  user_id, is_public, source, slug, title, category, muscle_group, difficulty,
  duration_minutes, description, thumbnail_url, equipment, goal_tags
)
select null, true, 'catalog', 'mobility-recovery-stretch', 'Mobility Recovery Stretch',
  'Mobility', 'Full body', 'Beginner', 18,
  'A short recovery session for hips, back, shoulders, and calm breathing.',
  '/pulse-assets/workout-stretch.jpg', 'Mat',
  array['maintain', 'improve_fitness', 'beginner']
where not exists (
  select 1 from public.workouts where slug = 'mobility-recovery-stretch' and is_public
);

insert into public.workouts (
  user_id, is_public, source, slug, title, category, muscle_group, difficulty,
  duration_minutes, description, thumbnail_url, equipment, goal_tags
)
select null, true, 'catalog', 'boxing-conditioning-rounds', 'Boxing Conditioning Rounds',
  'Cardio', 'Upper body', 'Intermediate', 35,
  'Punch combinations, footwork, and active recovery rounds for conditioning.',
  '/pulse-assets/workout-boxing.jpg', 'Bodyweight',
  array['lose_weight', 'improve_fitness', 'intermediate']
where not exists (
  select 1 from public.workouts where slug = 'boxing-conditioning-rounds' and is_public
);

delete from public.workout_steps
using public.workouts
where workout_steps.workout_id = workouts.id
  and workouts.slug in (
    'full-body-starter-strength',
    'upper-body-push-basics',
    'low-impact-cardio-burn',
    'core-stability-flow',
    'mobility-recovery-stretch',
    'boxing-conditioning-rounds'
  )
  and workouts.is_public;

delete from public.workout_media
using public.workouts
where workout_media.workout_id = workouts.id
  and workouts.slug in (
    'full-body-starter-strength',
    'upper-body-push-basics',
    'low-impact-cardio-burn',
    'core-stability-flow',
    'mobility-recovery-stretch',
    'boxing-conditioning-rounds'
  )
  and workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select workouts.id, steps.title, steps.description, steps.duration_seconds, steps.order_index
from public.workouts
cross join lateral (
  values
    ('Warm up', 'March in place, roll shoulders, and take three deep breaths.', 180, 1),
    ('Squat', 'Sit hips back, keep chest tall, and stand by pressing through both feet.', 420, 2),
    ('Push-up', 'Hands under shoulders, lower with control, then press up with a firm core.', 360, 3),
    ('Reverse lunge', 'Step back softly, lower both knees, then return through the front foot.', 420, 4),
    ('Plank hold', 'Elbows under shoulders, glutes tight, and steady breathing.', 240, 5)
) as steps(title, description, duration_seconds, order_index)
where workouts.slug = 'full-body-starter-strength' and workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select workouts.id, steps.title, steps.description, steps.duration_seconds, steps.order_index
from public.workouts
cross join lateral (
  values
    ('Shoulder prep', 'Circle arms slowly and open the chest before pressing.', 120, 1),
    ('Incline push-up', 'Use a bench or counter and keep a straight line from head to heels.', 360, 2),
    ('Knee push-up', 'Lower chest toward the floor and press up without shrugging.', 360, 3),
    ('Plank shoulder tap', 'Tap opposite shoulder while keeping hips quiet.', 300, 4),
    ('Chest stretch', 'Open the chest gently and breathe slowly.', 180, 5)
) as steps(title, description, duration_seconds, order_index)
where workouts.slug = 'upper-body-push-basics' and workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select workouts.id, steps.title, steps.description, steps.duration_seconds, steps.order_index
from public.workouts
cross join lateral (
  values
    ('Easy march', 'Start tall and swing your arms naturally.', 180, 1),
    ('Step jack', 'Step one foot out at a time while arms move overhead.', 300, 2),
    ('Fast feet', 'Move feet quickly with short steps and relaxed shoulders.', 240, 3),
    ('Mountain climber step', 'Hands on a bench or floor, step knees forward one at a time.', 300, 4),
    ('Cool down walk', 'Slow your pace and let breathing return to normal.', 180, 5)
) as steps(title, description, duration_seconds, order_index)
where workouts.slug = 'low-impact-cardio-burn' and workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select workouts.id, steps.title, steps.description, steps.duration_seconds, steps.order_index
from public.workouts
cross join lateral (
  values
    ('Dead bug', 'Press low back down and extend opposite arm and leg slowly.', 360, 1),
    ('Side plank', 'Stack shoulders and hips, then lift hips in a straight line.', 360, 2),
    ('Slow bicycle crunch', 'Rotate ribs toward the opposite knee without pulling the neck.', 360, 3),
    ('Bird dog', 'Reach opposite arm and leg while keeping hips level.', 300, 4),
    ('Breathing reset', 'Lie on your back and breathe low into the ribs.', 180, 5)
) as steps(title, description, duration_seconds, order_index)
where workouts.slug = 'core-stability-flow' and workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select workouts.id, steps.title, steps.description, steps.duration_seconds, steps.order_index
from public.workouts
cross join lateral (
  values
    ('Cat cow', 'Move between rounded and arched spine with slow breathing.', 180, 1),
    ('World greatest stretch', 'Step one foot forward, open the chest, and switch sides.', 300, 2),
    ('Hamstring fold', 'Hinge forward with soft knees and breathe into the stretch.', 240, 3),
    ('Child pose reach', 'Sit hips back and reach arms long without forcing range.', 180, 4),
    ('Shoulder opener', 'Clasp hands or use a towel and open the chest gently.', 180, 5)
) as steps(title, description, duration_seconds, order_index)
where workouts.slug = 'mobility-recovery-stretch' and workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select workouts.id, steps.title, steps.description, steps.duration_seconds, steps.order_index
from public.workouts
cross join lateral (
  values
    ('Boxer bounce', 'Stay light on your feet and keep hands near the face.', 180, 1),
    ('Jab cross', 'Punch straight ahead, rotate hips, and reset guard.', 360, 2),
    ('Hook combo', 'Turn through the torso and keep the opposite hand up.', 360, 3),
    ('Slip and step', 'Move head off center and step out with control.', 300, 4),
    ('Shadow round', 'Blend punches and footwork at a steady pace.', 420, 5)
) as steps(title, description, duration_seconds, order_index)
where workouts.slug = 'boxing-conditioning-rounds' and workouts.is_public;

insert into public.workout_media (
  workout_id, media_type, media_url, thumbnail_url, alt_text, is_primary, order_index
)
select workouts.id, media.media_type, media.media_url, workouts.thumbnail_url, media.alt_text, true, 1
from public.workouts
join (
  values
    ('full-body-starter-strength', 'animation', '/pulse-assets/demo-strength.svg', 'Animated squat and push-up demonstration'),
    ('upper-body-push-basics', 'animation', '/pulse-assets/demo-push.svg', 'Animated push-up demonstration'),
    ('low-impact-cardio-burn', 'animation', '/pulse-assets/demo-cardio.svg', 'Animated low-impact cardio demonstration'),
    ('core-stability-flow', 'animation', '/pulse-assets/demo-core.svg', 'Animated core stability demonstration'),
    ('mobility-recovery-stretch', 'animation', '/pulse-assets/demo-mobility.svg', 'Animated mobility stretch demonstration'),
    ('boxing-conditioning-rounds', 'animation', '/pulse-assets/demo-boxing.svg', 'Animated boxing conditioning demonstration')
) as media(slug, media_type, media_url, alt_text)
  on media.slug = workouts.slug
where workouts.is_public;

insert into public.workout_steps (workout_id, title, description, duration_seconds, order_index)
select
  exercises.workout_id,
  exercises.name,
  concat_ws(
    ' - ',
    case when exercises.sets is not null then exercises.sets::text || ' sets' end,
    nullif(exercises.reps, ''),
    nullif(exercises.notes, '')
  ),
  exercises.rest_seconds,
  coalesce(exercises.order_index, 1)
from public.exercises
where exercises.workout_id is not null
  and not exists (
    select 1
    from public.workout_steps
    where workout_steps.workout_id = exercises.workout_id
      and lower(workout_steps.title) = lower(exercises.name)
  );

insert into public.workout_media (
  workout_id, media_type, media_url, thumbnail_url, alt_text, is_primary, order_index
)
select
  workouts.id,
  'animation',
  '/pulse-assets/demo-strength.svg',
  coalesce(workouts.thumbnail_url, '/pulse-assets/workout-strength.jpg'),
  'Generated workout movement animation',
  true,
  1
from public.workouts
where workouts.user_id is not null
  and not exists (
    select 1
    from public.workout_media
    where workout_media.workout_id = workouts.id
      and workout_media.is_primary
  );

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
    insert into public.workouts (
      user_id,
      title,
      description,
      category,
      muscle_group,
      day_of_week,
      difficulty,
      equipment,
      duration_minutes,
      thumbnail_url,
      goal_tags,
      is_public,
      source
    )
    values (
      auth.uid(),
      workout_item->>'title',
      coalesce(workout_item->>'description', ''),
      'Plan',
      'Full body',
      nullif(workout_item->>'day_of_week', ''),
      coalesce(nullif(workout_item->>'difficulty', ''), 'Beginner'),
      'Bodyweight',
      nullif(workout_item->>'duration_minutes', '')::integer,
      '/pulse-assets/workout-strength.jpg',
      array_remove(array[
        nullif(workout_item->>'difficulty', ''),
        'generated'
      ]::text[], null),
      false,
      'generated'
    )
    returning id into created_workout_id;

    for exercise_item in
      select value from jsonb_array_elements(coalesce(workout_item->'exercises', '[]'::jsonb))
    loop
      insert into public.exercises (
        workout_id,
        name,
        sets,
        reps,
        weight_kg,
        rest_seconds,
        notes,
        order_index
      )
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

      insert into public.workout_steps (
        workout_id,
        title,
        description,
        duration_seconds,
        order_index
      )
      values (
        created_workout_id,
        exercise_item->>'name',
        concat_ws(
          ' - ',
          case
            when nullif(exercise_item->>'sets', '') is not null
            then exercise_item->>'sets' || ' sets'
          end,
          nullif(exercise_item->>'reps', ''),
          nullif(exercise_item->>'notes', '')
        ),
        nullif(exercise_item->>'rest_seconds', '')::integer,
        coalesce(nullif(exercise_item->>'order_index', '')::integer, 1)
      );
    end loop;

    insert into public.workout_media (
      workout_id,
      media_type,
      media_url,
      thumbnail_url,
      alt_text,
      is_primary,
      order_index
    )
    values (
      created_workout_id,
      'animation',
      '/pulse-assets/demo-strength.svg',
      '/pulse-assets/workout-strength.jpg',
      'Generated workout movement animation',
      true,
      1
    );
  end loop;
end;
$$;

grant execute on function public.replace_workout_plan(jsonb) to authenticated;
