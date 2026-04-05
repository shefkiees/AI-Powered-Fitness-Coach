"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Dumbbell, HeartPulse, Sparkles, Wind } from "lucide-react";
import {
  WORKOUT_CATALOG,
  WORKOUT_TYPE_LABELS,
  type WorkoutType,
} from "@/lib/workoutCatalog";
import { FitnessAppShell } from "@/components/layout/FitnessAppShell";
import { cn } from "@/lib/cn";

const TYPE_ICONS: Record<WorkoutType, typeof Dumbbell> = {
  strength: Dumbbell,
  cardio: HeartPulse,
  flexibility: Wind,
};

export default function ChooseWorkoutPage() {
  const [type, setType] = useState<WorkoutType>("strength");

  const list = useMemo(
    () => WORKOUT_CATALOG.filter((e) => e.type === type),
    [type],
  );

  return (
    <FitnessAppShell title="Choose workout" subtitle="Pick a focus, then launch a timed session">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 transition hover:border-[var(--fc-accent)]/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Hub
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["strength", "cardio", "flexibility"] as const).map((t) => {
          const Icon = TYPE_ICONS[t];
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition",
                active
                  ? "border-[var(--fc-accent)]/45 bg-[var(--fc-accent)]/10 text-white shadow-lg shadow-lime-900/20"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border",
                  active
                    ? "border-[var(--fc-accent)]/40 bg-slate-950/40 text-[var(--fc-accent)]"
                    : "border-white/10 bg-slate-950/50 text-slate-500",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold">
                  {WORKOUT_TYPE_LABELS[t]}
                </span>
                <span className="text-xs text-slate-500">
                  {t === "strength"
                    ? "Power & control"
                    : t === "cardio"
                      ? "Heart rate up"
                      : "Mobility & recovery"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Exercises
          </h2>
        </div>
        <ul className="space-y-3">
          {list.map((ex, i) => (
            <motion.li
              key={ex.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/workout/session?exercise=${encodeURIComponent(ex.id)}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[var(--fc-accent)]/35 hover:bg-white/[0.07]"
              >
                <div>
                  <p className="font-semibold text-white">{ex.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ex.sets} sets · {ex.workSeconds}s work · {ex.restSeconds}s
                    rest
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                    {ex.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-[var(--fc-accent)]" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </FitnessAppShell>
  );
}
