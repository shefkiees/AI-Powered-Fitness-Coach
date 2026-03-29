-- Workout focus preference from onboarding / profile (abs, chest, legs, etc.)

alter table public.fitness_profiles
  add column if not exists workout_preference text not null default 'full_body';

comment on column public.fitness_profiles.workout_preference is
  'User focus: abs, chest, legs, full_body, fat_loss, strength, cardio';
