-- Allow the app to create generated meal rows for the signed-in user's nutrition log.
-- The 20260504230000 policy blocked `is_template = true`, but createNutritionPlan()
-- stores generated meals with that flag so they can be refreshed safely.

drop policy if exists "meals_insert_own" on public.meals;
drop policy if exists "meals_update_own" on public.meals;

create policy "meals_insert_own" on public.meals
for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    nutrition_log_id is null
    or exists (
      select 1
      from public.nutrition_logs
      where nutrition_logs.id = meals.nutrition_log_id
        and nutrition_logs.user_id = auth.uid()
    )
  )
);

create policy "meals_update_own" on public.meals
for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    nutrition_log_id is null
    or exists (
      select 1
      from public.nutrition_logs
      where nutrition_logs.id = meals.nutrition_log_id
        and nutrition_logs.user_id = auth.uid()
    )
  )
);
