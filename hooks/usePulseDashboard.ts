"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { fetchAiEndpoint } from "@/lib/aiFetch";
import { useDashboardActivity, addActivityVolume, addWorkoutVolume, buildTimeline } from "@/hooks/dashboard/useDashboardActivity";
import { useDashboardGoals, mapGoals } from "@/hooks/dashboard/useDashboardGoals";
import { buildNutritionSummary, useDashboardNutrition } from "@/hooks/dashboard/useDashboardNutrition";
import { profileFromRows } from "@/hooks/dashboard/useDashboardProfile";
import {
  asNumber,
  buildCoachSummary,
  buildInsights,
  buildStreak,
  dateKey,
  emptyDashboardState,
  emptyDays,
  mondayStart,
  normalizeGoalText,
  startOfDay,
} from "@/hooks/dashboard/useDashboardStats";
import { buildWeekSchedule, scoreWorkouts, useDashboardWorkouts } from "@/hooks/dashboard/useDashboardWorkouts";
import type {
  DashboardActionState,
  PulseDashboardModel,
  PulseWeeklyReview,
} from "@/hooks/dashboard/types";

export type {
  ActivityLogInput,
  CreateGoalInput,
  DashboardActionState,
  DashboardProfile,
  NutritionLogInput,
  PulseActivity,
  PulseDashboardModel,
  PulseGoal,
  PulseInsight,
  PulseScheduleDay,
  PulseWeeklyReview,
  QuickWorkoutInput,
} from "@/hooks/dashboard/types";

export function usePulseDashboard(userId: string | undefined): PulseDashboardModel {
  const [state, setState] = useState(emptyDashboardState);

  const setAction = useCallback((patch: Partial<DashboardActionState>) => {
    setState((current) => ({
      ...current,
      actions: { ...current.actions, ...patch },
    }));
  }, []);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
      actions: { ...current.actions, error: null },
    }));

    const now = new Date();
    const weekStart = mondayStart(now);
    const trendStart = startOfDay(new Date());
    trendStart.setDate(trendStart.getDate() - 13);

    try {
      const [
        profileRes,
        fitnessRes,
        planRes,
        sessionsRes,
        completedRes,
        activityRes,
        goalsRes,
        workoutsRes,
        nutritionRes,
        waterRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("fitness_profiles").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_workout_plans").select("*").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_workout_sessions").select("id, workout_id, plan_id, title, scheduled_for, status, duration_minutes, calories_burned, created_at").eq("user_id", userId).in("status", ["scheduled", "in_progress", "completed", "skipped"]).order("scheduled_for", { ascending: true, nullsFirst: false }).limit(40),
        supabase.from("completed_workouts").select("*").eq("user_id", userId).gte("completed_at", trendStart.toISOString()).order("completed_at", { ascending: false }).limit(60),
        supabase.from("weight_logs").select("*").eq("user_id", userId).gte("logged_at", trendStart.toISOString()).order("logged_at", { ascending: false }).limit(60),
        supabase.from("goals").select("*").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(12),
        supabase.from("workouts").select("id, title, category, difficulty, duration_minutes, goal_tags, is_public, user_id, source, created_at").or(`is_public.eq.true,user_id.eq.${userId}`).order("created_at", { ascending: false }).limit(30),
        supabase.from("nutrition_logs").select("consumed_calories, target_calories, consumed_protein_g, target_protein_g, log_date").eq("user_id", userId).eq("log_date", dateKey(now)).maybeSingle(),
        supabase.from("water_logs").select("amount_ml, target_ml, log_date").eq("user_id", userId).eq("log_date", dateKey(now)).maybeSingle(),
      ]);

      const warning = [profileRes.error, fitnessRes.error, planRes.error, sessionsRes.error, completedRes.error, activityRes.error, goalsRes.error, workoutsRes.error, nutritionRes.error, waterRes.error]
        .filter(Boolean)
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | ");

      const profile = profileFromRows(profileRes.data, fitnessRes.data);
      const completedRows = (completedRes.data || []) as Record<string, unknown>[];
      const activityRows = (activityRes.data || []) as Record<string, unknown>[];
      const sessionRows = (sessionsRes.data || []) as Record<string, unknown>[];
      const goals = mapGoals((goalsRes.data || []) as Record<string, unknown>[]);
      const recommendedWorkouts = scoreWorkouts((workoutsRes.data || []) as Record<string, unknown>[], profile);

      const completedWeek = completedRows.filter((row) => new Date(String(row.completed_at)).getTime() >= weekStart.getTime());
      const activityWeek = activityRows.filter((row) => new Date(String(row.logged_at)).getTime() >= weekStart.getTime());
      const workoutsWeek = completedWeek.length;
      const caloriesWeek = completedWeek.reduce((total, row) => total + (Number(row.calories_burned) || 0), 0) + activityWeek.reduce((total, row) => total + (Number(row.calories_burned) || 0), 0);
      const minutesWeek = completedWeek.reduce((total, row) => total + (Number(row.duration_minutes) || 0), 0);
      const stepsWeek = activityWeek.reduce((total, row) => total + (Number(row.steps) || 0), 0);
      const workoutTarget = profile.workoutDaysPerWeek;
      const workoutTargetPct = Math.min(100, Math.round((workoutsWeek / workoutTarget) * 100));
      const weekDayIndex = ((now.getDay() + 6) % 7) + 1;
      const expectedWorkoutsByToday = Math.ceil((workoutTarget * weekDayIndex) / 7);
      const missedWorkouts = Math.max(0, expectedWorkoutsByToday - workoutsWeek);
      const avgGoalPct = goals.length ? Math.round(goals.reduce((total, goal) => total + goal.pct, 0) / goals.length) : 0;

      const weekVolume = emptyDays(weekStart, 7);
      addWorkoutVolume(weekVolume, completedRows);
      addActivityVolume(weekVolume, activityRows);

      const monthTrend = emptyDays(trendStart, 14);
      addWorkoutVolume(monthTrend, completedRows);
      addActivityVolume(monthTrend, activityRows);

      const weekSchedule = buildWeekSchedule(sessionRows, weekStart, now, profile.preferredWorkoutDays);
      const nutrition = buildNutritionSummary(nutritionRes.data, waterRes.data);

      const sortedWeights = activityRows
        .filter((row) => asNumber(row.weight_kg) !== null)
        .sort((a, b) => new Date(String(b.logged_at)).getTime() - new Date(String(a.logged_at)).getTime());
      const latestWeightKg = asNumber(sortedWeights[0]?.weight_kg) ?? profile.weightKg;
      const oldestWeightKg = asNumber(sortedWeights[sortedWeights.length - 1]?.weight_kg);
      const weightDeltaKg = latestWeightKg !== null && oldestWeightKg !== null && sortedWeights.length > 1 ? Number((latestWeightKg - oldestWeightKg).toFixed(1)) : null;

      const nextSession = sessionRows.find((row) => {
        if (String(row.status) === "completed" || String(row.status) === "skipped") return false;
        if (!row.scheduled_for) return true;
        return new Date(String(row.scheduled_for)).getTime() >= startOfDay(now).getTime();
      });
      const primaryWorkout = recommendedWorkouts[0] ?? null;
      const nextWorkoutTitle = nextSession?.title ? String(nextSession.title) : primaryWorkout?.title ?? null;
      const nextWorkoutHref = nextSession?.workout_id ? `/workout/session?workout=${nextSession.workout_id}&session=${nextSession.id}` : primaryWorkout?.workoutId ? `/workout/session?workout=${primaryWorkout.workoutId}` : null;
      const nextWorkoutSubtitle = nextSession?.scheduled_for ? `Scheduled ${new Date(String(nextSession.scheduled_for)).toLocaleDateString()}` : primaryWorkout?.reason ?? null;
      const estMinutes = nextSession?.duration_minutes != null ? Number(nextSession.duration_minutes) : primaryWorkout?.minutes ?? null;
      const activePlanTitle = planRes.data?.title ? String(planRes.data.title) : null;
      const activePlanDescription = planRes.data?.description ? String(planRes.data.description) : null;
      const streakDays = buildStreak(completedRows);
      const recentActivity = buildTimeline({ completed: completedRows, activity: activityRows, goals, planTitle: activePlanTitle, planCreatedAt: planRes.data?.created_at ? String(planRes.data.created_at) : null });
      const insights = buildInsights({ profile, workoutsWeek, workoutTarget, missedWorkouts, streakDays, stepsWeek, goals, activePlanTitle, recentActivityCount: recentActivity.length, weightDeltaKg });
      const coachSummary = buildCoachSummary({ activePlanTitle, workoutsWeek, workoutTarget, missedWorkouts, streakDays, stepsWeek, latestWeightKg, weightDeltaKg });

      setState((current) => ({
        ...current,
        loading: false,
        error: warning || null,
        profile,
        workoutsWeek,
        caloriesWeek,
        minutesWeek,
        stepsWeek,
        streakDays,
        workoutTargetPct,
        goalProgressPct: avgGoalPct,
        latestWeightKg,
        weightDeltaKg,
        activePlanTitle,
        activePlanDescription,
        nextWorkoutTitle,
        nextWorkoutSubtitle,
        nextWorkoutHref,
        todayFocusTag: normalizeGoalText(profile.goal),
        estMinutes,
        coachHeadline: coachSummary.headline,
        coachBullets: coachSummary.bullets,
        weekSchedule,
        weekVolume,
        monthTrend,
        nutrition,
        recentActivity,
        recommendedWorkouts,
        goals,
        insights,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Could not load dashboard.",
      }));
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { logActivity } = useDashboardActivity({ userId, load, setAction });
  const { createGoal, updateGoalProgress } = useDashboardGoals({ userId, load, setAction });
  const { logNutritionIntake, addWaterIntake } = useDashboardNutrition({ userId, load, setAction });
  const { logWorkout, updateWorkoutDays, skipSession, generateAiPlan } = useDashboardWorkouts({
    userId,
    load,
    setAction,
    profile: state.profile,
  });

  const refresh = useCallback(() => void load(), [load]);

  const refreshWeeklyReview = useCallback(async () => {
    if (!userId) return;
    setAction({ reviewingCoach: true, error: null, notice: null });
    try {
      const response = await fetchAiEndpoint("/api/coach/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as { review?: PulseWeeklyReview; error?: string };
      if (!response.ok || !data.review) throw new Error(data.error || "Could not create weekly AI review.");
      setState((current) => ({ ...current, weeklyReview: data.review ?? null }));
      setAction({ notice: "Weekly AI coach review updated." });
    } catch (error) {
      setAction({ error: error instanceof Error ? error.message : "Could not create weekly AI review." });
    } finally {
      setAction({ reviewingCoach: false });
    }
  }, [setAction, userId]);

  return {
    ...state,
    refresh,
    refreshWeeklyReview,
    logWorkout,
    logActivity,
    logNutritionIntake,
    addWaterIntake,
    createGoal,
    updateGoalProgress,
    updateWorkoutDays,
    skipSession,
    generateAiPlan,
  };
}
