"use client";

import { Activity, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";
import { compactPhaseLabel, phaseLabel } from "@/lib/pose/poseSessionSummary";

export type PoseTrackingStatusProps = {
  detectedLabel: string;
  confidence: number;
  phase?: string;
  headline?: string;
  score?: number;
  totalReps?: number;
  visibleCount?: number;
  setupMessages?: string[];
  tips?: string[];
  status?: "good" | "adjust" | "off_frame";
  compact?: boolean;
};

export function PoseTrackingStatus({
  detectedLabel,
  confidence,
  phase,
  headline,
  score,
  totalReps,
  visibleCount,
  setupMessages = [],
  tips = [],
  status = "off_frame",
  compact = false,
}: PoseTrackingStatusProps) {
  if (!compact) {
    return (
      <>
        <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[var(--fc-accent)]">
            <ScanLine className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Detected</p>
          </div>
          <p className="mt-2 text-xl font-black text-white">{detectedLabel}</p>
          <p className="mt-1 text-xs text-[var(--fc-muted)]">{confidence}% confidence</p>
        </div>
        <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[var(--fc-accent)]">
            <Activity className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Phase</p>
          </div>
          <p className="mt-2 text-xl font-black text-white">{phaseLabel(phase)}</p>
          <p className="mt-1 text-xs text-[var(--fc-muted)]">{headline || "Waiting for movement"}</p>
        </div>
      </>
    );
  }

  return (
    <div
      className={cn(
        "absolute left-2 right-2 top-2 rounded-xl border px-3 py-2 text-left shadow-lg backdrop-blur-md sm:left-auto sm:right-2 sm:max-w-sm",
        status === "good"
          ? "border-emerald-500/40 bg-emerald-950/75 text-emerald-50"
          : status === "adjust"
            ? "border-amber-500/40 bg-amber-950/75 text-amber-50"
            : "border-slate-600/60 bg-slate-950/80 text-slate-200",
      )}
    >
      <div className="flex items-center gap-2">
        <ScanLine className="h-3.5 w-3.5" />
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          Auto-detected exercise
        </p>
      </div>
      <p className="mt-0.5 text-sm font-bold">{detectedLabel}</p>
      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
        <span className="rounded-full bg-black/25 px-2 py-0.5">{compactPhaseLabel(phase)}</span>
        <span className="rounded-full bg-black/25 px-2 py-0.5">Score {score || "--"}</span>
        <span className="rounded-full bg-black/25 px-2 py-0.5">Confidence {confidence}%</span>
      </div>
      {setupMessages.length ? (
        <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold opacity-90">
          {setupMessages.slice(0, 3).map((message) => (
            <span key={message} className="rounded-full bg-black/20 px-2 py-0.5">
              {message}
            </span>
          ))}
        </div>
      ) : null}
      {headline && headline !== detectedLabel ? (
        <p className="mt-1 text-xs font-bold opacity-95">{headline}</p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
        <span className="rounded-full bg-black/25 px-2 py-0.5">Reps {totalReps ?? 0}</span>
        <span className="rounded-full bg-black/25 px-2 py-0.5">Visible {visibleCount ?? 0}/17</span>
      </div>
      <ul className="mt-1 list-inside list-disc text-xs leading-snug opacity-95">
        {tips.map((tip, index) => (
          <li key={`${index}-${tip.slice(0, 24)}`}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
