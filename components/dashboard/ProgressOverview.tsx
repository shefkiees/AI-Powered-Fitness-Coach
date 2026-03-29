"use client";

import { useEffect, useState } from "react";
import { Calendar, Dumbbell, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkoutCount } from "@/lib/fetchWorkoutStats";

function formatBmi(weightKg: number, heightCm: number): string {
  const h = heightCm / 100;
  if (h <= 0) return "—";
  const bmi = weightKg / (h * h);
  return bmi.toFixed(1);
}

type Props = {
  profile?: FitnessProfileRow | null;
};

export function ProgressOverview({ profile }: Props) {
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

  const bmi =
    profile && profile.weight > 0 && profile.height > 0
      ? formatBmi(profile.weight, profile.height)
      : null;

  const activityLabel = profile
    ? profile.activity_level.replace(/_/g, " ")
    : null;

  return (
    <Card className="border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/15">
      <p className="text-xs font-semibold uppercase tracking-wider text-lime-400/90">
        Progress overview
      </p>
      <h2 className="mt-1 text-lg font-bold text-white">Snapshot</h2>
      <p className="mt-1 text-sm text-slate-400">
        Saved plans from your account plus quick health markers.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 transition hover:border-lime-500/25">
          <Dumbbell className="h-5 w-5 text-lime-400" />
          <p className="mt-2 text-2xl font-bold text-white">
            {savedWorkouts === null ? (
              <span className="inline-block h-8 w-10 animate-pulse rounded bg-slate-800" />
            ) : (
              savedWorkouts
            )}
          </p>
          <p className="text-xs text-slate-500">Saved workouts</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 transition hover:border-lime-500/25">
          <Target className="h-5 w-5 text-emerald-400" />
          <p className="mt-2 text-sm font-semibold capitalize text-slate-200">
            {profile?.goal?.replace(/_/g, " ") ?? "—"}
          </p>
          <p className="text-xs text-slate-500">Current goal</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 transition hover:border-lime-500/25">
          <TrendingUp className="h-5 w-5 text-lime-400/90" />
          <p className="mt-2 text-sm font-semibold capitalize text-slate-200">
            {activityLabel ?? "—"}
          </p>
          <p className="text-xs text-slate-500">Activity level</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 transition hover:border-lime-500/25">
          <Calendar className="h-5 w-5 text-sky-400" />
          <p className="mt-2 text-2xl font-bold text-white">
            {bmi ?? "—"}
          </p>
          <p className="text-xs text-slate-500">
            {bmi ? "BMI (estimate)" : "Add weight & height"}
          </p>
        </div>
      </div>
    </Card>
  );
}
