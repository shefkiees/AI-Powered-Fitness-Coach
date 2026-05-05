import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COACH_ONBOARDING_STORAGE_KEY,
  type CoachOnboardingPayload,
  mapGoalToFitnessMainGoal,
  mapGoalToProfileGoal,
} from "@/lib/coachOnboardingTypes";

function readPayload(): CoachOnboardingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COACH_ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CoachOnboardingPayload;
  } catch {
    return null;
  }
}

export function clearCoachOnboardingStorage() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COACH_ONBOARDING_STORAGE_KEY);
}

export function hasPendingCoachOnboarding(): boolean {
  return readPayload() != null;
}

async function upsertFitnessProfile(
  client: SupabaseClient,
  userId: string,
  row: Record<string, unknown>,
): Promise<string | null> {
  const { data: existing } = await client
    .from("fitness_profiles")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { user_id: _uid, ...updateRow } = row;
    void _uid;
    const { error } = await client
      .from("fitness_profiles")
      .update(updateRow)
      .eq("id", existing.id);
    return error?.message ?? null;
  }

  const { error } = await client.from("fitness_profiles").insert(row);
  return error?.message ?? null;
}

async function upsertOnboardingAnswers(
  client: SupabaseClient,
  userId: string,
  answers: Record<string, unknown>,
): Promise<string | null> {
  const { data: existing } = await client
    .from("onboarding_answers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    user_id: userId,
    answers,
    completed_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await client.from("onboarding_answers").update(payload).eq("id", existing.id);
    return error?.message ?? null;
  }

  const { error } = await client.from("onboarding_answers").insert(payload);
  if (error?.code === "42P01" || error?.message.includes("relation")) {
    return null;
  }
  return error?.message ?? null;
}

/**
 * After Supabase Auth, upsert profile + fitness row, store onboarding JSON,
 * and attach a starter plan if the user has none.
 */
export async function persistCoachOnboarding(
  user: User,
  client: SupabaseClient,
  displayName: string,
): Promise<{ error: string | null }> {
  const payload = readPayload();
  if (!payload) return { error: null };

  const profileGoal = mapGoalToProfileGoal(payload.fitnessGoal);
  const mainGoal = mapGoalToFitnessMainGoal(payload.fitnessGoal);
  const name =
    displayName.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Athlete";

  const profileRow = {
    id: user.id,
    name,
    age: payload.age,
    gender: payload.gender || "prefer_not_say",
    height_cm: payload.heightCm,
    weight_kg: payload.weightKg,
    goal: profileGoal,
    fitness_level: payload.fitnessLevel,
    workout_days_per_week: payload.workoutDaysPerWeek,
    dietary_preference: payload.nutritionPreference,
    injuries: payload.injuries || "",
    preferred_workout_days: [] as string[],
    equipment_available: payload.equipment,
  };

  const { error: profileError } = await client.from("profiles").upsert(profileRow, {
    onConflict: "id",
  });

  if (profileError) {
    return { error: profileError.message };
  }

  const fitnessRow = {
    user_id: user.id,
    fitness_level: payload.fitnessLevel,
    main_goal: mainGoal,
    target_weight_kg: payload.targetWeightKg,
    weekly_workout_target: payload.workoutDaysPerWeek,
    preferred_workout_days: [] as string[],
    equipment_available: payload.equipment,
    injuries_limitations: payload.injuries || "",
    coaching_style: "balanced",
  };

  const fpMessage = await upsertFitnessProfile(client, user.id, fitnessRow);
  if (fpMessage) {
    // Non-blocking compatibility path for older databases.
  }

  const extended = {
    ...payload,
    workoutDurationMinutes: payload.workoutDurationMinutes,
    workoutLocation: payload.workoutLocation,
    mainMotivation: payload.mainMotivation,
  };

  const obErr = await upsertOnboardingAnswers(client, user.id, extended as unknown as Record<string, unknown>);
  if (obErr) {
    // Onboarding answers are useful, but profile creation remains the critical path.
  }

  await ensureStarterWorkoutPlan(client, user.id, payload);

  clearCoachOnboardingStorage();
  return { error: null };
}

async function ensureStarterWorkoutPlan(
  client: SupabaseClient,
  userId: string,
  payload: CoachOnboardingPayload,
) {
  const { data: existing } = await client
    .from("user_workout_plans")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const { data: template } = await client
    .from("workouts")
    .select("id, title, description, slug")
    .eq("is_public", true)
    .eq("slug", "pulse-foundation-strength")
    .maybeSingle();

  if (!template?.id) return;

  const title =
    payload.fitnessLevel === "advanced"
      ? "Advanced starter — Foundation block"
      : "Your first 4 weeks — Foundation";

  await client.from("user_workout_plans").insert({
    user_id: userId,
    title,
    description:
      "Built from your onboarding answers. Start with 2–3 sessions this week and focus on form.",
    goal: mapGoalToProfileGoal(payload.fitnessGoal),
    difficulty:
      payload.fitnessLevel === "advanced"
        ? "Advanced"
        : payload.fitnessLevel === "intermediate"
          ? "Intermediate"
          : "Beginner",
    status: "active",
    plan_data: {
      source: "starter",
      template_workout_id: template.id,
      template_slug: template.slug,
      sessions_per_week: payload.workoutDaysPerWeek,
      session_minutes: payload.workoutDurationMinutes,
    },
  });
}
