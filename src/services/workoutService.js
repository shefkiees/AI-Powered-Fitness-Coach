import { refreshProgressSnapshot } from "@/src/services/progressService";
import {
  emptyUuid,
  estimateCalories,
  isMissingColumnError,
  isMissingRelationError,
  nullableNumber,
  requireSupabase,
  textFromError,
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

async function currentUserId(client) {
  try {
    const { data } = await client.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

function poseFeedbackSchemaFallbackNeeded(error) {
  if (isMissingColumnError(error)) return true;
  const message = textFromError(error).toLowerCase();
  return (
    message.includes("pose_session_id") ||
    message.includes("cue") ||
    message.includes("exercise_name") ||
    message.includes("severity")
  );
}

function normalizePoseHistoryRow(row, feedback = []) {
  const completedAt = row.completed_at || row.ended_at || row.created_at || null;
  const endedAt = row.ended_at || completedAt;
  const startedAt = row.started_at || completedAt;
  const deviceInfo = row.device_info && typeof row.device_info === "object" ? row.device_info : {};
  const exerciseTotals =
    row.exercise_totals && typeof row.exercise_totals === "object"
      ? row.exercise_totals
      : deviceInfo.exercise_totals && typeof deviceInfo.exercise_totals === "object"
        ? deviceInfo.exercise_totals
        : null;
  const totalRepsFromExercises = exerciseTotals
    ? Object.values(exerciseTotals).reduce((sum, total) => sum + Number(total?.reps || 0), 0)
    : 0;
  const durationSeconds =
    Number(row.duration_seconds || deviceInfo.duration_seconds || 0) ||
    (startedAt && endedAt
      ? Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000))
      : 0);
  const formScore = Number(row.average_form_score ?? row.form_score ?? row.score ?? row.avg_form_score ?? 0);
  const exerciseType = row.exercise_type || row.exercise_key || "general";
  const exerciseName = row.exercise_name || deviceInfo.exercise_name || String(exerciseType).replace(/_/g, " ") || "Movement check";
  const summary =
    row.ai_coach_summary ||
    row.feedback_summary ||
    row.summary ||
    deviceInfo.ai_coach_summary ||
    deviceInfo.feedback_summary ||
    feedback[0]?.cue ||
    feedback[0]?.message ||
    "";
  const detectedIssues =
    Array.isArray(row.detected_issues)
      ? row.detected_issues
      : Array.isArray(deviceInfo.detected_issues)
        ? deviceInfo.detected_issues
        : [];

  return {
    ...row,
    exercise_name: exerciseName,
    exercise_type: exerciseType,
    completed_at: completedAt,
    ended_at: endedAt,
    duration_seconds: durationSeconds,
    reps: Number(row.reps ?? row.total_reps ?? totalRepsFromExercises ?? 0),
    score: formScore,
    form_score: formScore,
    average_form_score: formScore,
    summary,
    feedback_summary: summary,
    ai_coach_summary: row.ai_coach_summary || deviceInfo.ai_coach_summary || "",
    exercise_totals: exerciseTotals,
    detected_issues: detectedIssues,
    pose_feedback: feedback,
  };
}

export async function savePoseSession(values = {}) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const completedAt = values.completed_at || new Date().toISOString();
  const endedAt = values.ended_at || completedAt;
  const startedAt = values.started_at || completedAt;
  const score = Number(values.form_score ?? values.score ?? 0);
  const summary = values.feedback_summary || values.summary || values.ai_coach_summary || "Pose session saved.";
  const ownedPayload = userId ? { user_id: userId } : {};
  const basePayload = {
    ...ownedPayload,
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
  const aiGymPayload = {
    ...poseLabPayload,
    ended_at: endedAt,
    average_form_score: score,
    exercise_totals: values.exercise_totals || {},
    detected_issues: values.detected_issues || [],
    ai_coach_summary: values.ai_coach_summary || summary,
  };
  const legacyPayload = {
    ...ownedPayload,
    exercise_key: values.exercise_type || values.movement || "general",
    started_at: startedAt,
    ended_at: endedAt,
    total_reps: Number(values.reps || 0),
    avg_form_score: score,
    device_info: {
      exercise_name: values.exercise_name || "Movement check",
      duration_seconds: Number(values.duration_seconds || 0),
      feedback_summary: summary,
      ai_coach_summary: values.ai_coach_summary || summary,
      exercise_totals: values.exercise_totals || {},
      detected_issues: values.detected_issues || [],
    },
  };

  let insertResult = await client.from("pose_sessions").insert(aiGymPayload).select().single();
  if (insertResult.error && isMissingColumnError(insertResult.error)) {
    insertResult = await client.from("pose_sessions").insert(poseLabPayload).select().single();
  }
  if (insertResult.error && isMissingColumnError(insertResult.error)) {
    insertResult = await client.from("pose_sessions").insert(legacyPayload).select().single();
  }

  const { data: session, error } = insertResult;
  if (error) throw error;

  const cues = Array.isArray(values.cues) ? values.cues : [];
  if (cues.length) {
    const modernRows = cues.map((cue, index) => ({
      ...ownedPayload,
      pose_session_id: session.id,
      exercise_name: values.exercise_name || "Movement check",
      rep_index: index + 1,
      score,
      cue: String(cue),
      severity: String(cue).toLowerCase().includes("good") ? "positive" : "info",
    }));
    const feedbackResult = await client.from("pose_feedback").insert(modernRows);

    if (feedbackResult.error && poseFeedbackSchemaFallbackNeeded(feedbackResult.error)) {
      await client.from("pose_feedback").insert(
        cues.map((cue, index) => ({
          ...ownedPayload,
          session_id: session.id,
          message: String(cue),
          severity: String(cue).toLowerCase().includes("good") ? "success" : "info",
          rep_index: index + 1,
          form_score: score,
          metadata: { exercise_name: values.exercise_name || "Movement check" },
        })),
      );
    }
  }

  return session;
}

export async function getPoseHistory() {
  const client = requireSupabase();
  const { data: sessions, error } = await client.from("pose_sessions").select("*").order("created_at", { ascending: false }).limit(10);
  if (error) throw error;
  const rows = sessions || [];
  const ids = rows.map((row) => row.id).filter(Boolean);
  if (!ids.length) return [];

  let feedbackBySession = new Map();
  let feedbackResult = await client.from("pose_feedback").select("*").in("pose_session_id", ids).order("created_at", { ascending: true });

  if (feedbackResult.error && poseFeedbackSchemaFallbackNeeded(feedbackResult.error)) {
    feedbackResult = await client.from("pose_feedback").select("*").in("session_id", ids).order("created_at", { ascending: true });
  }

  if (!feedbackResult.error) {
    feedbackBySession = (feedbackResult.data || []).reduce((map, row) => {
      const sessionId = row.pose_session_id || row.session_id;
      if (!sessionId) return map;
      const next = {
        ...row,
        pose_session_id: sessionId,
        cue: row.cue || row.message || "",
        score: row.score ?? row.form_score ?? null,
      };
      map.set(sessionId, [...(map.get(sessionId) || []), next]);
      return map;
    }, new Map());
  }

  return rows.map((row) => normalizePoseHistoryRow(row, feedbackBySession.get(row.id) || []));
}

export { emptyUuid };
