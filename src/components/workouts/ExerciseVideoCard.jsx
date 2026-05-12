"use client";

/* eslint-disable @next/next/no-img-element -- Workout media can be user/Supabase-hosted arbitrary URLs. */

import { motion } from "framer-motion";
import { Clock3, Dumbbell, Info, PlayCircle, Target } from "lucide-react";
import WorkoutVideoFallback from "@/src/components/workouts/WorkoutVideoFallback";
import {
  formatRest,
  getExerciseImage,
  getExerciseVideo,
  getRestSeconds,
  isYouTubeUrl,
  toYouTubeEmbed,
} from "@/src/components/workouts/mediaUtils";

function getTips(exercise) {
  const text = String(exercise?.instructions || exercise?.notes || "").trim();
  if (!text) return ["Move with control.", "Stop before form breaks."];
  const pieces = text
    .split(/[.;]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  return pieces.length ? pieces.slice(0, 3) : [text];
}

function VideoFrame({ exercise, workout }) {
  const video = getExerciseVideo(exercise);
  const image = getExerciseImage(exercise, workout);

  if (!video) {
    return (
      <WorkoutVideoFallback
        image={image}
        label="Video unavailable"
        helper="Use the image and coaching tips until a demo is added."
        className="h-full min-h-full rounded-[1.15rem]"
      />
    );
  }

  if (isYouTubeUrl(video)) {
    return (
      <iframe
        src={toYouTubeEmbed(video)}
        title={`${exercise?.name || "Exercise"} demo video`}
        className="h-full w-full rounded-[1.15rem]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={video}
      poster={image || undefined}
      controls
      playsInline
      className="h-full w-full rounded-[1.15rem] object-cover"
    />
  );
}

export default function ExerciseVideoCard({ exercise, workout, index = 0 }) {
  const image = getExerciseImage(exercise, workout);
  const restSeconds = getRestSeconds(exercise);
  const targetMuscles = exercise?.targetMuscles || exercise?.muscle_group || workout?.muscle_group || "Full body";
  const tips = getTips(exercise);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
      className="overflow-hidden rounded-[1.45rem] border border-[#e5e7eb] bg-white shadow-[0_18px_44px_rgba(17,24,39,0.08)]"
    >
      <div className="grid gap-0 lg:grid-cols-[0.8fr_1fr]">
        <div className="relative min-h-[230px] overflow-hidden bg-[#101827]">
          {image ? (
            <img src={image} alt={exercise?.name || "Exercise preview"} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center text-emerald-300">
              <Dumbbell className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.62))]" />
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/42 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
            Move {index + 1}
          </span>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-2xl font-black leading-tight text-white">{exercise?.name || "Exercise"}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-white/78">
              <span>{exercise?.sets || "--"} sets</span>
              <span>{exercise?.reps || "guided reps"}</span>
              <span>{formatRest(restSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="aspect-video overflow-hidden rounded-[1.15rem] bg-[#080b0a]">
            <VideoFrame exercise={exercise} workout={workout} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f3f4f6] p-3">
              <div className="flex items-center gap-2 text-[#6b7280]">
                <Target className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-[0.14em]">Muscles</span>
              </div>
              <p className="mt-1 text-sm font-black text-[#111827]">{targetMuscles}</p>
            </div>
            <div className="rounded-2xl bg-[#f3f4f6] p-3">
              <div className="flex items-center gap-2 text-[#6b7280]">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-[0.14em]">Rest</span>
              </div>
              <p className="mt-1 text-sm font-black text-[#111827]">{formatRest(restSeconds)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
            <div className="flex items-center gap-2 text-[#111827]">
              <Info className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-black">Tips</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4b5563]">
              {tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <PlayCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
