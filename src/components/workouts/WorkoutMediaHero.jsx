"use client";

import { motion } from "framer-motion";
import { Clock3, Flame, Sparkles, Target } from "lucide-react";
import WorkoutVideoFallback from "@/src/components/workouts/WorkoutVideoFallback";
import {
  estimateWorkoutCalories,
  formatRest,
  getDisplayTitle,
  getWorkoutImage,
  getWorkoutPreviewVideo,
  isYouTubeUrl,
  splitMuscles,
  toYouTubeEmbed,
} from "@/src/components/workouts/mediaUtils";

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-emerald-300" />
        <span className="text-sm font-black">{value}</span>
      </div>
      <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/48">{label}</p>
    </div>
  );
}

export default function WorkoutMediaHero({ workout, completedCount = 0 }) {
  const coverImage = getWorkoutImage(workout);
  const previewVideo = getWorkoutPreviewVideo(workout);
  const muscles = splitMuscles(workout?.muscle_group, workout?.exercises);
  const title = getDisplayTitle(workout?.title);

  return (
    <section className="relative overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#050806] text-white shadow-[0_28px_80px_rgba(0,0,0,0.36)]">
      <div className="relative aspect-[16/9] min-h-[300px] overflow-hidden bg-black sm:min-h-[380px]">
        {previewVideo ? (
          isYouTubeUrl(previewVideo) ? (
            <iframe
              src={toYouTubeEmbed(previewVideo, { autoplay: true })}
              title={`${title} preview video`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              className="h-full w-full object-cover"
              poster={coverImage || undefined}
              autoPlay
              muted
              loop
              playsInline
              controls
            >
              <source src={previewVideo} />
            </video>
          )
        ) : (
          <WorkoutVideoFallback
            image={coverImage}
            label="Preview video coming soon"
            helper="This workout still includes exercise demos and step-by-step guidance below."
            className="h-full min-h-full"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.28)_42%,rgba(0,0,0,0.88)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/14 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-100">
                {workout?.category || "Workout"}
              </span>
              {completedCount > 0 ? (
                <span className="rounded-full border border-white/12 bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white">
                  Completed {completedCount}x
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 max-w-3xl text-3xl font-black leading-[0.98] tracking-normal sm:text-5xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66 sm:text-base">
              {workout?.description || "A structured session with clear pacing, media support, and practical coaching cues."}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <Stat icon={Clock3} value={`${workout?.duration_minutes || "--"} min`} label="Duration" />
              <Stat icon={Sparkles} value={workout?.difficulty || "Beginner"} label="Level" />
              <Stat icon={Flame} value={`${estimateWorkoutCalories(workout)} kcal`} label="Estimate" />
              <Stat icon={Target} value={muscles[0] || "Full body"} label="Focus" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/62">
              {muscles.map((muscle) => (
                <span key={muscle} className="rounded-full bg-white/10 px-3 py-1.5">
                  {muscle}
                </span>
              ))}
              {workout?.exercises?.[0]?.rest_seconds ? (
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  {formatRest(workout.exercises[0].rest_seconds)}
                </span>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
