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
  const [workoutsCompleted, setWorkoutsCompleted] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchWorkoutCount(user.id).then((count) => {
      if (!cancelled) setWorkoutsCompleted(count);
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
    const adjustment = goals?.workoutDone ? 180 : 0;
    return base + adjustment;
  }, [profile.activity_level, goals?.workoutDone]);

  const items = [
    {
      key: "workouts",
      icon: Dumbbell,
      label: "Workouts completed",
      value:
        workoutsCompleted === null ? (
          <span className="inline-block h-8 w-14 animate-pulse rounded-2xl bg-black/8" />
        ) : (
          workoutsCompleted
        ),
      hint: "Saved to your account",
    },
    {
      key: "calories",
      icon: Activity,
      label: "Calories estimate",
      value: `~${caloriesEstimate}`,
      hint: "Updated from profile intensity",
    },
    {
      key: "streak",
      icon: Flame,
      label: "Current streak",
      value: streak,
      hint: "Built from daily training actions",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <StatTile
            icon={item.icon}
            label={item.label}
            value={item.value}
            hint={item.hint}
            className="h-full rounded-[1.7rem] border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(247,243,231,0.96)_100%)] text-[#17181b] shadow-[0_18px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-black/14 hover:shadow-[0_22px_42px_rgba(0,0,0,0.12)]"
          />
        </motion.div>
      ))}
    </div>
  );
}
