"use client";

import { useCallback, useState } from "react";
import { Check, Droplets, Footprints } from "lucide-react";
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

function GoalMeter({
  icon: Icon,
  title,
  current,
  target,
  onDecrement,
  onIncrement,
}: {
  icon: typeof Droplets;
  title: string;
  current: number;
  target: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const percent = Math.min(100, (current / target) * 100);

  return (
    <li className="rounded-[1.35rem] border border-black/8 bg-[#f7f3e7] px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#232420]">
          <Icon className="h-4 w-4 text-[var(--fc-accent)]" />
          {title}
        </span>
        <span className="text-xs text-[#677150]">
          {current}/{target}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
        <div
          className="h-full rounded-full bg-[var(--fc-accent)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border-black/8 bg-white text-xs text-[#17181b] hover:bg-white"
          onClick={onDecrement}
        >
          -
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border-black/8 bg-[#111214] py-2 text-xs text-white hover:bg-[#1c1d20]"
          onClick={onIncrement}
        >
          +
        </Button>
      </div>
    </li>
  );
}

type Props = {
  userId: string;
  onGoalsChange?: (goals: DailyGoalsState) => void;
};

export function DailyGoalsCard({ userId, onGoalsChange }: Props) {
  const [goals, setGoals] = useState<DailyGoalsState>(() => readDailyGoals(userId));

  const persist = useCallback(
    (next: DailyGoalsState) => {
      writeDailyGoals(userId, next);
      setGoals(next);
      onGoalsChange?.(next);
    },
    [userId, onGoalsChange],
  );

  const workoutPct = goals.workoutDone ? 100 : 0;
  const hydrationPct = Math.min(100, (goals.hydrationCups / HYDRATION_TARGET) * 100);
  const mobilityPct = Math.min(100, (goals.mobilityMinutes / MOBILITY_TARGET) * 100);
  const overall = (workoutPct + hydrationPct + mobilityPct) / 3;

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
    <Card className="border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,243,231,0.98)_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.08)]">
      <SectionHeader
        eyebrow="Today"
        title="Daily goals"
        description="Simple actions that keep momentum visible without crowding the dashboard."
        eyebrowClassName="text-[#677150]"
        titleClassName="text-[#17181b]"
        descriptionClassName="text-[#5d654f]"
      />

      <div className="mt-6 rounded-3xl border border-black/8 bg-white/76 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#69734c]">
              Completion
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#17181b]">
              {Math.round(overall)}%
            </p>
          </div>
          <span className="rounded-full border border-black/8 bg-[#f7f3e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#68714f]">
            Daily rhythm
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
          <div
            className="h-full rounded-full bg-[var(--fc-accent)] transition-all duration-500"
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
              "flex w-full items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left text-sm font-semibold transition",
              goals.workoutDone
                ? "border-black/10 bg-[var(--fc-accent)]/28 text-[#17181b]"
                : "border-black/8 bg-[#f7f3e7] text-[#232420] hover:border-black/12",
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-[0.95rem] border",
                  goals.workoutDone
                    ? "border-black/10 bg-[#111214] text-[#ecfb94]"
                    : "border-black/8 bg-white",
                )}
              >
                <Check className="h-4 w-4" />
              </span>
              Complete today&apos;s workout
            </span>
            <span className="text-xs text-[#69724f]">
              {goals.workoutDone ? "Done" : "Tap to log"}
            </span>
          </button>
        </li>

        <GoalMeter
          icon={Droplets}
          title="Hydration"
          current={goals.hydrationCups}
          target={HYDRATION_TARGET}
          onDecrement={() =>
            persist({
              ...goals,
              hydrationCups: Math.max(0, goals.hydrationCups - 1),
            })
          }
          onIncrement={() =>
            persist({
              ...goals,
              hydrationCups: Math.min(HYDRATION_TARGET, goals.hydrationCups + 1),
            })
          }
        />

        <GoalMeter
          icon={Footprints}
          title="Mobility / walk"
          current={goals.mobilityMinutes}
          target={MOBILITY_TARGET}
          onDecrement={() =>
            persist({
              ...goals,
              mobilityMinutes: Math.max(0, goals.mobilityMinutes - 1),
            })
          }
          onIncrement={() =>
            persist({
              ...goals,
              mobilityMinutes: Math.min(MOBILITY_TARGET, goals.mobilityMinutes + 1),
            })
          }
        />
      </ul>
    </Card>
  );
}
