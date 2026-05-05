"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

type NullableNumber = number | null;

export type DashboardProfile = {
  name: string;
  age: NullableNumber;
  weightKg: NullableNumber;
  goal: string;
  fitnessLevel: string;
  workoutDaysPerWeek: number;
  preferredWorkoutDays: string[];
  targetWeightKg: NullableNumber;
  equipment: string[];
  injuries: string;
  profileComplete: boolean;
};

export type PulseGoal = {
  id: string;
  title: string;
  description: string;
  pct: number;
  target: NullableNumber;
  current: number;
  unit: string | null;
  status: string;
  deadline: string | null;
};

export type PulseActivity = {
  id: string;
  type: "workout" | "activity" | "goal" | "plan";
  title: string;
  at: string;
  meta: string;
};

export type PulseWorkoutSuggestion = {
  id: string;
  title: string;
  category: string | null;
  difficulty: string | null;
  minutes: NullableNumber;
  workoutId: string;
  reason: string;
  isAiGenerated: boolean;
};

export type PulseDayVolume = {
  label: string;
  dateKey: string;
  count: number;
  calories: number;
  steps: number;
  minutes: number;
};

export type PulseScheduleDay = {
  label: string;
  dateKey: string;
  dateLabel: string;
  isToday: boolean;
  title: string | null;
  status: string;
  sessionId: string | null;
  workoutId: string | null;
  href: string | null;
  minutes: NullableNumber;
};

export type PulseNutritionSummary = {
  calories: number;
  caloriesTarget: NullableNumber;
  proteinG: number;
  proteinTargetG: NullableNumber;
  waterMl: number;
  waterTargetMl: NullableNumber;
};

export type PulseInsight = {
  id: string;
  title: string;
  body: string;
  tone: "success" | "warning" | "info";
  actionLabel?: string;
  href?: string;
};

export type DashboardActionState = {
  savingWorkout: boolean;
  savingActivity: boolean;
  savingNutrition: boolean;
  savingWater: boolean;
  savingGoal: boolean;
  updatingGoalId: string | null;
  generatingPlan: boolean;
  savingWorkoutDays: boolean;
  skippingSessionId: string | null;
  notice: string | null;
  error: string | null;
};

export type QuickWorkoutInput = {
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  rating?: number | null;
};

export type ActivityLogInput = {
  steps?: number | null;
  weightKg?: number | null;
  caloriesBurned?: number | null;
  notes?: string;
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  targetValue?: number | null;
  unit?: string | null;
};

export type NutritionLogInput = {
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  notes?: string;
};

export type PulseDashboardModel = {
  loading: boolean;
  error: string | null;
  profile: DashboardProfile | null;
  workoutsWeek: number;
  caloriesWeek: number;
  minutesWeek: number;
  stepsWeek: number;
  streakDays: number;
  workoutTargetPct: number;
  goalProgressPct: number;
  latestWeightKg: NullableNumber;
  weightDeltaKg: NullableNumber;
  activePlanTitle: string | null;
  activePlanDescription: string | null;
  nextWorkoutTitle: string | null;
  nextWorkoutSubtitle: string | null;
  nextWorkoutHref: string | null;
  todayFocusTag: string;
  estMinutes: NullableNumber;
  coachHeadline: string;
  coachBullets: string[];
  weekSchedule: PulseScheduleDay[];
  weekVolume: PulseDayVolume[];
  monthTrend: PulseDayVolume[];
  nutrition: PulseNutritionSummary;
  recentActivity: PulseActivity[];
  recommendedWorkouts: PulseWorkoutSuggestion[];
  goals: PulseGoal[];
  insights: PulseInsight[];
  actions: DashboardActionState;
  refresh: () => void;
  logWorkout: (input: QuickWorkoutInput) => Promise<void>;
  logActivity: (input: ActivityLogInput) => Promise<void>;
  logNutritionIntake: (input: NutritionLogInput) => Promise<void>;
  addWaterIntake: (amountMl: number) => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
  updateGoalProgress: (goalId: string, currentValue: number, status?: string) => Promise<void>;
  updateWorkoutDays: (days: string[]) => Promise<void>;
  skipSession: (sessionId: string) => Promise<void>;
  generateAiPlan: () => Promise<void>;
};

const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function mondayStart(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  return next;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shortDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function asNumber(value: unknown): NullableNumber {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asPositiveNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function weekdayKey(value: unknown) {
  return String(value || "").trim().slice(0, 3).toLowerCase();
}

function normalizeGoalText(goal: string) {
  return goal.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function profileFromRows(profileRow: Record<string, unknown> | null, fitnessRow: Record<string, unknown> | null): DashboardProfile {
  const weightKg = asNumber(profileRow?.weight_kg);
  const weeklyTarget = asPositiveNumber(
    fitnessRow?.weekly_workout_target ?? profileRow?.workout_days_per_week,
    3,
  );
  const goal = asString(profileRow?.goal ?? fitnessRow?.main_goal, "improve_fitness");
  const fitnessLevel = asString(profileRow?.fitness_level ?? fitnessRow?.fitness_level, "beginner");
  const name = asString(profileRow?.name, "Athlete");
  const age = asNumber(profileRow?.age);
  const height = asNumber(profileRow?.height_cm);
  const preferredWorkoutDays = asStringArray(
    profileRow?.preferred_workout_days ?? fitnessRow?.preferred_workout_days,
  );

  return {
    name,
    age,
    weightKg,
    goal,
    fitnessLevel,
    workoutDaysPerWeek: Math.min(7, Math.max(1, weeklyTarget)),
    preferredWorkoutDays,
    targetWeightKg: asNumber(fitnessRow?.target_weight_kg),
    equipment: asStringArray(profileRow?.equipment_available ?? fitnessRow?.equipment_available),
    injuries: asString(profileRow?.injuries ?? fitnessRow?.injuries_limitations, ""),
    profileComplete:
      name.length >= 2 &&
      Boolean(goal) &&
      Boolean(fitnessLevel) &&
      Boolean(age && age > 0) &&
      Boolean(weightKg && weightKg > 0) &&
      Boolean(height && height > 0),
  };
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

function emptyNutrition(): PulseNutritionSummary {
  return {
    calories: 0,
    caloriesTarget: null,
    proteinG: 0,
    proteinTargetG: null,
    waterMl: 0,
    waterTargetMl: null,
  };
}

function scheduleStatusRank(status: string) {
  if (status === "in_progress") return 0;
  if (status === "scheduled") return 1;
  if (status === "completed") return 2;
  if (status === "skipped") return 3;
  return 4;
}

function buildWeekSchedule(
  rows: Record<string, unknown>[],
  start: Date,
  now: Date,
  preferredWorkoutDays: string[] = [],
): PulseScheduleDay[] {
  const today = dateKey(now);
  const days = emptyDays(start, 7);
  const preferred = new Set(preferredWorkoutDays.map(weekdayKey).filter(Boolean));

  return days.map((dayVolume, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const sessions = rows
      .filter((row) => {
        if (!row.scheduled_for) return false;
        return dateKey(new Date(String(row.scheduled_for))) === dayVolume.dateKey;
      })
      .sort((a, b) => scheduleStatusRank(String(a.status || "")) - scheduleStatusRank(String(b.status || "")));
    const session = sessions[0] ?? null;
    const workoutId = session?.workout_id != null ? String(session.workout_id) : null;
    const sessionId = session?.id != null ? String(session.id) : null;
    const href = workoutId
      ? `/workout/session?workout=${workoutId}${sessionId ? `&session=${sessionId}` : ""}`
      : null;
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

function addWorkoutVolume(days: PulseDayVolume[], rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const key = String(row.completed_at || "").slice(0, 10);
    const slot = days.find((day) => day.dateKey === key);
    if (!slot) continue;
    slot.count += 1;
    slot.calories += Number(row.calories_burned) || 0;
    slot.minutes += Number(row.duration_minutes) || 0;
  }
}

function addActivityVolume(days: PulseDayVolume[], rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const key = String(row.logged_at || "").slice(0, 10);
    const slot = days.find((day) => day.dateKey === key);
    if (!slot) continue;
    slot.steps += Number(row.steps) || 0;
    slot.calories += Number(row.calories_burned) || 0;
  }
}

function buildStreak(rows: Record<string, unknown>[]) {
  const completedDays = new Set(
    rows.map((row) => String(row.completed_at || "").slice(0, 10)).filter(Boolean),
  );
  let streak = 0;
  const cursor = startOfDay(new Date());

  for (let index = 0; index < 365; index += 1) {
    const key = dateKey(cursor);
    if (!completedDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function mapGoals(rows: Record<string, unknown>[]): PulseGoal[] {
  return rows.map((goal) => {
    const target = asNumber(goal.target_value);
    const current = Number(goal.current_value) || 0;
    const pct = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      id: String(goal.id),
      title: String(goal.title || "Goal"),
      description: String(goal.description || ""),
      pct,
      target,
      current,
      unit: goal.unit != null ? String(goal.unit) : null,
      status: String(goal.status || "active"),
      deadline: goal.deadline != null ? String(goal.deadline) : null,
    };
  });
}

function scoreWorkouts(rows: Record<string, unknown>[], profile: DashboardProfile | null): PulseWorkoutSuggestion[] {
  const goal = profile?.goal || "";
  const level = profile?.fitnessLevel || "";

  return rows
    .map((workout) => {
      const tags = asStringArray(workout.goal_tags);
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

function buildTimeline(input: {
  completed: Record<string, unknown>[];
  activity: Record<string, unknown>[];
  goals: PulseGoal[];
  planTitle: string | null;
  planCreatedAt?: string | null;
}): PulseActivity[] {
  const events: PulseActivity[] = [];

  input.completed.slice(0, 10).forEach((row) => {
    events.push({
      id: `workout-${row.id}`,
      type: "workout",
      title: String(row.workout_title || "Completed workout"),
      at: String(row.completed_at || new Date().toISOString()),
      meta: `${Number(row.duration_minutes) || 0} min - ${Number(row.calories_burned) || 0} kcal`,
    });
  });

  input.activity.slice(0, 8).forEach((row) => {
    const details = [
      Number(row.steps) ? `${Number(row.steps).toLocaleString()} steps` : "",
      asNumber(row.weight_kg) ? `${Number(row.weight_kg)} kg` : "",
      Number(row.calories_burned) ? `${Number(row.calories_burned)} kcal` : "",
    ].filter(Boolean);
    events.push({
      id: `activity-${row.id}`,
      type: "activity",
      title: details.length ? "Activity log" : "Progress note",
      at: String(row.logged_at || new Date().toISOString()),
      meta: details.join(" - ") || String(row.notes || "Saved progress"),
    });
  });

  input.goals.slice(0, 4).forEach((goal) => {
    events.push({
      id: `goal-${goal.id}`,
      type: "goal",
      title: goal.title,
      at: goal.deadline || new Date().toISOString(),
      meta: `${goal.pct}% complete`,
    });
  });

  if (input.planTitle && input.planCreatedAt) {
    events.push({
      id: "plan-active",
      type: "plan",
      title: input.planTitle,
      at: input.planCreatedAt,
      meta: "Active AI workout plan",
    });
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
}

function buildInsights(input: {
  profile: DashboardProfile | null;
  workoutsWeek: number;
  workoutTarget: number;
  missedWorkouts: number;
  streakDays: number;
  stepsWeek: number;
  goals: PulseGoal[];
  activePlanTitle: string | null;
  recentActivityCount: number;
  weightDeltaKg: NullableNumber;
}): PulseInsight[] {
  const insights: PulseInsight[] = [];

  if (!input.profile?.profileComplete) {
    insights.push({
      id: "profile",
      title: "Complete your profile",
      body: "The dashboard can personalize workouts much better once age, weight, goal, and level are saved.",
      tone: "warning",
      actionLabel: "Update profile",
      href: "/profile-setup",
    });
  }

  if (!input.activePlanTitle) {
    insights.push({
      id: "plan",
      title: "Generate a real AI plan",
      body: "Create a workout block from your goal, fitness level, equipment, and recent activity. It will be stored in Supabase.",
      tone: "info",
    });
  }

  if (input.streakDays >= 3) {
    insights.push({
      id: "streak",
      title: `${input.streakDays}-day streak`,
      body: "You have a useful rhythm going. Keep the next session simple enough to protect consistency.",
      tone: "success",
    });
  }

  if (input.missedWorkouts > 0) {
    insights.push({
      id: "missed",
      title: "Behind weekly pace",
      body: `You are ${input.missedWorkouts} workout${input.missedWorkouts === 1 ? "" : "s"} behind the expected weekly pace. Add one short session before increasing intensity.`,
      tone: "warning",
    });
  }

  if (input.workoutsWeek === 0) {
    insights.push({
      id: "inactive",
      title: "No workouts logged this week",
      body: "Start with one 20-30 minute session. Consistency beats a perfect plan that never starts.",
      tone: "warning",
    });
  } else if (input.workoutsWeek >= input.workoutTarget) {
    insights.push({
      id: "rest",
      title: "Rest day is earned",
      body: "You hit your weekly workout target. Keep movement light today unless you feel fully recovered.",
      tone: "success",
    });
  } else {
    insights.push({
      id: "pace",
      title: "You are building momentum",
      body: `${input.workoutsWeek}/${input.workoutTarget} workouts done. Add one focused session to stay on pace.`,
      tone: "info",
    });
  }

  if (input.stepsWeek > 0 && input.stepsWeek < 25000) {
    insights.push({
      id: "steps",
      title: "Low step volume detected",
      body: "Add a 10 minute walk after one meal today. It is a small recovery win without adding gym fatigue.",
      tone: "info",
    });
  }

  if (input.weightDeltaKg !== null && Math.abs(input.weightDeltaKg) >= 1) {
    insights.push({
      id: "weight",
      title: "Weight trend changed",
      body:
        input.weightDeltaKg > 0
          ? "Weight is trending up. If fat loss is the goal, review calories and keep protein consistent."
          : "Weight is trending down. Keep training quality high and avoid cutting recovery too hard.",
      tone: "info",
    });
  }

  if (input.goals.length === 0) {
    insights.push({
      id: "goal",
      title: "Add a measurable goal",
      body: "A target like workouts per week, body weight, or steps gives the dashboard a real progress signal.",
      tone: "info",
    });
  }

  return insights.slice(0, 5);
}

function buildCoachSummary(input: {
  activePlanTitle: string | null;
  workoutsWeek: number;
  workoutTarget: number;
  missedWorkouts: number;
  streakDays: number;
  stepsWeek: number;
  latestWeightKg: NullableNumber;
  weightDeltaKg: NullableNumber;
}) {
  const bullets: string[] = [];
  const remainingWorkouts = Math.max(0, input.workoutTarget - input.workoutsWeek);

  const headline =
    input.streakDays >= 3
      ? `${input.streakDays}-day streak. Keep the rhythm alive.`
      : input.missedWorkouts > 0
        ? `${input.missedWorkouts} session${input.missedWorkouts === 1 ? "" : "s"} behind pace.`
        : input.activePlanTitle
          ? "You are on pace for this training block."
          : "Your coach is ready to shape the week.";

  if (input.missedWorkouts > 0) {
    bullets.push("Start with a short, low-friction workout today instead of trying to make up everything at once.");
  } else if (remainingWorkouts > 0) {
    bullets.push(`${remainingWorkouts} workout${remainingWorkouts === 1 ? "" : "s"} left to hit the weekly target.`);
  } else {
    bullets.push("Weekly target is covered. Use the next session for recovery, mobility, or light technique.");
  }

  if (input.streakDays > 0) {
    bullets.push(`Current streak: ${input.streakDays} day${input.streakDays === 1 ? "" : "s"}. Keep the next action easy to repeat.`);
  } else {
    bullets.push("No active streak yet. One logged workout today starts the chain.");
  }

  if (input.weightDeltaKg !== null && Math.abs(input.weightDeltaKg) >= 0.2) {
    const direction = input.weightDeltaKg > 0 ? "up" : "down";
    bullets.push(`Weight trend is ${Math.abs(input.weightDeltaKg)} kg ${direction} across recent logs.`);
  } else if (input.latestWeightKg !== null) {
    bullets.push(`Latest weight log: ${input.latestWeightKg} kg. Add another check-in later for a clearer trend.`);
  } else if (input.stepsWeek > 0) {
    bullets.push(`${input.stepsWeek.toLocaleString()} steps logged this week. Add an easy walk if recovery feels good.`);
  }

  return { headline, bullets: bullets.slice(0, 3) };
}

function emptyState(): Omit<PulseDashboardModel, "refresh" | "logWorkout" | "logActivity" | "logNutritionIntake" | "addWaterIntake" | "createGoal" | "updateGoalProgress" | "updateWorkoutDays" | "skipSession" | "generateAiPlan"> {
  const weekStart = mondayStart(new Date());
  const monthStart = startOfDay(new Date());
  monthStart.setDate(monthStart.getDate() - 13);

  return {
    loading: true,
    error: null,
    profile: null,
    workoutsWeek: 0,
    caloriesWeek: 0,
    minutesWeek: 0,
    stepsWeek: 0,
    streakDays: 0,
    workoutTargetPct: 0,
    goalProgressPct: 0,
    latestWeightKg: null,
    weightDeltaKg: null,
    activePlanTitle: null,
    activePlanDescription: null,
    nextWorkoutTitle: null,
    nextWorkoutSubtitle: null,
    nextWorkoutHref: null,
    todayFocusTag: "Profile",
    estMinutes: null,
    coachHeadline: "",
    coachBullets: [],
    weekSchedule: buildWeekSchedule([], weekStart, new Date()),
    weekVolume: emptyDays(weekStart, 7),
    monthTrend: emptyDays(monthStart, 14),
    nutrition: emptyNutrition(),
    recentActivity: [],
    recommendedWorkouts: [],
    goals: [],
    insights: [],
    actions: {
      savingWorkout: false,
      savingActivity: false,
      savingNutrition: false,
      savingWater: false,
      savingGoal: false,
      updatingGoalId: null,
      generatingPlan: false,
      savingWorkoutDays: false,
      skippingSessionId: null,
      notice: null,
      error: null,
    },
  };
}

export function usePulseDashboard(userId: string | undefined): PulseDashboardModel {
  const [state, setState] = useState(emptyState);

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
        supabase
          .from("fitness_profiles")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_workout_plans")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_workout_sessions")
          .select("id, workout_id, plan_id, title, scheduled_for, status, duration_minutes, calories_burned, created_at")
          .eq("user_id", userId)
          .in("status", ["scheduled", "in_progress", "completed", "skipped"])
          .order("scheduled_for", { ascending: true, nullsFirst: false })
          .limit(40),
        supabase
          .from("completed_workouts")
          .select("*")
          .eq("user_id", userId)
          .gte("completed_at", trendStart.toISOString())
          .order("completed_at", { ascending: false })
          .limit(60),
        supabase
          .from("weight_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("logged_at", trendStart.toISOString())
          .order("logged_at", { ascending: false })
          .limit(60),
        supabase
          .from("goals")
          .select("*")
          .eq("user_id", userId)
          .in("status", ["active", "paused"])
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("workouts")
          .select("id, title, category, difficulty, duration_minutes, goal_tags, is_public, user_id, source, created_at")
          .or(`is_public.eq.true,user_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("nutrition_logs")
          .select("consumed_calories, target_calories, consumed_protein_g, target_protein_g, log_date")
          .eq("user_id", userId)
          .eq("log_date", dateKey(now))
          .maybeSingle(),
        supabase
          .from("water_logs")
          .select("amount_ml, target_ml, log_date")
          .eq("user_id", userId)
          .eq("log_date", dateKey(now))
          .maybeSingle(),
      ]);

      const warning = [
        profileRes.error,
        fitnessRes.error,
        planRes.error,
        sessionsRes.error,
        completedRes.error,
        activityRes.error,
        goalsRes.error,
        workoutsRes.error,
        nutritionRes.error,
        waterRes.error,
      ]
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

      const completedWeek = completedRows.filter(
        (row) => new Date(String(row.completed_at)).getTime() >= weekStart.getTime(),
      );
      const activityWeek = activityRows.filter(
        (row) => new Date(String(row.logged_at)).getTime() >= weekStart.getTime(),
      );
      const workoutsWeek = completedWeek.length;
      const caloriesWeek =
        completedWeek.reduce((total, row) => total + (Number(row.calories_burned) || 0), 0) +
        activityWeek.reduce((total, row) => total + (Number(row.calories_burned) || 0), 0);
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

      const nutrition: PulseNutritionSummary = {
        calories: Number(nutritionRes.data?.consumed_calories) || 0,
        caloriesTarget: asNumber(nutritionRes.data?.target_calories),
        proteinG: Number(nutritionRes.data?.consumed_protein_g) || 0,
        proteinTargetG: asNumber(nutritionRes.data?.target_protein_g),
        waterMl: Number(waterRes.data?.amount_ml) || 0,
        waterTargetMl: asNumber(waterRes.data?.target_ml),
      };

      const sortedWeights = activityRows
        .filter((row) => asNumber(row.weight_kg) !== null)
        .sort((a, b) => new Date(String(b.logged_at)).getTime() - new Date(String(a.logged_at)).getTime());
      const latestWeightKg = asNumber(sortedWeights[0]?.weight_kg) ?? profile.weightKg;
      const oldestWeightKg = asNumber(sortedWeights[sortedWeights.length - 1]?.weight_kg);
      const weightDeltaKg =
        latestWeightKg !== null && oldestWeightKg !== null && sortedWeights.length > 1
          ? Number((latestWeightKg - oldestWeightKg).toFixed(1))
          : null;

      const nextSession = sessionRows.find((row) => {
        if (String(row.status) === "completed" || String(row.status) === "skipped") return false;
        if (!row.scheduled_for) return true;
        return new Date(String(row.scheduled_for)).getTime() >= startOfDay(now).getTime();
      });
      const primaryWorkout = recommendedWorkouts[0] ?? null;
      const nextWorkoutTitle = nextSession?.title ? String(nextSession.title) : primaryWorkout?.title ?? null;
      const nextWorkoutHref = nextSession?.workout_id
        ? `/workout/session?workout=${nextSession.workout_id}&session=${nextSession.id}`
        : primaryWorkout?.workoutId
          ? `/workout/session?workout=${primaryWorkout.workoutId}`
          : null;
      const nextWorkoutSubtitle = nextSession?.scheduled_for
        ? `Scheduled ${new Date(String(nextSession.scheduled_for)).toLocaleDateString()}`
        : primaryWorkout?.reason ?? null;
      const estMinutes = nextSession?.duration_minutes != null ? Number(nextSession.duration_minutes) : primaryWorkout?.minutes ?? null;
      const activePlanTitle = planRes.data?.title ? String(planRes.data.title) : null;
      const activePlanDescription = planRes.data?.description ? String(planRes.data.description) : null;
      const streakDays = buildStreak(completedRows);
      const recentActivity = buildTimeline({
        completed: completedRows,
        activity: activityRows,
        goals,
        planTitle: activePlanTitle,
        planCreatedAt: planRes.data?.created_at ? String(planRes.data.created_at) : null,
      });
      const insights = buildInsights({
        profile,
        workoutsWeek,
        workoutTarget,
        missedWorkouts,
        streakDays,
        stepsWeek,
        goals,
        activePlanTitle,
        recentActivityCount: recentActivity.length,
        weightDeltaKg,
      });
      const coachSummary = buildCoachSummary({
        activePlanTitle,
        workoutsWeek,
        workoutTarget,
        missedWorkouts,
        streakDays,
        stepsWeek,
        latestWeightKg,
        weightDeltaKg,
      });

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

  const logActivity = useCallback(
    async (input: ActivityLogInput) => {
      if (!supabase || !userId) return;
      setAction({ savingActivity: true, error: null, notice: null });
      try {
        const payload = {
          user_id: userId,
          steps: input.steps !== null && input.steps !== undefined ? Math.max(0, Math.round(input.steps)) : null,
          weight_kg: input.weightKg !== null && input.weightKg !== undefined ? input.weightKg : null,
          calories_burned:
            input.caloriesBurned !== null && input.caloriesBurned !== undefined
              ? Math.max(0, Math.round(input.caloriesBurned))
              : null,
          notes: input.notes?.trim() || "",
          logged_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("weight_logs").insert(payload);
        if (error) throw error;
        if (payload.weight_kg) {
          await supabase.from("profiles").update({ weight_kg: payload.weight_kg }).eq("id", userId);
        }
        setAction({ notice: "Activity saved." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save activity." });
      } finally {
        setAction({ savingActivity: false });
      }
    },
    [load, setAction, userId],
  );

  const logNutritionIntake = useCallback(
    async (input: NutritionLogInput) => {
      if (!supabase || !userId) return;
      const calories = input.calories != null ? Math.max(0, Math.round(Number(input.calories) || 0)) : 0;
      const proteinG = input.proteinG != null ? Math.max(0, Math.round(Number(input.proteinG) || 0)) : 0;
      const carbsG = input.carbsG != null ? Math.max(0, Math.round(Number(input.carbsG) || 0)) : 0;
      const fatG = input.fatG != null ? Math.max(0, Math.round(Number(input.fatG) || 0)) : 0;
      const notes = String(input.notes || "").trim();

      if (!calories && !proteinG && !carbsG && !fatG && !notes) {
        setAction({ error: "Add calories, protein, carbs, fat, or a short note before saving nutrition." });
        return;
      }

      setAction({ savingNutrition: true, error: null, notice: null });
      try {
        const today = dateKey(new Date());
        const existing = await supabase
          .from("nutrition_logs")
          .select(
            "id, target_calories, target_protein_g, target_carbs_g, target_fat_g, consumed_calories, consumed_protein_g, consumed_carbs_g, consumed_fat_g, notes",
          )
          .eq("user_id", userId)
          .eq("log_date", today)
          .maybeSingle();
        if (existing.error) throw existing.error;

        const existingRow = existing.data;
        const mergedNotes = notes
          ? [String(existingRow?.notes || "").trim(), notes].filter(Boolean).join(" | ")
          : String(existingRow?.notes || "");
        const payload = {
          user_id: userId,
          log_date: today,
          target_calories: Number(existingRow?.target_calories) || 2000,
          target_protein_g: Number(existingRow?.target_protein_g) || 120,
          target_carbs_g: Number(existingRow?.target_carbs_g) || 200,
          target_fat_g: Number(existingRow?.target_fat_g) || 60,
          consumed_calories: (Number(existingRow?.consumed_calories) || 0) + calories,
          consumed_protein_g: (Number(existingRow?.consumed_protein_g) || 0) + proteinG,
          consumed_carbs_g: (Number(existingRow?.consumed_carbs_g) || 0) + carbsG,
          consumed_fat_g: (Number(existingRow?.consumed_fat_g) || 0) + fatG,
          notes: mergedNotes,
        };

        if (existingRow?.id) {
          const update = await supabase.from("nutrition_logs").update(payload).eq("id", existingRow.id).eq("user_id", userId);
          if (update.error) throw update.error;
        } else {
          const insert = await supabase.from("nutrition_logs").insert(payload);
          if (insert.error) throw insert.error;
        }

        setAction({ notice: "Nutrition snapshot updated." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save nutrition snapshot." });
      } finally {
        setAction({ savingNutrition: false });
      }
    },
    [load, setAction, userId],
  );

  const addWaterIntake = useCallback(
    async (amountMl: number) => {
      if (!supabase || !userId) return;
      const waterMl = Math.max(0, Math.round(Number(amountMl) || 0));
      if (!waterMl) {
        setAction({ error: "Water amount must be greater than 0 ml." });
        return;
      }

      setAction({ savingWater: true, error: null, notice: null });
      try {
        const today = dateKey(new Date());
        const existing = await supabase
          .from("water_logs")
          .select("id, amount_ml, target_ml")
          .eq("user_id", userId)
          .eq("log_date", today)
          .maybeSingle();
        if (existing.error) throw existing.error;

        const currentAmount = Number(existing.data?.amount_ml) || 0;
        const targetMl = Number(existing.data?.target_ml) || 2500;
        const payload = {
          user_id: userId,
          log_date: today,
          amount_ml: currentAmount + waterMl,
          target_ml: targetMl,
        };

        if (existing.data?.id) {
          const update = await supabase.from("water_logs").update(payload).eq("id", existing.data.id).eq("user_id", userId);
          if (update.error) throw update.error;
        } else {
          const insert = await supabase.from("water_logs").insert(payload);
          if (insert.error) throw insert.error;
        }

        setAction({ notice: `Added ${waterMl} ml water.` });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save water intake." });
      } finally {
        setAction({ savingWater: false });
      }
    },
    [load, setAction, userId],
  );

  const createGoal = useCallback(
    async (input: CreateGoalInput) => {
      if (!supabase || !userId) return;
      setAction({ savingGoal: true, error: null, notice: null });
      try {
        const { error } = await supabase.from("goals").insert({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || "",
          target_value: input.targetValue || null,
          current_value: 0,
          unit: input.unit?.trim() || null,
          status: "active",
        });
        if (error) throw error;
        setAction({ notice: "Goal created." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not create goal." });
      } finally {
        setAction({ savingGoal: false });
      }
    },
    [load, setAction, userId],
  );

  const updateGoalProgress = useCallback(
    async (goalId: string, currentValue: number, status = "active") => {
      if (!supabase || !userId) return;
      setAction({ updatingGoalId: goalId, error: null, notice: null });
      try {
        const { error } = await supabase
          .from("goals")
          .update({ current_value: Math.max(0, currentValue), status })
          .eq("id", goalId)
          .eq("user_id", userId);
        if (error) throw error;
        setAction({ notice: "Goal updated." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not update goal." });
      } finally {
        setAction({ updatingGoalId: null });
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
        const profileUpdate = await supabase
          .from("profiles")
          .update({
            preferred_workout_days: cleanDays,
            workout_days_per_week: cleanDays.length,
          })
          .eq("id", userId);
        if (profileUpdate.error) throw profileUpdate.error;

        const { data: fitnessProfile } = await supabase
          .from("fitness_profiles")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fitnessProfile?.id) {
          const fitnessUpdate = await supabase
            .from("fitness_profiles")
            .update({
              preferred_workout_days: cleanDays,
              weekly_workout_target: cleanDays.length,
            })
            .eq("id", fitnessProfile.id)
            .eq("user_id", userId);
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
        const { error } = await supabase
          .from("user_workout_sessions")
          .update({ status: "skipped" })
          .eq("id", sessionId)
          .eq("user_id", userId);
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
        body: JSON.stringify({ profile: state.profile || {} }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; warnings?: string[] };
      if (!response.ok) {
        throw new Error(data.error || "Could not generate AI plan.");
      }
      const warning = data.warnings?.length ? ` Warnings: ${data.warnings.join(" ")}` : "";
      setAction({ notice: `AI plan generated and saved.${warning}` });
      await load();
    } catch (error) {
      setAction({ error: error instanceof Error ? error.message : "Could not generate AI plan." });
    } finally {
      setAction({ generatingPlan: false });
    }
  }, [load, setAction, state.profile]);

  const refresh = useCallback(() => void load(), [load]);

  return {
    ...state,
    refresh,
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
