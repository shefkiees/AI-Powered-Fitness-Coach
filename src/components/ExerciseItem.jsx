"use client";

import { Timer } from "lucide-react";

export default function ExerciseItem({ exercise }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--fc-border)] bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{exercise.name}</p>
          {exercise.notes ? (
            <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">{exercise.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold text-slate-200">
          <span className="rounded-full border border-[var(--fc-border)] bg-white/[0.05] px-3 py-1">
            {exercise.sets || "--"} sets
          </span>
          <span className="rounded-full border border-[var(--fc-border)] bg-white/[0.05] px-3 py-1">
            {exercise.reps || "--"}
          </span>
          {exercise.weight_kg !== null && exercise.weight_kg !== undefined ? (
            <span className="rounded-full border border-[var(--fc-border)] bg-white/[0.05] px-3 py-1">
              {exercise.weight_kg} kg
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--fc-border)] bg-white/[0.05] px-3 py-1">
            <Timer className="h-3 w-3" />
            {exercise.rest_seconds || 0}s
          </span>
        </div>
      </div>
    </div>
  );
}
