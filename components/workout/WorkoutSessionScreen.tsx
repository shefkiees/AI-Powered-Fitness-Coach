"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { BrandMark } from "@/components/brand/Brand";
import type { CatalogExercise } from "@/lib/workoutCatalog";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TimerDisplay } from "@/components/ui/TimerDisplay";
import { cn } from "@/lib/cn";

type Props = {
  exercise: CatalogExercise;
};

export function WorkoutSessionScreen({ exercise }: Props) {
  const config = useMemo(
    () => ({
      workSeconds: exercise.workSeconds,
      restSeconds: exercise.restSeconds,
      totalSets: exercise.sets,
    }),
    [exercise],
  );

  const {
    phase,
    currentSet,
    totalSets,
    remaining,
    running,
    phaseProgress,
    overallProgress,
    start,
    pause,
    reset,
  } = useWorkoutSession(config);

  const phaseLabel =
    phase === "work"
      ? "WORK"
      : phase === "rest"
        ? "REST"
        : phase === "done"
          ? "DONE"
          : "READY";

  const phaseSub =
    phase === "work"
      ? "Stay controlled and keep strong reps."
      : phase === "rest"
        ? "Breathe and prepare for the next effort."
        : phase === "done"
          ? "Session complete. Strong work."
          : "Press start when you are set.";

  return (
    <div className="pulse-page min-h-screen text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_48%_6%,rgba(184,245,61,0.16),transparent_28%)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-[var(--fc-border)] bg-[rgba(16,19,13,0.82)] px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link
            href="/workout"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Workouts
          </Link>
          <span className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)] sm:inline">
            Guided session
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-[var(--fc-border)] bg-[rgba(26,31,20,0.76)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)]">
                {exercise.type}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
                {exercise.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--fc-muted)]">
                {exercise.description}
              </p>
            </div>
            <BrandMark tileClassName="h-12 w-12 rounded-2xl border-white/8 bg-black/15" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
            <div className="rounded-[1.5rem] border border-[var(--fc-border)] bg-black/15 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)]">
                    Live countdown
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-xs font-semibold uppercase tracking-[0.28em]",
                      phase === "work" && "text-[var(--fc-accent)]",
                      phase === "rest" && "text-slate-300",
                      phase === "done" && "text-white",
                      phase === "idle" && "text-slate-500",
                    )}
                  >
                    {phaseLabel}
                  </p>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)]">
                  Set {Math.min(currentSet, totalSets)} / {totalSets}
                </p>
              </div>

              <div className="mt-10 flex justify-center">
                <div className="flex h-70 w-70 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[radial-gradient(circle,rgba(184,245,61,0.08),rgba(0,0,0,0.12))] shadow-[inset_0_0_30px_rgba(255,255,255,0.03)]">
                  {phase === "done" ? (
                    <span className="text-6xl font-bold text-white sm:text-7xl">
                      00
                    </span>
                  ) : (
                    <TimerDisplay seconds={remaining} />
                  )}
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-[var(--fc-muted)]">{phaseSub}</p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {!running ? (
                  <Button
                    type="button"
                    className="min-w-[150px] gap-2"
                    onClick={() => {
                      if (phase === "done") reset();
                      start();
                    }}
                  >
                    <Play className="h-4 w-4" />
                    {phase === "idle"
                      ? "Start"
                      : phase === "done"
                        ? "Again"
                        : "Resume"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-w-[150px] text-white"
                    onClick={pause}
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}

                <Button type="button" variant="ghost" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-[var(--fc-border)] bg-black/15 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)]">
                  Session progress
                </p>
                <div className="mt-4">
                  <ProgressBar value={overallProgress} label="Overall session" showValue />
                </div>
                <div className="mt-5">
                  <ProgressBar
                    value={phaseProgress * 100}
                    max={100}
                    label={phase === "rest" ? "Rest block" : "Current block"}
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--fc-border)] bg-black/15 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)]">
                  Session summary
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    `${exercise.sets} total sets`,
                    `${exercise.workSeconds} seconds of effort`,
                    `${exercise.restSeconds} seconds of recovery`,
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[var(--fc-border)] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--fc-border)] bg-white/[0.03] p-5">
                <p className="text-sm leading-7 text-[var(--fc-muted)]">
                  Stop if you feel sharp pain, dizziness, or chest discomfort.
                  This app does not provide medical advice.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
