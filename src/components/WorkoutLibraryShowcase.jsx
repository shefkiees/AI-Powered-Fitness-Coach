"use client";

/* eslint-disable @next/next/no-img-element -- Workout cards use local and Supabase-style arbitrary media URLs. */

import Link from "next/link";
import { ArrowUpRight, Clock3, Flame, Heart, CheckCircle2, Sparkles } from "lucide-react";

const CARD_COPY = [
  {
    title: "Cardio",
    badge: "Cardio",
    description: "Low-friction intervals for stamina and energy.",
    duration: 30,
    calories: 420,
    image: "/pulse-assets/workout-cardio.jpg",
  },
  {
    title: "Squats",
    badge: "Squats",
    description: "Multi-joint movement for lower body strength and core stability.",
    duration: 15,
    calories: 250,
    image: "/pulse-assets/workout-strength.jpg",
  },
  {
    title: "Boxing",
    badge: "Boxing",
    description: "Sharp rounds with footwork, power, and recovery.",
    duration: 35,
    calories: 480,
    image: "/pulse-assets/workout-boxing.jpg",
  },
  {
    title: "Push-Ups",
    badge: "Push-Ups",
    description: "A full-body builder for upper body press and core endurance.",
    duration: 12,
    calories: 210,
    image: "/pulse-assets/hero-athlete.jpg",
  },
  {
    title: "HIIT",
    badge: "HIIT",
    description: "Short bursts built for sweat, speed, and confidence.",
    duration: 20,
    calories: 560,
    image: "/pulse-assets/workout-cardio.jpg",
    wide: true,
  },
];

function fallbackWorkout(items, index) {
  if (!items.length) return null;
  return items[index] || items[index % items.length];
}

function MetricChip({ icon: Icon, children, large = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200/16 bg-white/[0.08] font-black text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
        large ? "min-h-12 min-w-[5rem] px-4 text-sm" : "min-h-7 px-2.5 text-[0.68rem]"
      }`}
    >
      <Icon className={`${large ? "h-4 w-4" : "h-3.5 w-3.5"} text-emerald-300`} />
      {children}
    </span>
  );
}

function CircleArrow({ workout }) {
  return (
    <Link
      href={`/workout/session?workout=${workout.id}`}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/14 bg-white/[0.075] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition group-hover:border-emerald-200/40 group-hover:bg-emerald-400 group-hover:text-[#031209] group-hover:shadow-[0_0_32px_rgba(52,211,153,0.45)]"
      aria-label={`Start ${workout.title}`}
    >
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function WorkoutImage({ workout, image, alt, className = "" }) {
  const src = image || workout.thumbnail_url;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(74,222,128,0.35),transparent_34%),linear-gradient(135deg,#07140c,#173b24_48%,#030806)] ${className}`} />
  );
}

function FeaturedCard({ item, busy, onOpen, onToggleFavorite, onComplete }) {
  const workout = item.workout;

  return (
    <article className="group grid min-h-[560px] overflow-hidden rounded-[1.35rem] border border-emerald-200/20 bg-[linear-gradient(135deg,rgba(17,70,39,0.72),rgba(4,16,10,0.86))] shadow-[0_26px_90px_rgba(0,0,0,0.46),0_0_45px_rgba(52,211,153,0.12)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-200/38 hover:shadow-[0_34px_110px_rgba(0,0,0,0.56),0_0_55px_rgba(52,211,153,0.2)] md:grid-cols-[1.05fr_0.95fr] lg:min-h-[650px]">
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className="relative min-h-[430px] overflow-hidden bg-black/30 md:min-h-full"
        aria-label="Open Strength Builder"
      >
        <WorkoutImage workout={workout} image="/pulse-assets/hero-athlete.jpg" alt="Strength Builder" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_45%,rgba(74,222,128,0.16),transparent_36%),linear-gradient(90deg,rgba(0,0,0,0.15),rgba(0,0,0,0.02))]" />
        <span className="absolute left-5 top-5 rounded-full border border-white/18 bg-black/45 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.06em] text-white backdrop-blur">
          Featured plan
        </span>
        <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
          <MetricChip icon={Clock3}>45 min</MetricChip>
          <MetricChip icon={Flame}>530 kcal</MetricChip>
        </div>
      </button>

      <div className="flex min-h-full flex-col p-6 sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/24 bg-emerald-300/12 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Featured plan
          </span>
          <button type="button" onClick={() => onOpen(workout)} className="mt-7 block text-left">
            <h3 className="text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
              Strength<br />Builder
            </h3>
          </button>
          <p className="mt-5 max-w-xs text-base leading-8 text-emerald-50/68">
            A focused strength session with progressive lifts, core work, and clear rest windows.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/16 bg-white/[0.09] px-3 py-2 text-xs font-black text-white">Upper body + core</span>
            <span className="rounded-full border border-white/16 bg-white/[0.09] px-3 py-2 text-xs font-black text-white">Form-first pacing</span>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-5 border-t border-white/[0.1] pt-7 md:mt-auto">
          <div className="flex flex-wrap gap-3">
            <MetricChip icon={Clock3} large>45<br className="sm:hidden" /> min</MetricChip>
            <MetricChip icon={Flame} large>520<br className="sm:hidden" /> kcal</MetricChip>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggleFavorite(workout)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.065] text-emerald-50 transition hover:border-rose-200/30 hover:text-rose-100 disabled:opacity-60"
              aria-label={item.preference?.is_favorite ? "Remove favorite" : "Save favorite"}
            >
              <Heart className={`h-4 w-4 ${item.preference?.is_favorite ? "fill-current text-rose-300" : ""}`} />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onComplete(workout)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.065] text-emerald-50 transition hover:border-emerald-200/35 hover:text-emerald-200 disabled:opacity-60"
              aria-label="Mark workout completed"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <CircleArrow workout={workout} />
          </div>
        </div>
      </div>
    </article>
  );
}

function SmallWorkoutCard({ item, copy, busy, onOpen, onToggleFavorite, onComplete }) {
  const workout = item.workout;

  return (
    <article
      className={`group relative flex min-h-[265px] flex-col overflow-hidden rounded-[1.05rem] border border-emerald-200/16 bg-[linear-gradient(145deg,rgba(21,59,37,0.62),rgba(5,13,9,0.86))] p-4 shadow-[0_20px_58px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-200/36 hover:shadow-[0_26px_70px_rgba(0,0,0,0.5),0_0_34px_rgba(52,211,153,0.18)] ${
        copy.wide ? "sm:col-span-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className={`relative overflow-hidden rounded-[0.8rem] border border-white/[0.08] bg-black/35 ${copy.wide ? "aspect-[22/7] min-h-[140px]" : "aspect-[16/9]"}`}
        aria-label={`Open ${copy.title}`}
      >
        <WorkoutImage workout={workout} image={copy.image} alt={copy.title} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_45%,rgba(74,222,128,0.16),transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.3))]" />
        <span className="absolute left-3 top-3 rounded-full border border-white/14 bg-black/50 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.08em] text-white backdrop-blur">
          {copy.badge}
        </span>
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        <MetricChip icon={Clock3}>{copy.duration} min</MetricChip>
        <MetricChip icon={Flame}>{copy.calories} kcal</MetricChip>
      </div>

      <div className="mt-4 flex flex-1 items-end gap-4">
        <button type="button" onClick={() => onOpen(workout)} className="min-w-0 flex-1 text-left">
          <h3 className="text-xl font-black leading-tight tracking-[-0.02em] text-white">{copy.title}</h3>
          <p className="mt-2 max-w-[17rem] text-sm leading-6 text-emerald-50/62">{copy.description}</p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleFavorite(workout)}
            className="hidden h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.055] text-emerald-50 transition hover:border-rose-200/25 hover:text-rose-100 disabled:opacity-60 sm:grid"
            aria-label={item.preference?.is_favorite ? "Remove favorite" : "Save favorite"}
          >
            <Heart className={`h-4 w-4 ${item.preference?.is_favorite ? "fill-current text-rose-300" : ""}`} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onComplete(workout)}
            className="hidden h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.055] text-emerald-50 transition hover:border-emerald-200/30 hover:text-emerald-200 disabled:opacity-60 sm:grid"
            aria-label="Mark workout completed"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <CircleArrow workout={workout} />
        </div>
      </div>
    </article>
  );
}

export default function WorkoutLibraryShowcase({
  items,
  busy,
  onOpen,
  onToggleFavorite,
  onComplete,
  onViewAll,
}) {
  const featured = fallbackWorkout(items, 0);
  const cards = CARD_COPY.map((copy, index) => ({
    copy,
    item: fallbackWorkout(items, index + 1),
  })).filter(({ item }) => item);

  if (!featured) return null;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-200/12 bg-[#020806] px-4 py-8 text-white shadow-[0_32px_100px_rgba(0,0,0,0.52)] sm:px-6 lg:px-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 26% 8%, rgba(34,197,94,0.24), transparent 32%), radial-gradient(circle at 72% 18%, rgba(34,197,94,0.13), transparent 30%), radial-gradient(circle at 48% 100%, rgba(132,204,22,0.1), transparent 34%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), radial-gradient(rgba(134,239,172,0.13) 1px, transparent 1px)",
          backgroundSize: "auto, auto, auto, 54px 54px, 54px 54px, 17px 17px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,6,0.08),rgba(2,8,6,0.78))]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[46rem]">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-emerald-400">Workout Library</p>
            <h2 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Train every part of you
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/66 sm:text-base">
              Pick a focused session, then let the coach adjust the pace around your goals, energy, and schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-emerald-300/36 hover:bg-emerald-300/14"
          >
            View all
            <ArrowUpRight className="h-4 w-4 text-emerald-300" />
          </button>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
          <FeaturedCard
            item={featured}
            busy={busy}
            onOpen={onOpen}
            onToggleFavorite={onToggleFavorite}
            onComplete={onComplete}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map(({ item, copy }) => (
              <SmallWorkoutCard
                key={`${copy.title}-${item.workout.id}`}
                item={item}
                copy={copy}
                busy={busy}
                onOpen={onOpen}
                onToggleFavorite={onToggleFavorite}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
