"use client";

import { Calendar, Ruler, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";
import { GOAL_LABELS, ACTIVITY_LABELS } from "@/lib/profileDisplay";

function formatBmi(weightKg: number, heightCm: number): string {
  const h = heightCm / 100;
  if (h <= 0) return "—";
  const bmi = weightKg / (h * h);
  return bmi.toFixed(1);
}

type Props = {
  profile?: FitnessProfileRow | null;
};

export function ProgressOverview({ profile }: Props) {
  const bmi =
    profile && profile.weight > 0 && profile.height > 0
      ? formatBmi(profile.weight, profile.height)
      : null;

  const activityLabel = profile
    ? ACTIVITY_LABELS[profile.activity_level] ??
      profile.activity_level.replace(/_/g, " ")
    : null;

  const goalLabel = profile
    ? GOAL_LABELS[profile.goal] ?? profile.goal.replace(/_/g, " ")
    : null;

  return (
    <Card className="border-slate-800/60 bg-slate-900/40 shadow-lg shadow-black/15">
      <SectionHeader
        eyebrow="Body & context"
        title="Health markers"
        description="Static snapshot from your profile—use it alongside your plan and coach chat."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 transition hover:border-[var(--fc-accent)]/25">
          <Target className="h-5 w-5 text-[var(--fc-accent)]" />
          <p className="mt-2 text-sm font-semibold capitalize text-slate-200">
            {goalLabel ?? "—"}
          </p>
          <p className="text-xs text-slate-500">Training goal</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 transition hover:border-[var(--fc-accent)]/25">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <p className="mt-2 text-sm font-semibold capitalize text-slate-200">
            {activityLabel ?? "—"}
          </p>
          <p className="text-xs text-slate-500">Activity level</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 transition hover:border-[var(--fc-accent)]/25">
          <Calendar className="h-5 w-5 text-sky-400" />
          <p className="mt-2 text-2xl font-bold text-white">{bmi ?? "—"}</p>
          <p className="text-xs text-slate-500">
            {bmi ? "BMI (estimate)" : "Add weight & height"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 transition hover:border-[var(--fc-accent)]/25">
          <Ruler className="h-5 w-5 text-amber-400/90" />
          <p className="mt-2 text-sm font-semibold text-slate-200">
            {profile
              ? `${profile.weight} kg · ${profile.height} cm`
              : "—"}
          </p>
          <p className="text-xs text-slate-500">Weight & height</p>
        </div>
      </div>
    </Card>
  );
}
