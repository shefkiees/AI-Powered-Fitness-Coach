"use client";

import { useCallback } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type {
  DashboardActionState,
  DashboardProfile,
  PulseDayVolume,
  PulseScheduleDay,
  PulseWorkoutSuggestion,
  QuickWorkoutInput,
} from "@/hooks/dashboard/types";
import { dateKey, normalizeGoalText, shortDateLabel, weekdayKey, WEEKDAY } from "@/hooks/dashboard/useDashboardStats";

function scheduleStatusRank(status: string) {
  if (status === "in_progress") return 0;
  if (status === "scheduled") return 1;
  if (status === "completed") return 2;
  if (status === "skipped") return 3;
  return 4;
}

function emptyDays(start: Date, count: number): PulseDayVolume[] {
  return Array.from({ length: count }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      label: count <= 7 ? WEEKDAY[index % 7] : `${day.getMonth() + 1}/${day.getDate()}`,
      dateKey: dateKey(day),
      count: 0,
      calories: 0,
      steps: 0,
      minutes: 0,
    };
  });
}

export function buildWeekSchedule(rows: Record<string, unknown>[], start: Date, now: Date, preferredWorkoutDays: string[] = []): PulseScheduleDay[] {
  const today = dateKey(now);
  const days = emptyDays(start, 7);
  const preferred = new Set(preferredWorkoutDays.map(weekdayKey).filter(Boolean));

  return days.map((dayVolume, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const sessions = rows
      .filter((row) => row.scheduled_for && dateKey(new Date(String(row.scheduled_for))) === dayVolume.dateKey)
      .sort((a, b) => scheduleStatusRank(String(a.status || "")) - scheduleStatusRank(String(b.status || "")));
    const session = sessions[0] ?? null;
    const workoutId = session?.workout_id != null ? String(session.workout_id) : null;
    const sessionId = session?.id != null ? String(session.id) : null;
    const href = workoutId ? `/workout/session?workout=${workoutId}${sessionId ? `&session=${sessionId}` : ""}` : null;
    const isPreferredWorkoutDay = !session && preferred.has(weekdayKey(dayVolume.label));

    return {
      label: dayVolume.label,
      dateKey: dayVolume.dateKey,
      dateLabel: shortDateLabel(day),
      isToday: dayVolume.dateKey === today,
      title: session?.title ? String(session.title) : isPreferredWorkoutDay ? "Workout day" : null,
      status: session?.status ? String(session.status) : isPreferredWorkoutDay ? "preferred" : "rest",
      sessionId,
      workoutId,
      href,
      minutes: session?.duration_minutes != null ? Number(session.duration_minutes) : null,
    };
  });
}

export function scoreWorkouts(rows: Record<string, unknown>[], profile: DashboardProfile | null): PulseWorkoutSuggestion[] {
  const goal = profile?.goal || "";
  const level = profile?.fitnessLevel || "";

  return rows
    .map((workout) => {
      const tags = Array.isArray(workout.goal_tags) ? workout.goal_tags.map(String) : [];
      const source = String(workout.source || "");
      const difficulty = String(workout.difficulty || "");
      const category = workout.category != null ? String(workout.category) : null;
      const goalMatch = goal ? tags.includes(goal) || category?.toLowerCase().includes(goal.replace(/_/g, " ")) : false;
      const levelMatch = level ? difficulty.toLowerCase() === level.toLowerCase() : false;
      const isAiGenerated = source === "ai_generated";
      const score = (isAiGenerated ? 4 : 0) + (goalMatch ? 3 : 0) + (levelMatch ? 2 : 0) + (workout.is_public ? 0 : 1);
      return {
        workout,
        score,
        reason: isAiGenerated
          ? "Generated for your profile"
          : goalMatch
            ? `Matches ${normalizeGoalText(goal)}`
            : levelMatch
              ? `Fits ${level} level`
              : "Good general option",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ workout, reason }) => ({
      id: String(workout.id),
      workoutId: String(workout.id),
      title: String(workout.title || "Workout"),
      category: workout.category != null ? String(workout.category) : null,
      difficulty: workout.difficulty != null ? String(workout.difficulty) : null,
      minutes: workout.duration_minutes != null ? Number(workout.duration_minutes) : null,
      reason,
      isAiGenerated: String(workout.source || "") === "ai_generated",
    }));
}

export function useDashboardWorkouts({
  userId,
  load,
  setAction,
  profile,
}: {
  userId: string | undefined;
  load: () => Promise<void>;
  setAction: (patch: Partial<DashboardActionState>) => void;
  profile: DashboardProfile | null;
}) {
  const logWorkout = useCallback(
    async (input: QuickWorkoutInput) => {
      if (!supabase || !userId) return;
      setAction({ savingWorkout: true, error: null, notice: null });
      try {
        const { error } = await supabase.from("completed_workouts").insert({
          user_id: userId,
          workout_title: input.title.trim() || "Workout",
          duration_minutes: Math.max(1, Math.round(input.durationMinutes || 0)),
          calories_burned: Math.max(0, Math.round(input.caloriesBurned || 0)),
          rating: input.rating || null,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
        setAction({ notice: "Workout logged successfully." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not log workout." });
      } finally {
        setAction({ savingWorkout: false });
      }
    },
    [load, setAction, userId],
  );

  const updateWorkoutDays = useCallback(
    async (days: string[]) => {
      if (!supabase || !userId) return;
      const cleanDays = WEEKDAY.filter((day) => days.map(weekdayKey).includes(weekdayKey(day)));
      if (!cleanDays.length) {
        setAction({ error: "Choose at least one workout day." });
        return;
      }

      setAction({ savingWorkoutDays: true, error: null, notice: null });
      try {
        const profileUpdate = await supabase.from("profiles").update({ preferred_workout_days: cleanDays, workout_days_per_week: cleanDays.length }).eq("id", userId);
        if (profileUpdate.error) throw profileUpdate.error;

        const { data: fitnessProfile } = await supabase.from("fitness_profiles").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

        if (fitnessProfile?.id) {
          const fitnessUpdate = await supabase.from("fitness_profiles").update({ preferred_workout_days: cleanDays, weekly_workout_target: cleanDays.length }).eq("id", fitnessProfile.id).eq("user_id", userId);
          if (fitnessUpdate.error) throw fitnessUpdate.error;
        }

        setAction({ notice: "Workout days saved. Generate a plan when you are ready." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save workout days." });
      } finally {
        setAction({ savingWorkoutDays: false });
      }
    },
    [load, setAction, userId],
  );

  const skipSession = useCallback(
    async (sessionId: string) => {
      if (!supabase || !userId || !sessionId) return;
      setAction({ skippingSessionId: sessionId, error: null, notice: null });
      try {
        const { error } = await supabase.from("user_workout_sessions").update({ status: "skipped" }).eq("id", sessionId).eq("user_id", userId);
        if (error) throw error;
        setAction({ notice: "Workout skipped. Your week was updated." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not skip workout." });
      } finally {
        setAction({ skippingSessionId: null });
      }
    },
    [load, setAction, userId],
  );

  const generateAiPlan = useCallback(async () => {
    setAction({ generatingPlan: true, error: null, notice: null });
    try {
      const response = await fetch("/api/workout-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profile || {} }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; warnings?: string[] };
      if (!response.ok) throw new Error(data.error || "Could not generate AI plan.");
      const warning = data.warnings?.length ? ` Warnings: ${data.warnings.join(" ")}` : "";
      setAction({ notice: `AI plan generated and saved.${warning}` });
      await load();
    } catch (error) {
      setAction({ error: error instanceof Error ? error.message : "Could not generate AI plan." });
    } finally {
      setAction({ generatingPlan: false });
    }
  }, [load, profile, setAction]);

  return { logWorkout, updateWorkoutDays, skipSession, generateAiPlan };
}
