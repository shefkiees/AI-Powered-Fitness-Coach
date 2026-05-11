"use client";

import { ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AutoExercise, ExerciseTotal } from "@/lib/pose/poseTypes";
import { activeTotals, formatDuration } from "@/lib/pose/poseSessionSummary";

export type PoseExerciseTotalsProps = {
  totals: Partial<Record<AutoExercise, ExerciseTotal>>;
  detectedExercise: AutoExercise;
};

export function PoseExerciseTotals({ totals, detectedExercise }: PoseExerciseTotalsProps) {
  return (
    <div className="fc-glass rounded-[1.75rem] p-5">
      <div className="flex items-center gap-2 text-[var(--fc-accent)]">
        <ListChecks className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em]">Session totals</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {activeTotals(totals).map((total) => (
          <div
            key={total.exercise}
            className={cn(
              "rounded-2xl border p-4 transition",
              detectedExercise === total.exercise
                ? "border-[var(--fc-accent)]/45 bg-[var(--fc-accent)]/12"
                : "border-[var(--fc-border)] bg-black/20",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black text-white">{total.label}</p>
              {detectedExercise === total.exercise ? (
                <span className="rounded-full bg-[var(--fc-accent)] px-2 py-0.5 text-[10px] font-black text-[var(--fc-accent-ink)]">
                  Live
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-3xl font-black text-[var(--fc-accent-strong)]">
              {total.exercise === "plank" ? formatDuration(total.hold_seconds) : total.reps}
            </p>
            <p className="mt-1 text-xs text-[var(--fc-muted)]">
              {total.exercise === "plank" ? "hold duration" : "completed reps"}
              {total.average_form_score ? ` - ${total.average_form_score}/100` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
