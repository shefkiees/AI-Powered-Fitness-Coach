"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Flame,
  RefreshCw,
  Snowflake,
  Timer,
  Repeat,
} from "lucide-react";
import type { FitnessProfileRow } from "@/lib/fitnessProfiles";
import {
  buildWorkoutPlan,
  normalizeActivityLevel,
  normalizeGoal,
  normalizeWorkoutPreference,
  type WorkoutExercise,
  type WorkoutSection,
} from "@/lib/workoutPlan";
import { WORKOUT_PREFERENCE_LABELS } from "@/lib/profileOptions";
import {
  getExerciseImageAlt,
  getExerciseImageUrl,
} from "@/lib/exerciseImages";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function SectionIcon({ title }: { title: WorkoutSection["title"] }) {
  if (title === "Warm-up")
    return <Flame className="h-5 w-5 text-amber-400" />;
  if (title === "Cooldown")
    return <Snowflake className="h-5 w-5 text-sky-400" />;
  return <Dumbbell className="h-5 w-5 text-lime-400" />;
}

function ExerciseCard({
  exercise,
  index,
}: {
  exercise: WorkoutExercise;
  index: number;
}) {
  const img = getExerciseImageUrl(exercise.name);
  const alt = getExerciseImageAlt(exercise.name);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/50",
        "transition duration-200 hover:-translate-y-0.5 hover:border-lime-500/40 hover:shadow-lg hover:shadow-lime-900/15",
      )}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-slate-900">
        <Image
          src={img}
          alt={alt}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h4 className="font-semibold text-white group-hover:text-lime-100">
          {exercise.name}
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
          {exercise.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1">
            <Repeat className="h-3.5 w-3.5 text-lime-400" />
            {exercise.sets} sets
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1">
            <Dumbbell className="h-3.5 w-3.5 text-lime-400" />
            {exercise.reps} reps
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1">
            <Timer className="h-3.5 w-3.5 text-lime-400" />
            Rest {exercise.rest}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

type Props = {
  profile: FitnessProfileRow;
};

export function PersonalizedTrainingPlan({ profile }: Props) {
  const [nonce, setNonce] = useState(0);

  const plan = useMemo(
    () => buildWorkoutPlan(profile, nonce),
    [profile, nonce],
  );

  const goalLabel =
    {
      lose_weight: "Fat loss / cardio emphasis",
      build_muscle: "Strength & hypertrophy",
      stay_fit: "Balanced conditioning",
    }[normalizeGoal(profile.goal)] ?? "Balanced conditioning";

  const activityLabel =
    {
      low: "Low activity baseline",
      moderate: "Moderate activity baseline",
      high: "High activity baseline",
    }[normalizeActivityLevel(profile.activity_level)];

  const pref = normalizeWorkoutPreference(profile.workout_preference);
  const prefLabel =
    WORKOUT_PREFERENCE_LABELS[pref] ??
    WORKOUT_PREFERENCE_LABELS.full_body;

  return (
    <Card className="border-lime-500/20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400/90">
            AI workout plan
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            This week&apos;s sessions
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            <span className="text-slate-300">{goalLabel}</span>
            {" · "}
            <span className="text-slate-300">{activityLabel}</span>
            {" · "}
            <span className="text-lime-200/90">Focus: {prefLabel}</span>
            . Volume scales with your intensity—stop if you feel sharp pain.
          </p>
          <div className="mt-3 inline-flex rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1 text-xs font-semibold text-lime-200">
            Difficulty: {plan.difficulty}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-2"
          onClick={() => setNonce((n) => n + 1)}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh plan
        </Button>
      </div>

      <motion.div
        key={nonce}
        className="mt-10 space-y-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {plan.sections.map((section) => (
          <section
            key={section.title}
            className="scroll-mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/25 p-4 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-slate-800/90 pb-3">
              <SectionIcon title={section.title} />
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {section.title}
              </h3>
            </div>
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.exercises.map((ex, i) => (
                <ExerciseCard key={`${ex.name}-${i}`} exercise={ex} index={i} />
              ))}
            </div>
          </section>
        ))}
      </motion.div>
    </Card>
  );
}
