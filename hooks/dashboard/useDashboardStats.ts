"use client";

import type {
  DashboardActionState,
  DashboardProfile,
  NullableNumber,
  PulseDashboardModel,
  PulseDayVolume,
  PulseGoal,
  PulseInsight,
} from "@/hooks/dashboard/types";

export const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function mondayStart(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  return next;
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shortDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function asNumber(value: unknown): NullableNumber {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function asPositiveNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function weekdayKey(value: unknown) {
  return String(value || "").trim().slice(0, 3).toLowerCase();
}

export function normalizeGoalText(goal: string) {
  return goal.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function emptyDays(start: Date, count: number): PulseDayVolume[] {
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

export function buildStreak(rows: Record<string, unknown>[]) {
  const completedDays = new Set(rows.map((row) => String(row.completed_at || "").slice(0, 10)).filter(Boolean));
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

export function buildInsights(input: {
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

export function buildCoachSummary(input: {
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

export function emptyDashboardState(): Omit<PulseDashboardModel, "refresh" | "refreshWeeklyReview" | "logWorkout" | "logActivity" | "logNutritionIntake" | "addWaterIntake" | "createGoal" | "updateGoalProgress" | "updateWorkoutDays" | "skipSession" | "generateAiPlan"> {
  const weekStart = mondayStart(new Date());
  const monthStart = startOfDay(new Date());
  monthStart.setDate(monthStart.getDate() - 13);

  const emptyActions: DashboardActionState = {
    savingWorkout: false,
    savingActivity: false,
    savingNutrition: false,
    savingWater: false,
    savingGoal: false,
    updatingGoalId: null,
    generatingPlan: false,
    reviewingCoach: false,
    savingWorkoutDays: false,
    skippingSessionId: null,
    notice: null,
    error: null,
  };

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
    weekSchedule: [],
    weekVolume: emptyDays(weekStart, 7),
    monthTrend: emptyDays(monthStart, 14),
    nutrition: {
      calories: 0,
      caloriesTarget: null,
      proteinG: 0,
      proteinTargetG: null,
      waterMl: 0,
      waterTargetMl: null,
    },
    recentActivity: [],
    recommendedWorkouts: [],
    goals: [],
    insights: [],
    weeklyReview: null,
    actions: emptyActions,
  };
}
