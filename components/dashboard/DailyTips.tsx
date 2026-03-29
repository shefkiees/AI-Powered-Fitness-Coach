"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { normalizeGoal } from "@/lib/workoutPlan";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";

const TIPS = {
  lose_weight: [
    "Prioritize protein at each meal to protect muscle while in a deficit.",
    "Walk 20–30 minutes daily—NEAT adds up without crushing recovery.",
    "Sleep 7+ hours; hunger and cravings spike when you’re under-rested.",
  ],
  build_muscle: [
    "Add a little load or one rep when the last set feels easy for two sessions.",
    "Train each muscle group at least twice per week when possible.",
    "Eat enough calories—muscle grows when fuel matches hard training.",
  ],
  stay_fit: [
    "Mix intensity: two harder days, two moderate, and active recovery.",
    "Schedule optional mobility 10 minutes after workouts.",
    "If you miss a session, do a 15-minute circuit instead of skipping entirely.",
  ],
} as const;

type Props = { profile: FitnessProfileRow };

export function DailyTips({ profile }: Props) {
  const goal = normalizeGoal(profile.goal);
  const tips = TIPS[goal];

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-lg shadow-black/15">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Daily tips</h2>
        <Sparkles className="ml-auto h-4 w-4 text-amber-400/70" />
      </div>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {tips.map((t) => (
          <li
            key={t.slice(0, 24)}
            className="flex gap-2 border-l-2 border-amber-500/35 pl-3 leading-relaxed"
          >
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">
        Tips adapt to your goal:{" "}
        {goal === "lose_weight"
          ? "fat loss focus"
          : goal === "build_muscle"
            ? "muscle focus"
            : "balanced fitness"}
        .
      </p>
    </Card>
  );
}
