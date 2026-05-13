import { calculateNutritionTargets, generateMeals } from "@/src/utils/fitnessCalculations";
import { fetchAiEndpoint } from "@/lib/aiFetch";
import { getProfile } from "@/src/services/profileService";
import { isMissingRelationError, nullableNumber, requireSupabase, todayKey } from "@/src/services/serviceShared";

function buildNutritionPlan(profile) {
  if (!profile) return null;
  const targets = calculateNutritionTargets(profile);
  return {
    id: "computed-nutrition-plan",
    ...targets,
    log_date: todayKey(),
    target_calories: targets.calories,
    target_protein_g: targets.protein_g,
    target_carbs_g: targets.carbs_g,
    target_fat_g: targets.fat_g,
    consumed_calories: 0,
    consumed_protein_g: 0,
    consumed_carbs_g: 0,
    consumed_fat_g: 0,
    water_ml: 0,
    water_target_ml: 2500,
    meals: generateMeals(profile, targets).map((meal, index) => ({
      id: `computed-meal-${index + 1}`,
      order_index: index + 1,
      ...meal,
    })),
  };
}

function normalizeNutritionPlanRow(row) {
  if (!row) return null;
  return {
    ...row,
    calories: row.target_calories ?? row.calories ?? 0,
    protein_g: row.target_protein_g ?? row.protein_g ?? 0,
    carbs_g: row.target_carbs_g ?? row.carbs_g ?? 0,
    fat_g: row.target_fat_g ?? row.fat_g ?? 0,
    consumed_calories: row.consumed_calories ?? row.calories ?? 0,
    consumed_protein_g: row.consumed_protein_g ?? row.protein_g ?? 0,
    consumed_carbs_g: row.consumed_carbs_g ?? row.carbs_g ?? 0,
    consumed_fat_g: row.consumed_fat_g ?? row.fat_g ?? 0,
    meals: [...(row.meals || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  };
}

export async function createNutritionPlan(_userId, profile) {
  const plan = buildNutritionPlan(profile);
  if (!plan) return null;

  const client = requireSupabase();
  const { meals, id: _id, calories, protein_g, carbs_g, fat_g, ...payload } = plan;
  void _id;

  const { data: savedPlan, error } = await client
    .from("nutrition_logs")
    .upsert(
      {
        ...payload,
        log_date: todayKey(),
        target_calories: calories,
        target_protein_g: protein_g,
        target_carbs_g: carbs_g,
        target_fat_g: fat_g,
        consumed_calories: 0,
        consumed_protein_g: 0,
        consumed_carbs_g: 0,
        consumed_fat_g: 0,
      },
      { onConflict: "user_id,log_date" },
    )
    .select()
    .single();

  if (error) {
    if (isMissingRelationError(error, "nutrition_logs")) return plan;
    throw error;
  }

  await client.from("meals").delete().eq("nutrition_log_id", savedPlan.id).eq("is_template", true);

  const mealRows = meals.map((meal, index) => ({
    nutrition_log_id: savedPlan.id,
    title: meal.title,
    description: meal.description,
    meal_type: ["breakfast", "lunch", "dinner"][index] || "meal",
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    order_index: index + 1,
    is_template: true,
  }));

  const { error: mealsError } = await client.from("meals").insert(mealRows);
  if (mealsError) {
    await client.from("nutrition_logs").delete().eq("id", savedPlan.id);
    if (isMissingRelationError(mealsError, "meals")) return plan;
    throw mealsError;
  }

  return {
    ...savedPlan,
    meals: mealRows.map((meal, index) => ({
      id: `${savedPlan.id}-meal-${index + 1}`,
      ...meal,
    })),
  };
}

export async function estimateNutritionInput(input) {
  const response = await fetchAiEndpoint("/api/nutrition/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Could not estimate nutrition.");
  return data;
}

export async function getLatestNutritionPlan() {
  const client = requireSupabase();
  const { data, error } = await client.from("nutrition_logs").select("*, meals(*)").order("log_date", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    if (isMissingRelationError(error, "nutrition_logs")) {
      return buildNutritionPlan(await getProfile());
    }
    throw error;
  }

  if (data) {
    const { data: water } = await client.from("water_logs").select("*").eq("log_date", data.log_date).maybeSingle();
    return normalizeNutritionPlanRow({
      ...data,
      water_ml: water?.amount_ml || 0,
      water_target_ml: water?.target_ml || 2500,
    });
  }

  return buildNutritionPlan(await getProfile());
}

export async function getNutritionLog(date = todayKey()) {
  const client = requireSupabase();
  const { data, error } = await client.from("nutrition_logs").select("*, meals(*)").eq("log_date", date).maybeSingle();
  if (error) throw error;
  return data ? normalizeNutritionPlanRow(data) : null;
}

export async function addMealLog(values, date = todayKey()) {
  const client = requireSupabase();
  let log = await getNutritionLog(date);
  if (!log) log = await createNutritionPlan(null, await getProfile());

  const mealPayload = {
    nutrition_log_id: log.id,
    title: values.title?.trim?.() || "Meal",
    description: values.description?.trim?.() || "",
    meal_type: values.meal_type || "meal",
    calories: nullableNumber(values.calories) || 0,
    protein_g: nullableNumber(values.protein_g) || 0,
    carbs_g: nullableNumber(values.carbs_g) || 0,
    fat_g: nullableNumber(values.fat_g) || 0,
    order_index: (log.meals?.length || 0) + 1,
  };

  const { error: mealError } = await client.from("meals").insert(mealPayload);
  if (mealError) throw mealError;

  const next = {
    consumed_calories: Number(log.consumed_calories || 0) + Number(mealPayload.calories || 0),
    consumed_protein_g: Number(log.consumed_protein_g || 0) + Number(mealPayload.protein_g || 0),
    consumed_carbs_g: Number(log.consumed_carbs_g || 0) + Number(mealPayload.carbs_g || 0),
    consumed_fat_g: Number(log.consumed_fat_g || 0) + Number(mealPayload.fat_g || 0),
  };
  const { data, error } = await client.from("nutrition_logs").update(next).eq("id", log.id).select("*, meals(*)").single();
  if (error) throw error;
  return normalizeNutritionPlanRow(data);
}

export async function addWaterLog(amountMl, date = todayKey()) {
  const client = requireSupabase();
  const existing = await client.from("water_logs").select("*").eq("log_date", date).maybeSingle();
  const current = Number(existing.data?.amount_ml || 0);
  const payload = {
    log_date: date,
    amount_ml: current + Number(amountMl || 0),
    target_ml: Number(existing.data?.target_ml || 2500),
  };
  const query = existing.data?.id ? client.from("water_logs").update(payload).eq("id", existing.data.id) : client.from("water_logs").insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
