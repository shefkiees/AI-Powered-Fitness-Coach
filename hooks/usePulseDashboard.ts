"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export type PulseGoal = {
  id: string;
  title: string;
  pct: number;
  unit: string | null;
};

export type PulseActivity = {
  id: string;
  title: string;
  at: string;
  minutes: number | null;
  calories: number | null;
};

export type PulseWorkoutSuggestion = {
  id: string;
  title: string;
  category: string | null;
  difficulty: string | null;
  minutes: number | null;
  workoutId: string;
};

export type PulseDayVolume = {
  label: string;
  dateKey: string;
  count: number;
  calories: number;
};

export type PulseDashboardModel = {
  loading: boolean;
  error: string | null;
  streakDays: number;
  caloriesWeek: number;
  workoutsWeek: number;
  goalProgressPct: number;
  todayPlanTitle: string | null;
  todayPlanSubtitle: string | null;
  todayWorkoutHref: string | null;
  activePlanTitle: string | null;
  todayFocusTag: string;
  estMinutes: number | null;
  coachHeadline: string;
  coachBullets: string[];
  weekVolume: PulseDayVolume[];
  lastWorkout: PulseActivity | null;
  recentActivity: PulseActivity[];
  recommendedWorkouts: PulseWorkoutSuggestion[];
  goals: PulseGoal[];
  weekStrip: { day: string; label: string; done: boolean }[];
  refresh: () => void;
};

const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function mondayStart(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildWeekVolume(rows: { completed_at: string; calories_burned?: number | null }[]): PulseDayVolume[] {
  const start = mondayStart(new Date());
  const days: PulseDayVolume[] = WEEKDAY.map((label, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return {
      label,
      dateKey: dateKey(d),
      count: 0,
      calories: 0,
    };
  });

  for (const row of rows) {
    const key = row.completed_at?.slice(0, 10);
    const slot = days.find((day) => day.dateKey === key);
    if (!slot) continue;
    slot.count += 1;
    slot.calories += Number(row.calories_burned) || 0;
  }

  return days;
}

function buildStreak(rows: { completed_at: string }[]) {
  const completedDays = new Set(rows.map((row) => row.completed_at?.slice(0, 10)).filter(Boolean));
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < 365; index += 1) {
    const key = dateKey(cursor);
    if (!completedDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function coachCopy(input: {
  streak: number;
  workoutsWeek: number;
  goalPct: number;
  planTitle: string | null;
}) {
  const bullets: string[] = [];

  if (input.workoutsWeek === 0) {
    bullets.push("Start with one logged workout this week so the dashboard can track real progress.");
  } else if (input.workoutsWeek < 3) {
    bullets.push("You have logged activity this week. Add one more short session to build rhythm.");
  } else {
    bullets.push("Strong training volume this week. Keep one easier session for recovery.");
  }

  if (input.streak > 0) {
    bullets.push(`${input.streak}-day workout streak from your completed sessions.`);
  }

  if (input.goalPct > 0) {
    bullets.push(`Your active goal progress is ${input.goalPct}%.`);
  }

  return {
    headline: input.planTitle ? `Active plan: ${input.planTitle}` : "Your coach feed is based on your saved data.",
    bullets: bullets.slice(0, 3),
  };
}

function emptyState(): Omit<PulseDashboardModel, "refresh"> {
  return {
    loading: true,
    error: null,
    streakDays: 0,
    caloriesWeek: 0,
    workoutsWeek: 0,
    goalProgressPct: 0,
    todayPlanTitle: null,
    todayPlanSubtitle: null,
    todayWorkoutHref: null,
    activePlanTitle: null,
    todayFocusTag: "Profile",
    estMinutes: null,
    coachHeadline: "",
    coachBullets: [],
    weekVolume: WEEKDAY.map((label) => ({ label, dateKey: "", count: 0, calories: 0 })),
    lastWorkout: null,
    recentActivity: [],
    recommendedWorkouts: [],
    goals: [],
    weekStrip: WEEKDAY.map((day) => ({ day, label: "-", done: false })),
  };
}

export function usePulseDashboard(userId: string | undefined): PulseDashboardModel {
  const [state, setState] = useState<Omit<PulseDashboardModel, "refresh">>(emptyState);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    const weekStart = mondayStart(new Date()).toISOString();
    const chartStart = new Date();
    chartStart.setDate(chartStart.getDate() - 13);
    chartStart.setHours(0, 0, 0, 0);

    try {
      const [
        snapshotRes,
        completedWeekRes,
        completedChartRes,
        recentRes,
        planRes,
        sessionsRes,
        profileRes,
        goalsRes,
        workoutsRes,
      ] = await Promise.all([
        supabase
          .from("progress_snapshots")
          .select("streak_days, goal_progress_percent, summary")
          .eq("user_id", userId)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("completed_workouts")
          .select("id, workout_title, completed_at, duration_minutes, calories_burned")
          .eq("user_id", userId)
          .gte("completed_at", weekStart)
          .order("completed_at", { ascending: false }),
        supabase
          .from("completed_workouts")
          .select("completed_at, calories_burned")
          .eq("user_id", userId)
          .gte("completed_at", chartStart.toISOString())
          .order("completed_at", { ascending: true }),
        supabase
          .from("completed_workouts")
          .select("id, workout_title, completed_at, duration_minutes, calories_burned")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(8),
        supabase
          .from("user_workout_plans")
          .select("title, status, description")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_workout_sessions")
          .select("id, workout_id, title, scheduled_for, status, duration_minutes")
          .eq("user_id", userId)
          .order("scheduled_for", { ascending: true, nullsFirst: false })
          .limit(21),
        supabase.from("profiles").select("goal, fitness_level").eq("id", userId).maybeSingle(),
        supabase
          .from("goals")
          .select("id, title, target_value, current_value, unit, status")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("workouts")
          .select("id, title, category, difficulty, duration_minutes, goal_tags, is_public, user_id, created_at")
          .or(`is_public.eq.true,user_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      const completedWeek = completedWeekRes.data ?? [];
      const recentRows = recentRes.data ?? [];
      const profileGoal = profileRes.data?.goal != null ? String(profileRes.data.goal) : "";
      const profileLevel = profileRes.data?.fitness_level != null ? String(profileRes.data.fitness_level) : "";

      const goalRows: PulseGoal[] =
        goalsRes.data?.map((goal) => {
          const target = Number(goal.target_value) || 0;
          const current = Number(goal.current_value) || 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          return {
            id: String(goal.id),
            title: String(goal.title),
            pct,
            unit: goal.unit != null ? String(goal.unit) : null,
          };
        }) ?? [];

      const recommendedWorkouts: PulseWorkoutSuggestion[] = (workoutsRes.data ?? [])
        .map((workout) => {
          const tags = Array.isArray(workout.goal_tags) ? workout.goal_tags.map(String) : [];
          const goalMatch = profileGoal ? tags.includes(profileGoal) : false;
          const levelMatch =
            profileLevel && String(workout.difficulty || "").toLowerCase() === profileLevel.toLowerCase();
          return {
            workout,
            score: (goalMatch ? 3 : 0) + (levelMatch ? 2 : 0) + (workout.is_public ? 0 : 1),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ workout }) => ({
          id: String(workout.id),
          workoutId: String(workout.id),
          title: String(workout.title || "Workout"),
          category: workout.category != null ? String(workout.category) : null,
          difficulty: workout.difficulty != null ? String(workout.difficulty) : null,
          minutes: workout.duration_minutes != null ? Number(workout.duration_minutes) : null,
        }));

      const todayIndex = (new Date().getDay() + 6) % 7;
      const todaySession =
        sessionsRes.data?.find((row) => {
          if (!row.scheduled_for) return false;
          return (new Date(row.scheduled_for).getDay() + 6) % 7 === todayIndex;
        }) ?? null;
      const primaryWorkout = recommendedWorkouts[0] ?? null;
      const planTitle = planRes.data?.title ?? null;
      const todayTitle = todaySession?.title ?? primaryWorkout?.title ?? planTitle ?? null;
      const todayHref = todaySession?.workout_id
        ? `/workout/session?workout=${todaySession.workout_id}&session=${todaySession.id}`
        : primaryWorkout?.workoutId
          ? `/workout/session?workout=${primaryWorkout.workoutId}`
          : null;

      const weekStrip = WEEKDAY.map((day, index) => {
        const match = sessionsRes.data?.find((row) => {
          if (!row.scheduled_for) return false;
          return (new Date(row.scheduled_for).getDay() + 6) % 7 === index;
        });
        return {
          day,
          label: match?.title?.slice(0, 14) || "-",
          done: match?.status === "completed",
        };
      });

      const mappedRecent: PulseActivity[] = recentRows.map((row) => ({
        id: String(row.id),
        title: String(row.workout_title),
        at: String(row.completed_at),
        minutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
        calories: row.calories_burned != null ? Number(row.calories_burned) : null,
      }));

      const caloriesWeek = completedWeek.reduce((total, row) => total + (Number(row.calories_burned) || 0), 0);
      const snapshotStreak = Number(snapshotRes.data?.streak_days) || 0;
      const streakDays = snapshotStreak || buildStreak(recentRows);
      const goalProgressPct = Number(snapshotRes.data?.goal_progress_percent) || goalRows[0]?.pct || 0;
      const coach = coachCopy({
        streak: streakDays,
        workoutsWeek: completedWeek.length,
        goalPct: goalProgressPct,
        planTitle,
      });

      setState({
        loading: false,
        error:
          snapshotRes.error?.message ||
          completedWeekRes.error?.message ||
          completedChartRes.error?.message ||
          recentRes.error?.message ||
          workoutsRes.error?.message ||
          null,
        streakDays,
        caloriesWeek,
        workoutsWeek: completedWeek.length,
        goalProgressPct,
        todayPlanTitle: todayTitle,
        todayPlanSubtitle: todaySession?.scheduled_for
          ? `Scheduled ${new Date(todaySession.scheduled_for).toLocaleDateString()}`
          : planRes.data?.description?.slice(0, 90) || null,
        todayWorkoutHref: todayHref,
        activePlanTitle: planTitle,
        todayFocusTag: profileGoal ? profileGoal.replace(/_/g, " ") : "Profile",
        estMinutes: todaySession?.duration_minutes != null ? Number(todaySession.duration_minutes) : primaryWorkout?.minutes ?? null,
        coachHeadline: coach.headline,
        coachBullets: coach.bullets,
        weekVolume: buildWeekVolume(completedChartRes.data ?? []),
        lastWorkout: mappedRecent[0] ?? null,
        recentActivity: mappedRecent,
        recommendedWorkouts,
        goals: goalRows,
        weekStrip,
      });
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

  const refresh = useCallback(() => void load(), [load]);

  return { ...state, refresh };
}
