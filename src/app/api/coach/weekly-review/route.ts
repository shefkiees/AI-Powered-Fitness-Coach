import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import {
  createFitnessAiClient,
  getCompletionTokenOptions,
  getFitnessAiProvider,
} from "@/lib/aiProvider";
import { enforceAiRateLimit, strictBackendFallbackResponse } from "@/lib/aiRouteGuards";
import {
  cleanNumber,
  cleanText,
  isoDateDaysAgo,
  parseJsonObject,
  stringList,
} from "@/lib/coachAiUtils";

type WeeklyReview = {
  headline: string;
  wins: string[];
  blockers: string[];
  changes: string[];
  predictions: string[];
  next_best_action: string;
};

const DEFAULT_REVIEW: WeeklyReview = {
  headline: "Your coach review is ready.",
  wins: ["You have enough data to choose one clear next step."],
  blockers: ["Keep logging workouts, nutrition, water, and weight for sharper coaching."],
  changes: ["Keep the next workout simple and repeatable."],
  predictions: ["More consistent logs will make progress predictions clearer."],
  next_best_action: "Log one workout or activity today.",
};

function fallbackReview(context: Record<string, unknown>): WeeklyReview {
  const workouts = cleanNumber(context.workouts_completed_7d);
  const skipped = cleanNumber(context.sessions_skipped_14d);
  const proteinGap = cleanNumber(context.protein_gap_today);
  const waterGap = cleanNumber(context.water_gap_today);
  const weightDelta = cleanNumber(context.weight_delta_30d, Number.NaN);
  const goal = cleanText(context.goal, "fitness");

  const wins: string[] = [];
  const blockers: string[] = [];
  const changes: string[] = [];
  const predictions: string[] = [];

  if (workouts > 0) wins.push(`${workouts} workout${workouts === 1 ? "" : "s"} logged this week.`);
  if (workouts >= cleanNumber(context.workout_target, 3)) wins.push("You are on pace with your weekly workout target.");
  if (!wins.length) wins.push("You are set up to restart with a small session today.");

  if (skipped >= 2) blockers.push("Two or more sessions were skipped recently, so intensity may be too high or timing may be off.");
  if (proteinGap > 15) blockers.push(`Protein is about ${Math.round(proteinGap)}g under target today.`);
  if (waterGap > 500) blockers.push(`Water is about ${Math.round(waterGap)} ml under target today.`);
  if (!blockers.length) blockers.push("No major blocker stands out from the saved logs.");

  if (skipped >= 2) changes.push("Make the next workout 15-25% shorter and keep it beginner-friendly.");
  if (workouts === 0) changes.push("Start with one 20-minute full-body session instead of trying to catch up.");
  if (proteinGap > 15) changes.push("Add one simple protein serving before the day ends.");
  if (waterGap > 500) changes.push("Drink 500 ml water across the next hour.");
  if (!changes.length) changes.push("Keep the plan steady and raise difficulty only after another strong session.");

  if (Number.isFinite(weightDelta) && Math.abs(weightDelta) >= 0.4) {
    predictions.push(
      weightDelta < 0
        ? "Weight is trending down; keep recovery and protein steady so training quality does not drop."
        : "Weight is trending up; if fat loss is the goal, tighten calories before adding more training.",
    );
  } else {
    predictions.push(`For your ${goal} goal, the next two weeks depend most on workout consistency.`);
  }

  return {
    headline: workouts > 0 ? "This week has useful momentum." : "This week needs one clean restart.",
    wins: wins.slice(0, 3),
    blockers: blockers.slice(0, 3),
    changes: changes.slice(0, 3),
    predictions: predictions.slice(0, 2),
    next_best_action: changes[0] || DEFAULT_REVIEW.next_best_action,
  };
}

function normalizeReview(raw: Record<string, unknown>, fallback: WeeklyReview): WeeklyReview {
  return {
    headline: cleanText(raw.headline, fallback.headline, 140),
    wins: stringList(raw.wins, fallback.wins),
    blockers: stringList(raw.blockers, fallback.blockers),
    changes: stringList(raw.changes, fallback.changes),
    predictions: stringList(raw.predictions, fallback.predictions),
    next_best_action: cleanText(raw.next_best_action, fallback.next_best_action, 180),
  };
}

export async function POST() {
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
      routeKey: "api-coach-weekly-review",
      userId: user.id,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const [
      profileRes,
      fitnessRes,
      completedRes,
      nutritionRes,
      waterRes,
      weightRes,
      goalsRes,
      skippedRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("goal,fitness_level,workout_days_per_week,weight_kg")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("fitness_profiles")
        .select("main_goal,weekly_workout_target,target_weight_kg")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("completed_workouts")
        .select("workout_title,duration_minutes,calories_burned,rating,completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", isoDateDaysAgo(14))
        .order("completed_at", { ascending: false })
        .limit(20),
      supabase
        .from("nutrition_logs")
        .select("log_date,target_calories,consumed_calories,target_protein_g,consumed_protein_g")
        .eq("user_id", user.id)
        .gte("log_date", isoDateDaysAgo(7).slice(0, 10))
        .order("log_date", { ascending: false })
        .limit(7),
      supabase
        .from("water_logs")
        .select("log_date,amount_ml,target_ml")
        .eq("user_id", user.id)
        .gte("log_date", isoDateDaysAgo(7).slice(0, 10))
        .order("log_date", { ascending: false })
        .limit(7),
      supabase
        .from("weight_logs")
        .select("weight_kg,steps,calories_burned,logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", isoDateDaysAgo(30))
        .order("logged_at", { ascending: false })
        .limit(20),
      supabase
        .from("goals")
        .select("title,current_value,target_value,unit,status,deadline")
        .eq("user_id", user.id)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_workout_sessions")
        .select("title,status,scheduled_for")
        .eq("user_id", user.id)
        .eq("status", "skipped")
        .gte("scheduled_for", isoDateDaysAgo(14))
        .order("scheduled_for", { ascending: false })
        .limit(10),
    ]);

    const profile = { ...(profileRes.data || {}), ...(fitnessRes.data || {}) };
    const completed = completedRes.data || [];
    const nutrition = nutritionRes.data || [];
    const water = waterRes.data || [];
    const weights = weightRes.data || [];
    const todayNutrition = nutrition[0] || {};
    const todayWater = water[0] || {};
    const latestWeight = cleanNumber(weights[0]?.weight_kg, Number.NaN);
    const oldestWeight = cleanNumber(weights[weights.length - 1]?.weight_kg, Number.NaN);

    const context = {
      goal: profile.goal || profile.main_goal || "fitness",
      fitness_level: profile.fitness_level || "beginner",
      workout_target: profile.workout_days_per_week || profile.weekly_workout_target || 3,
      workouts_completed_7d: completed.filter(
        (row) => new Date(String(row.completed_at)).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).length,
      workouts_completed_14d: completed.length,
      average_rating_14d:
        completed.length > 0
          ? Number(
              (
                completed.reduce((total, row) => total + cleanNumber(row.rating), 0) /
                completed.length
              ).toFixed(1),
            )
          : null,
      sessions_skipped_14d: skippedRes.data?.length || 0,
      calories_gap_today:
        cleanNumber(todayNutrition.target_calories) -
        cleanNumber(todayNutrition.consumed_calories),
      protein_gap_today:
        cleanNumber(todayNutrition.target_protein_g) -
        cleanNumber(todayNutrition.consumed_protein_g),
      water_gap_today: cleanNumber(todayWater.target_ml, 2500) - cleanNumber(todayWater.amount_ml),
      weight_delta_30d:
        Number.isFinite(latestWeight) && Number.isFinite(oldestWeight)
          ? Number((latestWeight - oldestWeight).toFixed(1))
          : null,
      active_goals: goalsRes.data || [],
    };
    const fallback = fallbackReview(context);
    const provider = getFitnessAiProvider("chat");

    if (!provider) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so the weekly review requires a live AI provider.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({ review: fallback, source: "local" });
    }

    try {
      const client = createFitnessAiClient(provider);
      const completion = await client.chat.completions.create({
        model: provider.model,
        ...getCompletionTokenOptions(provider, 650),
        response_format: { type: "json_object" },
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content:
              "You are an AI fitness coach. Return only JSON with keys headline, wins, blockers, changes, predictions, next_best_action. Keep it concise, practical, beginner-friendly, and non-medical.",
          },
          {
            role: "user",
            content: JSON.stringify({ context }),
          },
        ],
      });
      const raw = parseJsonObject(completion.choices[0]?.message?.content || "{}", fallback as unknown as Record<string, unknown>);
      const review = normalizeReview(raw, fallback);

      await supabase.from("ai_coach_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: `${review.headline}\nNext: ${review.next_best_action}`,
        category: "weekly_review",
        metadata: { source: "weekly_review", provider: provider.name, model: provider.model },
      });

      return NextResponse.json({ review, source: provider.name, model: provider.model });
    } catch (error) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so the weekly review cannot fall back to local output.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({
        review: fallback,
        source: "local",
        warning: error instanceof Error ? error.message : "AI review failed.",
      });
    }
  } catch (error) {
    console.error("[api/coach/weekly-review]", error);
    return NextResponse.json({ error: "Could not build weekly coach review." }, { status: 500 });
  }
}
