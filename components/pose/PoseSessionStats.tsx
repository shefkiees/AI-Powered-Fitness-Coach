"use client";

import { Target, Timer } from "lucide-react";
import { formatDuration } from "@/lib/pose/poseSessionSummary";

export type PoseSessionStatsProps = {
  totalReps: number;
  durationSeconds: number;
  averageScore: number;
};

export function PoseSessionStats({ totalReps, durationSeconds, averageScore }: PoseSessionStatsProps) {
  return (
    <>
      <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
        <div className="flex items-center gap-2 text-[var(--fc-accent)]">
          <Target className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em]">Total reps</p>
        </div>
        <p className="mt-2 text-3xl font-black text-[var(--fc-accent-strong)]">{totalReps}</p>
        <p className="mt-1 text-xs text-[var(--fc-muted)]">Across all detected exercises</p>
      </div>
      <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
        <div className="flex items-center gap-2 text-[var(--fc-accent)]">
          <Timer className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em]">Duration</p>
        </div>
        <p className="mt-2 text-3xl font-black text-white">{formatDuration(durationSeconds)}</p>
        <p className="mt-1 text-xs text-[var(--fc-muted)]">Form score {Math.round(averageScore) || "--"}</p>
      </div>
    </>
  );
}
