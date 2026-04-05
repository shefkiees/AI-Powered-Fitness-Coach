"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getExerciseById } from "@/lib/workoutCatalog";
import { WorkoutSessionScreen } from "@/components/workout/WorkoutSessionScreen";
import { Card } from "@/components/ui/Card";

function SessionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("exercise") ?? "";
  const exercise = useMemo(() => getExerciseById(id), [id]);

  if (!exercise) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--fc-bg-page)] px-4">
        <Card className="max-w-md border-white/10 bg-white/[0.04] text-center backdrop-blur-xl">
          <p className="font-semibold text-white">Exercise not found</p>
          <p className="mt-2 text-sm text-slate-400">
            Choose a workout from the catalog to start a guided timer.
          </p>
          <Link
            href="/workout"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-lime-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-lime-900/25 transition hover:brightness-105"
          >
            Back to workouts
          </Link>
        </Card>
      </div>
    );
  }

  return <WorkoutSessionScreen key={exercise.id} exercise={exercise} />;
}

export default function WorkoutSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--fc-bg-page)] text-slate-500">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--fc-accent)]/30 border-t-[var(--fc-accent)]" />
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
