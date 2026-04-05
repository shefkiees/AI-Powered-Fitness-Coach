"use client";

import { useCallback, useState } from "react";
import { Check, Droplets, Footprints, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import {
  readDailyGoals,
  writeDailyGoals,
  recordActiveDay,
  pushTimelineEvent,
  type DailyGoalsState,
} from "@/lib/localFitnessState";
import { cn } from "@/lib/cn";

const HYDRATION_TARGET = 8;
const MOBILITY_TARGET = 10;

type Props = {
  userId: string;
  onGoalsChange?: (goals: DailyGoalsState) => void;
};

export function DailyGoalsCard({ userId, onGoalsChange }: Props) {
  const [goals, setGoals] = useState<DailyGoalsState>(() =>
    readDailyGoals(userId),
  );

  const persist = useCallback(
    (next: DailyGoalsState) => {
      writeDailyGoals(userId, next);
      setGoals(next);
      onGoalsChange?.(next);
    },
    [userId, onGoalsChange],
  );

  const workoutPct = goals.workoutDone ? 100 : 0;
  const hydrationPct = Math.min(
    100,
    (goals.hydrationCups / HYDRATION_TARGET) * 100,
  );
  const mobilityPct = Math.min(
    100,
    (goals.mobilityMinutes / MOBILITY_TARGET) * 100,
  );
  const overall =
    (workoutPct + hydrationPct + mobilityPct) / 3;

  const toggleWorkout = () => {
    const next = { ...goals, workoutDone: !goals.workoutDone };
    persist(next);
    if (next.workoutDone && !goals.workoutDone) {
      recordActiveDay(userId);
      pushTimelineEvent(userId, {
        label: "Marked workout as complete",
        tone: "workout",
      });
    }
  };

  return (
    <Card className="border-slate-800/90 bg-slate-900/50">
      <SectionHeader
        eyebrow="Today"
        title="Daily goal tracking"
        description="Lightweight check-ins stored on this device—great for building rhythm."
      />

      <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Daily score</p>
            <p className="text-2xl font-bold tabular-nums text-white">
              {Math.round(overall)}%
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-[var(--fc-accent)]/50" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--fc-accent)] to-[var(--fc-accent-2)] transition-all duration-500"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        <li>
          <button
            type="button"
            onClick={toggleWorkout}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
              goals.workoutDone
                ? "border-[var(--fc-accent)]/40 bg-[var(--fc-accent)]/10 text-lime-50"
                : "border-slate-800 bg-slate-950/40 text-slate-200 hover:border-slate-700",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border",
                  goals.workoutDone
                    ? "border-[var(--fc-accent)]/50 bg-[var(--fc-accent)]/20"
                    : "border-slate-700 bg-slate-900",
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    goals.workoutDone ? "text-[var(--fc-accent)]" : "text-slate-600",
                  )}
                />
              </span>
              Complete today&apos;s workout
            </span>
            <span className="text-xs text-slate-500">
              {goals.workoutDone ? "Done" : "Tap to log"}
            </span>
          </button>
        </li>

        <li className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Droplets className="h-4 w-4 text-sky-400" />
              Hydration (cups)
            </span>
            <span className="text-xs text-slate-500">
              {goals.hydrationCups}/{HYDRATION_TARGET}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 border-slate-700 py-2 text-xs"
              onClick={() =>
                persist({
                  ...goals,
                  hydrationCups: Math.max(0, goals.hydrationCups - 1),
                })
              }
            >
              −
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 border-slate-700 py-2 text-xs"
              onClick={() =>
                persist({
                  ...goals,
                  hydrationCups: Math.min(
                    HYDRATION_TARGET,
                    goals.hydrationCups + 1,
                  ),
                })
              }
            >
              +
            </Button>
          </div>
        </li>

        <li className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Footprints className="h-4 w-4 text-amber-400" />
              Mobility / walk (min)
            </span>
            <span className="text-xs text-slate-500">
              {goals.mobilityMinutes}/{MOBILITY_TARGET}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 border-slate-700 py-2 text-xs"
              onClick={() =>
                persist({
                  ...goals,
                  mobilityMinutes: Math.max(0, goals.mobilityMinutes - 1),
                })
              }
            >
              −
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 border-slate-700 py-2 text-xs"
              onClick={() =>
                persist({
                  ...goals,
                  mobilityMinutes: Math.min(
                    MOBILITY_TARGET,
                    goals.mobilityMinutes + 1,
                  ),
                })
              }
            >
              +
            </Button>
          </div>
        </li>
      </ul>
    </Card>
  );
}
