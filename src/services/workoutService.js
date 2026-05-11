import { refreshProgressSnapshot } from "@/src/services/progressService";
import {
  emptyUuid,
  estimateCalories,
  isMissingColumnError,
  isMissingRelationError,
  nullableNumber,
  requireSupabase,
  workoutSchemaError,
} from "@/src/services/serviceShared";
import {
  exerciseLibraryFallback,
  extendWorkoutLibrary,
  fallbackExercisesForWorkout,
  localWorkoutById,
  normalizeWorkoutLibraryRow,
  normalizeWorkoutPreferenceRow,
  withWorkoutSteps,
} from "@/src/services/exerciseMediaService";

function normalizeWorkoutPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description?.trim?.() || "",
    day_of_week: values.day_of_week?.trim?.() || null,
    difficulty: values.difficulty || "Beginner",
    duration_minutes: values.duration_minutes === "" ? null : Number(values.duration_minutes),
  };
}

function normalizeExercisePayload(workoutId, values) {
  return {
    workout_id: workoutId,
    name: values.name.trim(),
    sets: values.sets === "" ? null : Number(values.sets),
    reps: values.reps?.trim?.() || null,
    weight_kg: values.weight_kg === "" ? null : Number(values.weight_kg),
    rest_seconds: values.rest_seconds === "" ? null : Number(values.rest_seconds),
    notes: values.notes?.trim?.() || "",
    order_index: values.order_index === "" ? null : Number(values.order_index),
  };
}

function normalizeWorkoutLogPayload(workout, values = {}) {
  return {
    workout_id: workout?.is_local_catalog ? null : workout?.id || values.workout_id || null,
    session_id: values.session_id || null,
    workout_title: (workout?.title || values.workout_title || "Workout").trim(),
    duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
    calories_burned: nullableNumber(values.calories_burned) || estimateCalories(workout?.duration_minutes ?? values.duration_minutes, values.intensity),
    rating: nullableNumber(values.rating),
    notes: values.notes?.trim?.() || "",
    completed_at: values.completed_at || undefined,
  };
}

export async function getWorkoutPlan() {
  const client = requireSupabase();
  const { data, error } = await client.from("user_workout_plans").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1);
  if (error) throw error;
  return data || [];
}

export async function getWorkoutLibrary() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workouts")
    .select(`*, workout_exercises(*, exercises(*))`)
    .order("is_public", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw workoutSchemaError(error);
  return extendWorkoutLibrary((data || []).map(normalizeWorkoutLibraryRow));
}

export async function getUserWorkoutPreferences() {
  const client = requireSupabase();
  const { data, error } = await client.from("favorite_workouts").select("*").order("created_at", { ascending: false });
  if (error) throw workoutSchemaError(error);
  return (data || []).map(normalizeWorkoutPreferenceRow);
}

export async function saveWorkoutPreference(workoutId, values) {
  const client = requireSupabase();
  const existing = await client.from("favorite_workouts").select("*").eq("workout_id", workoutId).maybeSingle();
  if (existing.error) throw workoutSchemaError(existing.error);

  const payload = { workout_id: workoutId, notes: values.notes || "" };
  if (!values.is_favorite && existing.data?.id) {
    const { error } = await client.from("favorite_workouts").delete().eq("id", existing.data.id);
    if (error) throw workoutSchemaError(error);
    return { ...existing.data, is_favorite: false };
  }

  const query = existing.data?.id
    ? client.from("favorite_workouts").update(payload).eq("id", existing.data.id)
    : client.from("favorite_workouts").insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw workoutSchemaError(error);
  return normalizeWorkoutPreferenceRow(data);
}

export async function getUserCompletedWorkouts() {
  const client = requireSupabase();
  const { data, error } = await client.from("completed_workouts").select("*").order("completed_at", { ascending: false });
  if (error) throw workoutSchemaError(error);
  return data || [];
}

export async function completeLibraryWorkout(workout, values = {}) {
  const client = requireSupabase();
  const payload = {
    workout_id: workout?.id || values.workout_id || null,
    session_id: values.session_id || null,
    workout_title: (workout?.title || values.workout_title || "Workout").trim(),
    duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
    calories_burned: nullableNumber(values.calories_burned) || estimateCalories(workout?.duration_minutes ?? values.duration_minutes, values.intensity),
    rating: nullableNumber(values.rating),
    notes: values.notes?.trim?.() || "",
    completed_at: values.completed_at || new Date().toISOString(),
  };
  const { data, error } = await client.from("completed_workouts").insert(payload).select().single();
  if (error) throw workoutSchemaError(error);
  await refreshProgressSnapshot();
  return data;
}

export async function loadWorkoutModuleData() {
  const [workouts, preferences, completedWorkouts] = await Promise.all([
    getWorkoutLibrary(),
    getUserWorkoutPreferences(),
    getUserCompletedWorkouts(),
  ]);
  return { workouts, preferences, completedWorkouts };
}

export async function createWorkout(values) {
  const client = requireSupabase();
  const { data, error } = await client.from("workouts").insert(normalizeWorkoutPayload(values)).select("*, exercises(*)").single();
  if (error) throw error;
  return data;
}

export async function deleteWorkout(workoutId) {
  const client = requireSupabase();
  const { error } = await client.from("workouts").delete().eq("id", workoutId);
  if (error) throw error;
}

export async function addExerciseToWorkout(workoutId, values) {
  const client = requireSupabase();
  const { data, error } = await client.from("exercises").insert(normalizeExercisePayload(workoutId, values)).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(exerciseId) {
  const client = requireSupabase();
  const { error } = await client.from("exercises").delete().eq("id", exerciseId);
  if (error) throw error;
}

export async function createWorkoutPlan(_userId, profile) {
  const response = await fetch("/api/workout-plan/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Could not generate workout plan.");
  return data.sessions || [];
}

export async function getWorkoutLogs() {
  const client = requireSupabase();
  const { data, error } = await client.from("completed_workouts").select("*").order("completed_at", { ascending: false });
  if (error) {
    if (isMissingRelationError(error, "completed_workouts")) return [];
    throw error;
  }
  return data || [];
}

export async function completeWorkout(_userId, workout, values = {}) {
  const client = requireSupabase();
  const { data, error } = await client.from("completed_workouts").insert(normalizeWorkoutLogPayload(workout, values)).select().single();
  if (error) throw error;
  if (values.session_id) {
    await client
      .from("user_workout_sessions")
      .update({
        status: "completed",
        completed_at: data.completed_at,
        duration_minutes: data.duration_minutes,
        calories_burned: data.calories_burned,
      })
      .eq("id", values.session_id);
  }
  await refreshProgressSnapshot();
  return data;
}

export async function getExerciseLibrary() {
  const client = requireSupabase();
  const { data, error } = await client.from("exercises").select("*").eq("is_public", true).order("name", { ascending: true });
  if (error) {
    if (isMissingRelationError(error, "exercises")) return exerciseLibraryFallback;
    throw error;
  }
  return data || [];
}

export async function getWorkoutById(workoutId) {
  const localWorkout = localWorkoutById(workoutId);
  if (localWorkout) return localWorkout;

  const client = requireSupabase();
  const { data, error } = await client.from("workouts").select(`*, workout_exercises(*, exercises(*))`).eq("id", workoutId).maybeSingle();
  if (error) throw workoutSchemaError(error);
  if (!data) return null;

  const normalized = normalizeWorkoutLibraryRow(data);
  if (normalized.exercises?.length) return normalized;

  const { data: directExercises, error: directError } = await client.from("exercises").select("*").eq("workout_id", workoutId).order("order_index", { ascending: true });
  if (directError && !isMissingRelationError(directError, "exercises")) throw directError;

  const exercises = directExercises?.length ? directExercises : fallbackExercisesForWorkout(normalized);
  return withWorkoutSteps(normalized, exercises);
}

export async function getUpcomingWorkoutSessions() {
  const client = requireSupabase();
  const { data, error } = await client.from("user_workout_sessions").select("*, workouts(*)").in("status", ["scheduled", "in_progress"]).order("scheduled_for", { ascending: true, nullsFirst: false }).limit(12);
  if (error) throw error;
  return data || [];
}

export async function startWorkoutSession(workout, values = {}) {
  if (workout?.is_local_catalog) {
    return {
      id: null,
      workout_id: null,
      title: workout?.title || values.title || "Workout session",
      started_at: new Date().toISOString(),
      status: "in_progress",
      duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
      session_data: { workout, completedSets: [], skippedExercises: [] },
      is_local_session: true,
    };
  }

  const client = requireSupabase();
  const payload = {
    workout_id: workout?.id || values.workout_id || null,
    plan_id: values.plan_id || null,
    title: workout?.title || values.title || "Workout session",
    scheduled_for: values.scheduled_for || null,
    started_at: new Date().toISOString(),
    status: "in_progress",
    duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
    calories_burned: null,
    notes: "",
    session_data: { workout, completedSets: [], skippedExercises: [] },
  };
  const { data, error } = await client.from("user_workout_sessions").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function savePoseSession(values = {}) {
  const client = requireSupabase();
  const completedAt = values.completed_at || new Date().toISOString();
  const startedAt = values.started_at || completedAt;
  const score = Number(values.form_score ?? values.score ?? 0);
  const summary = values.feedback_summary || values.summary || "Pose session saved.";
  const basePayload = {
    exercise_name: values.exercise_name || "Movement check",
    started_at: startedAt,
    completed_at: completedAt,
    reps: Number(values.reps || 0),
    score,
    summary,
  };
  const poseLabPayload = {
    ...basePayload,
    exercise_type: values.exercise_type || values.movement || "general",
    duration_seconds: Number(values.duration_seconds || 0),
    form_score: score,
    feedback_summary: summary,
  };

  let insertResult = await client.from("pose_sessions").insert(poseLabPayload).select().single();
  if (insertResult.error && isMissingColumnError(insertResult.error)) {
    insertResult = await client.from("pose_sessions").insert(basePayload).select().single();
  }

  const { data: session, error } = insertResult;
  if (error) throw error;

  const cues = Array.isArray(values.cues) ? values.cues : [];
  if (cues.length) {
    await client.from("pose_feedback").insert(
      cues.map((cue, index) => ({
        pose_session_id: session.id,
        exercise_name: values.exercise_name || "Movement check",
        rep_index: index + 1,
        score: Number(values.score || 0),
        cue: String(cue),
        severity: String(cue).toLowerCase().includes("great") ? "positive" : "info",
      })),
    );
  }

  return session;
}

export async function getPoseHistory() {
  const client = requireSupabase();
  const { data, error } = await client.from("pose_sessions").select("*, pose_feedback(*)").order("completed_at", { ascending: false }).limit(10);
  if (error) throw error;
  return data || [];
}

export { emptyUuid };
