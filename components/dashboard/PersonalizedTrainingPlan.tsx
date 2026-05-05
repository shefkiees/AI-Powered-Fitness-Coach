"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Flame,
  RefreshCw,
  Repeat,
  Snowflake,
  Timer,
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
  if (title === "Warm-up") {
    return <Flame className="h-5 w-5 text-amber-400" />;
  }
  if (title === "Cooldown") {
    return <Snowflake className="h-5 w-5 text-sky-400" />;
  }
  return <Dumbbell className="h-5 w-5 text-[var(--fc-accent)]" />;
}

function ExerciseCard({
  exercise,
  index,
}: {
  exercise: WorkoutExercise;
  index: number;
}) {
  const imageUrl = getExerciseImageUrl(exercise.name);
  const alt = getExerciseImageAlt(exercise.name);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-black/8 bg-white/74",
        "transition duration-200 hover:border-black/12 hover:bg-white/92",
      )}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-black/10">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h4 className="font-semibold text-[#17181b]">{exercise.name}</h4>
        <p className="mt-2 text-sm leading-7 text-[#5f664f]">
          {exercise.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#414833]">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-[#f7f3e7] px-2.5 py-1">
            <Repeat className="h-3.5 w-3.5 text-[var(--fc-accent)]" />
            {exercise.sets} sets
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-[#f7f3e7] px-2.5 py-1">
            <Dumbbell className="h-3.5 w-3.5 text-[var(--fc-accent)]" />
            {exercise.reps} reps
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-[#f7f3e7] px-2.5 py-1">
            <Timer className="h-3.5 w-3.5 text-[var(--fc-accent)]" />
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
  const plan = useMemo(() => buildWorkoutPlan(profile, nonce), [profile, nonce]);

  const goalLabel =
    {
      lose_weight: "Fat loss / cardio emphasis",
      build_muscle: "Strength and hypertrophy",
      stay_fit: "Balanced conditioning",
    }[normalizeGoal(profile.goal)] ?? "Balanced conditioning";

  const activityLabel =
    {
      low: "Low activity baseline",
      moderate: "Moderate activity baseline",
      high: "High activity baseline",
    }[normalizeActivityLevel(profile.activity_level)];

  const preference = normalizeWorkoutPreference(profile.workout_preference);
  const preferenceLabel =
    WORKOUT_PREFERENCE_LABELS[preference] ?? WORKOUT_PREFERENCE_LABELS.full_body;

  return (
    <Card className="border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,243,231,0.98)_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#66704c]">
            AI workout plan
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#17181b]">
            This week&apos;s sessions
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[#5e654f]">
            <span className="text-[#17181b]">{goalLabel}</span>
            {" | "}
            <span className="text-[#17181b]">{activityLabel}</span>
            {" | "}
            <span className="text-[#17181b]">Focus: {preferenceLabel}</span>.
            Volume scales with your intensity. Stop if you feel sharp pain.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex rounded-full border border-black/8 bg-[#f7f3e7] px-3 py-1 text-xs font-semibold text-[#303422]">
              Difficulty: {plan.difficulty}
            </div>
            <div className="inline-flex rounded-full border border-black/8 bg-[#f7f3e7] px-3 py-1 text-xs font-semibold text-[#303422]">
              {plan.sections.length} training blocks
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="shrink-0 gap-2 rounded-full border-[#111214] bg-[#111214] text-white hover:bg-[#1c1d20]"
          onClick={() => setNonce((value) => value + 1)}
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
            className="scroll-mt-4 rounded-3xl border border-black/8 bg-white/66 p-4 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-black/8 pb-3">
              <SectionIcon title={section.title} />
              <h3 className="text-lg font-semibold tracking-tight text-[#17181b]">
                {section.title}
              </h3>
              <span className="ml-auto rounded-full border border-black/8 bg-[#f7f3e7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#6a734d]">
                {section.exercises.length} moves
              </span>
            </div>
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={`${exercise.name}-${index}`}
                  exercise={exercise}
                  index={index}
                />
              ))}
            </div>
          </section>
        ))}
      </motion.div>
    </Card>
  );
}
