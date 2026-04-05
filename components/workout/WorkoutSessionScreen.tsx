"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
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
      ? "GO"
      : phase === "rest"
        ? "REST"
        : phase === "done"
          ? "DONE"
          : "READY";

  const phaseSub =
    phase === "work"
      ? "Hold quality reps for the full block"
      : phase === "rest"
        ? "Breathe; you earned this pause"
        : phase === "done"
          ? "Session complete—nice work"
          : "Tap start when you’re set";

  return (
    <div className="min-h-screen bg-[var(--fc-bg-page)] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(163,230,53,0.1),transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href="/workout"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-[var(--fc-accent)]/35 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Exercises
          </Link>
          <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-slate-500 sm:inline">
            Guided session
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/90">
                {exercise.type}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {exercise.name}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                {exercise.description}
              </p>
            </div>
            <Sparkles className="h-8 w-8 shrink-0 text-[var(--fc-accent)]/50" />
          </div>

          <div className="mt-8">
            <ProgressBar
              value={overallProgress}
              label="Session progress"
              showValue
            />
          </div>

          <div className="mt-6">
            <ProgressBar
              value={phaseProgress * 100}
              max={100}
              label={
                phase === "rest"
                  ? "Rest block"
                  : phase === "work"
                    ? "Current work block"
                    : "Timer"
              }
              fillClassName={
                phase === "rest"
                  ? "from-sky-500 to-cyan-400"
                  : undefined
              }
            />
          </div>

          <div className="mt-10 text-center">
            <p
              className={cn(
                "text-xs font-bold uppercase tracking-[0.35em]",
                phase === "work" && "text-[var(--fc-accent)]",
                phase === "rest" && "text-sky-300",
                phase === "done" && "text-emerald-300",
                phase === "idle" && "text-slate-500",
              )}
            >
              {phaseLabel}
            </p>
            <p className="mt-2 text-sm text-slate-500">{phaseSub}</p>

            <div className="mt-6">
              {phase === "done" ? (
                <span className="font-mono text-6xl font-bold text-white sm:text-7xl">
                  —
                </span>
              ) : (
                <TimerDisplay seconds={remaining} />
              )}
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Set{" "}
              <span className="font-semibold text-white">
                {Math.min(currentSet, totalSets)}
              </span>{" "}
              / {totalSets}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {!running ? (
              <Button
                type="button"
                className="min-w-[140px] gap-2"
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
                className="min-w-[140px] gap-2 border-slate-600"
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

          <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-600">
            Stop if you feel sharp pain, dizziness, or chest discomfort. This
            app does not provide medical advice.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
