"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  Flame,
  Footprints,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkoutCount } from "@/lib/fetchWorkoutStats";
import {
  readDailyGoals,
  readStreak,
  type DailyGoalsState,
} from "@/lib/localFitnessState";
import { GOAL_LABELS } from "@/lib/profileDisplay";

type Props = {
  profile: FitnessProfileRow;
  goalsRefresh?: number;
};

export function DashboardAnalyticsHub({ profile, goalsRefresh = 0 }: Props) {
  const { user } = useAuth();
  const [savedWorkouts, setSavedWorkouts] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchWorkoutCount(user.id).then((n) => {
      if (!cancelled) setSavedWorkouts(n);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  void goalsRefresh;
  const goals: DailyGoalsState | null = user?.id
    ? readDailyGoals(user.id)
    : null;
  const streak = user?.id ? readStreak(user.id) : 0;

  const dailyScore = useMemo(() => {
    if (!goals) return 0;
    const w = goals.workoutDone ? 100 : 0;
    const h = Math.min(100, (goals.hydrationCups / 8) * 100);
    const m = Math.min(100, (goals.mobilityMinutes / 10) * 100);
    return (w + h + m) / 3;
  }, [goals]);

  const caloriesPlaceholder = useMemo(() => {
    const base = profile.activity_level?.includes("high") ? 420 : 320;
    const adj = goals?.workoutDone ? 180 : 0;
    return base + adj;
  }, [profile.activity_level, goals?.workoutDone]);

  const goalLabel = GOAL_LABELS[profile.goal] ?? profile.goal;

  return (
    <Card className="border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-950 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeader
          eyebrow="Analytics hub"
          title="Fitness snapshot + coach context"
          description="Saved workouts from your account; daily rhythm and energy are tracked locally in your browser."
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={Flame}
            label="Day streak"
            value={streak}
            hint="Updates when you log a workout"
          />
          <StatTile
            icon={Dumbbell}
            label="Saved workouts"
            value={
              savedWorkouts === null ? (
                <span className="inline-block h-8 w-10 animate-pulse rounded bg-slate-800" />
              ) : (
                savedWorkouts
              )
            }
          />
          <StatTile
            icon={Footprints}
            label="Calories burned (estimate)"
            value={`~${caloriesPlaceholder}`}
            hint="Placeholder until wearables sync"
          />
          <StatTile
            icon={Target}
            label="Primary goal"
            value={
              <span className="text-lg capitalize">{goalLabel}</span>
            }
          />
        </div>

        <div className="flex flex-wrap justify-center gap-6 lg:justify-end">
          <ProgressRing
            value={dailyScore}
            label="Daily goals"
            sublabel="Hydration · workout · mobility"
          />
          <ProgressRing
            value={Math.min(100, (savedWorkouts ?? 0) * 10)}
            max={100}
            label="Library use"
            sublabel="Based on saved plans"
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workout summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          You&apos;re training for{" "}
          <strong className="text-white">{goalLabel}</strong> with a{" "}
          <strong className="text-white">
            {profile.activity_level.replace(/_/g, " ")}
          </strong>{" "}
          baseline. Open your plan below for warm-up, main work, and cooldown—then
          check in with your AI coach on the side.
        </p>
      </div>
    </Card>
  );
}
