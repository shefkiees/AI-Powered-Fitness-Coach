"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Dumbbell, Flame } from "lucide-react";
import { StatTile } from "@/components/dashboard/StatTile";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkoutCount } from "@/lib/fetchWorkoutStats";
import { readDailyGoals, readStreak } from "@/lib/localFitnessState";

type Props = {
  profile: FitnessProfileRow;
  goalsRefresh?: number;
};

export function DashboardDailyStats({ profile, goalsRefresh = 0 }: Props) {
  const { user } = useAuth();
  const [workoutsCompleted, setWorkoutsCompleted] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchWorkoutCount(user.id).then((n) => {
      if (!cancelled) setWorkoutsCompleted(n);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  void goalsRefresh;
  const goals = user?.id ? readDailyGoals(user.id) : null;
  const streak = user?.id ? readStreak(user.id) : 0;

  const caloriesEstimate = useMemo(() => {
    const base = profile.activity_level?.includes("high") ? 420 : 320;
    const adj = goals?.workoutDone ? 180 : 0;
    return base + adj;
  }, [profile.activity_level, goals?.workoutDone]);

  const items = [
    {
      key: "workouts",
      icon: Dumbbell,
      label: "Workouts completed",
      value:
        workoutsCompleted === null ? (
          <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-800" />
        ) : (
          workoutsCompleted
        ),
      hint: "Saved in your account",
    },
    {
      key: "calories",
      icon: Activity,
      label: "Calories burned (estimate)",
      value: `~${caloriesEstimate}`,
      hint: "Placeholder until devices sync",
    },
    {
      key: "streak",
      icon: Flame,
      label: "Streak (days)",
      value: streak,
      hint: "Log a workout from daily goals",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <StatTile
            icon={item.icon}
            label={item.label}
            value={item.value}
            hint={item.hint}
            className="h-full border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--fc-accent)]/30 hover:shadow-lg hover:shadow-lime-900/20"
          />
        </motion.div>
      ))}
    </div>
  );
}
