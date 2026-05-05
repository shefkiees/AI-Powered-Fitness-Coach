# Supabase Production Notes

## Canonical Schema

Use `supabase-schema.sql` from the project root as the full rebuild script for a clean environment. It creates the current app tables:

- `profiles` and `fitness_profiles` for body profile, goals, level, equipment, and onboarding preferences.
- `goals` for active, paused, and completed user goals.
- `workouts`, `exercises`, and `workout_exercises` for public seed content and user-generated plans.
- `user_workout_plans`, `user_workout_sessions`, `completed_workouts`, and `favorite_workouts` for plan generation and workout tracking.
- `nutrition_logs`, `meals`, and `water_logs` for daily nutrition targets, meal logs, and hydration.
- `weight_logs`, `body_measurements`, and `progress_snapshots` for check-ins and dashboard progress.
- `ai_coach_messages` for coach chat history.
- `onboarding_answers`, `pose_sessions`, and `pose_feedback` for onboarding and form-check history.

The rebuild script drops legacy duplicate tables first: `progress`, `workout_logs`, `nutrition_plans`, `exercise_library`, `user_completed_workouts`, `user_workout_preferences`, `workout_steps`, and `workout_media`.

## RLS Pattern

Every personal table has `user_id default auth.uid()` or uses `profiles.id = auth.uid()`. App inserts generally omit `user_id`; the database assigns it and RLS verifies it.

Public seed workouts and exercises use `is_public = true` with `user_id = null`, and select policies allow authenticated users to read public rows while keeping private rows scoped to the owner.

## Migration Note

If applying migrations incrementally, include `20260505133000_fix_meals_template_policy.sql`. It fixes the `meals_insert_own` policy so generated meal templates created by `createNutritionPlan()` are allowed for the signed-in user's own `nutrition_logs` row.

## Example Calls

```js
// Current user profile through RLS.
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .maybeSingle();

// Goals are scoped by RLS; no manual user_id filter required.
const { data: goals } = await supabase
  .from("goals")
  .select("*")
  .order("created_at", { ascending: false });

// Workout library with linked exercises.
const { data: workouts } = await supabase
  .from("workouts")
  .select("*, workout_exercises(*, exercises(*))")
  .order("is_public", { ascending: false });

// Today's nutrition log with meals.
const { data: nutrition } = await supabase
  .from("nutrition_logs")
  .select("*, meals(*)")
  .eq("log_date", new Date().toISOString().slice(0, 10))
  .maybeSingle();
```
