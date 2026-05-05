import { requireSupabase } from "@/src/lib/supabaseClient";
import {
  getExerciseLibrary,
  getGoals,
  getLatestNutritionPlan,
  getProfile,
  getProgressLogs,
  getUserCompletedWorkouts,
  getUserWorkoutPreferences,
  getWorkoutLibrary,
  getWorkoutLogs,
} from "@/src/utils/supabaseData";

function textFromError(error) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
}

function isMissingTable(error) {
  const message = textFromError(error).toLowerCase();
  return (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    error?.code === "PGRST202" ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

async function safeQuery(label, query, fallback) {
  try {
    const result = await query();
    return { data: result ?? fallback, warning: "" };
  } catch (error) {
    if (isMissingTable(error)) {
      return { data: fallback, warning: `${label} table is not available yet.` };
    }

    throw error;
  }
}

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function countCompletedThisWeek(rows) {
  const weekStart = startOfWeek();
  return rows.filter((row) => {
    const date = new Date(row.completed_at || row.created_at);
    return !Number.isNaN(date.getTime()) && date >= weekStart;
  }).length;
}

function calculateStreak(rows) {
  const completedDays = new Set(rows.map((row) => toDateKey(row.completed_at || row.created_at)).filter(Boolean));
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < 365; index += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!completedDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function normalizeCompletedWorkouts(newRows, legacyRows) {
  if (newRows.length) return newRows;
  return legacyRows.map((row) => ({
    ...row,
    workout_title: row.workout_title || row.title || "Workout",
    calories_burned: row.calories_burned || null,
  }));
}

function nutritionFromPlan(plan) {
  if (!plan) {
    return {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      meals: [],
    };
  }

  return {
    calories: plan.calories || 0,
    protein_g: plan.protein_g || 0,
    carbs_g: plan.carbs_g || 0,
    fat_g: plan.fat_g || 0,
    meals: plan.meals || [],
  };
}

function buildCoachMessages(profile, workouts, goals) {
  const goal = profile?.goal || "improve_fitness";
  const level = profile?.fitness_level || "beginner";
  const nextWorkout = workouts[0];

  return [
    {
      id: "coach-seed-1",
      role: "assistant",
      content: `Your current focus is ${goal.replace(/_/g, " ")}. Keep today's session simple and finish with clean reps.`,
      category: "daily_recommendation",
      created_at: new Date().toISOString(),
    },
    {
      id: "coach-seed-2",
      role: "assistant",
      content: nextWorkout
        ? `Recommended next: ${nextWorkout.title}. It matches your ${level} training level and current plan direction.`
        : "Create or generate a workout plan so I can recommend the next best session.",
      category: "workout_plan",
      created_at: new Date().toISOString(),
    },
    {
      id: "coach-seed-3",
      role: "assistant",
      content: goals?.length
        ? `Your highest-impact milestone this week is: ${goals[0].title}.`
        : "Add a measurable goal so your weekly milestones can become more precise.",
      category: "goal_feedback",
      created_at: new Date().toISOString(),
    },
  ];
}

export async function loadPulseDashboardData() {
  const client = requireSupabase();

  const [
    profileResult,
    workoutsResult,
    preferencesResult,
    completedResult,
    legacyWorkoutLogsResult,
    exercisesResult,
    goalsResult,
    nutritionPlanResult,
    progressLogsResult,
    fitnessProfilesResult,
    workoutPlansResult,
    sessionsResult,
    completedPlatformResult,
    favoritePlatformResult,
    nutritionLogsResult,
    waterLogsResult,
    measurementsResult,
    weightLogsResult,
    coachMessagesResult,
    snapshotsResult,
  ] = await Promise.all([
    safeQuery("profiles", () => getProfile(), null),
    safeQuery("workouts", () => getWorkoutLibrary(), []),
    safeQuery("user_workout_preferences", () => getUserWorkoutPreferences(), []),
    safeQuery("user_completed_workouts", () => getUserCompletedWorkouts(), []),
    safeQuery("workout_logs", () => getWorkoutLogs(), []),
    safeQuery("exercises", () => getExerciseLibrary(), []),
    safeQuery("goals", () => getGoals(), []),
    safeQuery("nutrition_plans", () => getLatestNutritionPlan(), null),
    safeQuery("progress", () => getProgressLogs(), []),
    safeQuery("fitness_profiles", async () => {
      const { data, error } = await client.from("fitness_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("user_workout_plans", async () => {
      const { data, error } = await client.from("user_workout_plans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("user_workout_sessions", async () => {
      const { data, error } = await client
        .from("user_workout_sessions")
        .select("*")
        .order("scheduled_for", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("completed_workouts", async () => {
      const { data, error } = await client.from("completed_workouts").select("*").order("completed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("favorite_workouts", async () => {
      const { data, error } = await client.from("favorite_workouts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("nutrition_logs", async () => {
      const { data, error } = await client.from("nutrition_logs").select("*, meals(*)").order("log_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("water_logs", async () => {
      const { data, error } = await client.from("water_logs").select("*").order("log_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("body_measurements", async () => {
      const { data, error } = await client.from("body_measurements").select("*").order("measured_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("weight_logs", async () => {
      const { data, error } = await client.from("weight_logs").select("*").order("logged_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("ai_coach_messages", async () => {
      const { data, error } = await client.from("ai_coach_messages").select("*").order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return data || [];
    }, []),
    safeQuery("progress_snapshots", async () => {
      const { data, error } = await client.from("progress_snapshots").select("*").order("snapshot_date", { ascending: true }).limit(14);
      if (error) throw error;
      return data || [];
    }, []),
  ]);

  const profile = profileResult.data;
  const workouts = workoutsResult.data;
  const preferences = preferencesResult.data;
  const favoriteWorkouts = favoritePlatformResult.data.length
    ? favoritePlatformResult.data
    : preferences.filter((item) => item.is_favorite);
  const completedWorkouts = normalizeCompletedWorkouts(
    completedPlatformResult.data.length ? completedPlatformResult.data : completedResult.data,
    legacyWorkoutLogsResult.data,
  );
  const nutrition = nutritionLogsResult.data[0] || nutritionFromPlan(nutritionPlanResult.data);
  const water = waterLogsResult.data[0] || { amount_ml: 0, target_ml: 2500 };
  const weightLogs = weightLogsResult.data.length
    ? weightLogsResult.data
    : progressLogsResult.data.filter((row) => row.weight_kg).map((row) => ({
        id: row.id,
        weight_kg: row.weight_kg,
        logged_at: row.logged_at,
      }));
  const coachMessages = coachMessagesResult.data.length
    ? coachMessagesResult.data
    : buildCoachMessages(profile, workouts, goalsResult.data);

  const warnings = [
    profileResult.warning,
    workoutsResult.warning,
    preferencesResult.warning,
    completedResult.warning,
    exercisesResult.warning,
    fitnessProfilesResult.warning,
    workoutPlansResult.warning,
    sessionsResult.warning,
    completedPlatformResult.warning,
    favoritePlatformResult.warning,
    nutritionLogsResult.warning,
    waterLogsResult.warning,
    measurementsResult.warning,
    weightLogsResult.warning,
    coachMessagesResult.warning,
    snapshotsResult.warning,
  ].filter(Boolean);

  return {
    profile,
    fitnessProfile: fitnessProfilesResult.data[0] || null,
    workouts,
    workoutPlans: workoutPlansResult.data,
    sessions: sessionsResult.data,
    exercises: exercisesResult.data,
    goals: goalsResult.data,
    nutrition,
    water,
    measurements: measurementsResult.data,
    weightLogs,
    progressLogs: progressLogsResult.data,
    snapshots: snapshotsResult.data,
    completedWorkouts,
    favoriteWorkouts,
    coachMessages,
    warnings,
    metrics: {
      caloriesBurned: completedWorkouts.reduce((total, row) => total + Number(row.calories_burned || 0), 0),
      workoutsCompletedThisWeek: countCompletedThisWeek(completedWorkouts),
      streakDays: calculateStreak(completedWorkouts),
      favoriteCount: favoriteWorkouts.length,
    },
  };
}
