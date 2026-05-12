"use client";

/* eslint-disable @next/next/no-img-element -- Workout media can be user/Supabase-hosted arbitrary URLs. */

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Flame, Heart, PlayCircle, Sparkles, Target } from "lucide-react";
import {
  estimateWorkoutCalories,
  getDayLabel,
  getDisplayTitle,
  getWorkoutImage,
  getWorkoutPreviewVideo,
  isYouTubeUrl,
  splitMuscles,
} from "@/src/components/workouts/mediaUtils";

function CardMedia({ workout }) {
  const image = getWorkoutImage(workout);
  const video = getWorkoutPreviewVideo(workout);

  if (video && !isYouTubeUrl(video)) {
    return (
      <video
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        src={video}
        poster={image || undefined}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  if (image) {
    return (
      <img
        src={image}
        alt={workout?.title || "Workout"}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
      />
    );
  }

  return (
    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.26),transparent_36%),linear-gradient(145deg,#111827,#020617)] text-emerald-300">
      <Target className="h-12 w-12" />
    </div>
  );
}

function Stat({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-black text-[#4b5563]">
      <Icon className="h-3.5 w-3.5 text-emerald-600" />
      {label}
    </span>
  );
}

export default function WorkoutCard({
  workout,
  preference,
  completedRows = [],
  recommended,
  busy,
  onOpen,
  onToggleFavorite,
}) {
  const title = getDisplayTitle(workout?.title);
  const dayLabel = getDayLabel(workout?.title);
  const muscles = splitMuscles(workout?.muscle_group, workout?.exercises);
  const completed = completedRows.length > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.28 }}
      className="group overflow-hidden rounded-[1.45rem] border border-white bg-white shadow-[0_18px_42px_rgba(17,24,39,0.08)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#111827] text-left">
        <CardMedia workout={workout} />
        <button
          type="button"
          onClick={() => onOpen(workout)}
          className="absolute inset-0 z-10"
          aria-label={`Open ${title}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.24)_42%,rgba(0,0,0,0.82)_100%)]" />

        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-black/38 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl">
            {workout?.category || "Workout"}
          </span>
          {dayLabel ? (
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/18 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-emerald-50 backdrop-blur-xl">
              {dayLabel}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(workout);
          }}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/38 text-white backdrop-blur-xl transition hover:bg-white hover:text-[#111827] disabled:opacity-60"
          aria-label={preference?.is_favorite ? "Remove favorite" : "Save favorite"}
        >
          <Heart className={`h-4 w-4 ${preference?.is_favorite ? "fill-current text-rose-400" : ""}`} />
        </button>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4">
          {completed ? (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-300 px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#052e16]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          ) : recommended ? (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-white">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              Recommended
            </span>
          ) : null}
          <p className="line-clamp-2 text-2xl font-black leading-[1.02] text-white">{title}</p>
        </div>
      </div>

      <div className="p-4">
        <button type="button" onClick={() => onOpen(workout)} className="block w-full text-left">
          <p className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-6 text-[#6b7280]">
            {workout?.description || "Structured training with clear pacing and visual guidance."}
          </p>
        </button>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Stat icon={Clock3} label={`${workout?.duration_minutes || "--"} min`} />
          <Stat icon={Sparkles} label={workout?.difficulty || "Beginner"} />
          <Stat icon={Flame} label={`${estimateWorkoutCalories(workout)} kcal`} />
        </div>

        <div className="mt-4">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#9ca3af]">Target muscles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {muscles.map((muscle) => (
              <span key={muscle} className="rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-black text-[#374151]">
                {muscle}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/workout/session?workout=${workout.id}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.18)] transition hover:-translate-y-0.5 hover:bg-[#030712]"
          >
            <PlayCircle className="h-4 w-4 text-emerald-300" />
            Start Workout
          </Link>
          {completedRows.length > 1 ? (
            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
              {completedRows.length}x
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
