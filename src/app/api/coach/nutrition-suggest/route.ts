import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import {
  createFitnessAiClient,
  getCompletionTokenOptions,
  getFitnessAiProvider,
} from "@/lib/aiProvider";
import { enforceAiRateLimit, strictBackendFallbackResponse } from "@/lib/aiRouteGuards";
import { cleanNumber, cleanText, parseJsonObject, stringList, todayKey } from "@/lib/coachAiUtils";

type NutritionSuggestion = {
  headline: string;
  summary: string;
  suggestions: string[];
  next_best_meal: string;
};

function localSuggestion(context: Record<string, unknown>): NutritionSuggestion {
  const caloriesLeft = cleanNumber(context.calories_left);
  const proteinLeft = cleanNumber(context.protein_left);
  const waterLeft = cleanNumber(context.water_left);
  const suggestions: string[] = [];

  if (proteinLeft > 35) suggestions.push(`You are about ${Math.round(proteinLeft)}g under protein. Add a high-protein meal or snack.`);
  else if (proteinLeft > 10) suggestions.push(`Add one small protein serving to close the remaining ${Math.round(proteinLeft)}g gap.`);
  else suggestions.push("Protein is close to target. Keep the next meal balanced.");

  if (caloriesLeft > 700) suggestions.push("You still have room for a full meal with protein, carbs, and vegetables.");
  else if (caloriesLeft > 250) suggestions.push("Pick a lighter meal or snack so you do not overshoot calories.");
  else suggestions.push("Calories are mostly used. Keep the next choice light if you are still hungry.");

  if (waterLeft > 500) suggestions.push(`Drink about ${Math.round(Math.min(waterLeft, 750))} ml water over the next hour.`);

  return {
    headline: "Your nutrition next step is clear.",
    summary: "The coach suggestion is based on today's calories, protein, and hydration logs.",
    suggestions: suggestions.slice(0, 4),
    next_best_meal:
      proteinLeft > 25
        ? "Chicken, tuna, eggs, tofu, or Greek yogurt with a simple carb."
        : "A balanced plate: protein, vegetables, and a small carb portion.",
  };
}

function normalizeSuggestion(raw: Record<string, unknown>, fallback: NutritionSuggestion): NutritionSuggestion {
  return {
    headline: cleanText(raw.headline, fallback.headline, 100),
    summary: cleanText(raw.summary, fallback.summary, 220),
    suggestions: stringList(raw.suggestions, fallback.suggestions),
    next_best_meal: cleanText(raw.next_best_meal, fallback.next_best_meal, 180),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await enforceAiRateLimit({
      supabase,
      routeKey: "api-coach-nutrition-suggest",
      userId: user.id,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const question = cleanText(body.question, "What should I eat next?", 300);
    const today = todayKey();

    const [profileRes, nutritionRes, waterRes, mealsRes] = await Promise.all([
      supabase.from("profiles").select("goal,fitness_level,weight_kg,dietary_preference").eq("id", user.id).maybeSingle(),
      supabase
        .from("nutrition_logs")
        .select("target_calories,consumed_calories,target_protein_g,consumed_protein_g,target_carbs_g,consumed_carbs_g,target_fat_g,consumed_fat_g")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle(),
      supabase.from("water_logs").select("amount_ml,target_ml").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      supabase
        .from("nutrition_logs")
        .select("id,meals(title,meal_type,calories,protein_g)")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle(),
    ]);

    const nutrition = (nutritionRes.data || {}) as Record<string, unknown>;
    const water = (waterRes.data || {}) as Record<string, unknown>;
    const context = {
      question,
      goal: profileRes.data?.goal || "fitness",
      dietary_preference: profileRes.data?.dietary_preference || "balanced",
      calories_left: cleanNumber(nutrition.target_calories) - cleanNumber(nutrition.consumed_calories),
      protein_left: cleanNumber(nutrition.target_protein_g) - cleanNumber(nutrition.consumed_protein_g),
      carbs_left: cleanNumber(nutrition.target_carbs_g) - cleanNumber(nutrition.consumed_carbs_g),
      fat_left: cleanNumber(nutrition.target_fat_g) - cleanNumber(nutrition.consumed_fat_g),
      water_left: cleanNumber(water.target_ml, 2500) - cleanNumber(water.amount_ml),
      meals_logged: mealsRes.data?.meals || [],
    };
    const fallback = localSuggestion(context);
    const provider = getFitnessAiProvider("nutrition");

    if (!provider) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so nutrition suggestions require a live AI provider.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({ suggestion: fallback, source: "local" });
    }

    try {
      const client = createFitnessAiClient(provider);
      const completion = await client.chat.completions.create({
        model: provider.model,
        ...getCompletionTokenOptions(provider, 550),
        response_format: { type: "json_object" },
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content:
              "You are a practical nutrition coach for a fitness tracker. Return only JSON with keys headline, summary, suggestions, next_best_meal. Keep advice simple and non-medical.",
          },
          {
            role: "user",
            content: JSON.stringify({ context }),
          },
        ],
      });
      const raw = parseJsonObject(completion.choices[0]?.message?.content || "{}", fallback as unknown as Record<string, unknown>);
      return NextResponse.json({
        suggestion: normalizeSuggestion(raw, fallback),
        source: provider.name,
        model: provider.model,
      });
    } catch (error) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so nutrition suggestions cannot fall back to local output.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({
        suggestion: fallback,
        source: "local",
        warning: error instanceof Error ? error.message : "AI nutrition suggestion failed.",
      });
    }
  } catch (error) {
    console.error("[api/coach/nutrition-suggest]", error);
    return NextResponse.json({ error: "Could not build nutrition suggestion." }, { status: 500 });
  }
}
