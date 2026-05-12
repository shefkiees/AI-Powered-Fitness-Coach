"use client";

/* eslint-disable @next/next/no-img-element -- Workout media can be user/Supabase-hosted arbitrary URLs. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Dumbbell,
  Filter,
  Flame,
  Heart,
  Library,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import {
  completeLibraryWorkout,
  createWorkoutPlan,
  loadWorkoutModuleData,
  saveWorkoutPreference,
} from "@/src/services/workoutService";
import { formatGoal, formatLevel, toDateInputValue } from "@/src/utils/formatters";

const allValue = "all";

const durationFilters = [
  { value: allValue, label: "Any duration", test: () => true },
  { value: "short", label: "Under 20 min", test: (minutes) => Number(minutes || 0) <= 20 },
  {
    value: "medium",
    label: "20-40 min",
    test: (minutes) => Number(minutes || 0) > 20 && Number(minutes || 0) <= 40,
  },
  { value: "long", label: "40+ min", test: (minutes) => Number(minutes || 0) > 40 },
];

const viewFilters = [
  ["recommended", "Recommended"],
  ["all", "All workouts"],
  ["favorites", "Favorites"],
  ["completed", "Completed"],
];

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_16px_36px_rgba(184,245,61,0.13)] transition hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.045] px-4 py-2.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-white/[0.18] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60";

const lightButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-black text-[#111827] shadow-sm transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function labelFromValue(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionValues(workouts, key) {
  return Array.from(
    new Set(
      workouts
        .map((workout) => workout[key])
        .filter(Boolean)
        .map((value) => String(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function preferenceMap(preferences) {
  return new Map(preferences.map((item) => [item.workout_id, item]));
}

function completedMap(completedWorkouts) {
  return completedWorkouts.reduce((map, row) => {
    const list = map.get(row.workout_id) || [];
    map.set(row.workout_id, [...list, row]);
    return map;
  }, new Map());
}

function goalMatchesWorkout(workout, profile) {
  const goal = normalize(profile?.goal);
  if (!goal) return false;

  const tags = (workout.goal_tags || []).map(normalize);
  if (tags.includes(goal)) return true;

  if (goal === "lose_weight") return normalize(workout.category).includes("cardio");
  if (goal === "build_muscle") return normalize(workout.category).includes("strength");
  return tags.includes("improve_fitness") || tags.includes("maintain");
}

function recommendationScore(workout, profile, preference) {
  let score = 0;
  const level = normalize(profile?.fitness_level);
  const difficulty = normalize(workout.difficulty);

  if (goalMatchesWorkout(workout, profile)) score += 3;
  if (level && difficulty === level) score += 2;
  if (level === "beginner" && difficulty === "beginner") score += 1;
  if (preference?.is_favorite) score += 3;
  if (workout.source === "ai_generated" || workout.category === "AI Plan" || workout.category === "Plan") score += 3;
  if (!workout.is_public) score += 1;

  return score;
}

function isRecommended(workout, profile, preference) {
  return recommendationScore(workout, profile, preference) >= 2;
}

function searchableText(workout) {
  return [
    workout.title,
    workout.description,
    workout.category,
    workout.muscle_group,
    workout.difficulty,
    workout.equipment,
    ...(workout.goal_tags || []),
    ...(workout.workout_steps || []).map((step) => `${step.title} ${step.description}`),
  ]
    .join(" ")
    .toLowerCase();
}

function friendlyWorkoutErrorMessage(error) {
  const message = normalize(error);

  const friendly = (() => {
    if (
    message.includes("schema") ||
    message.includes("migration") ||
    message.includes("workout_steps") ||
    message.includes("workout_media") ||
    message.includes("favorite_workouts") ||
    message.includes("completed_workouts") ||
    message.includes("supabase")
    ) {
      return "Your workout catalog schema may not be ready yet. Apply the latest Supabase migration, then refresh this page.";
    }

    return "Something interrupted the connection to your workout library. Refresh the page or try again in a moment.";
  })();

  const raw = String(error || "").trim();
  return raw && raw !== friendly ? `${friendly} Detail: ${raw}` : friendly;
}

function MediaFrame({ workout, compact = false }) {
  const media =
    workout.workout_media?.find((item) => item.is_primary) ||
    workout.workout_media?.[0] ||
    null;
  const thumbnail = workout.thumbnail_url;

  if (media?.media_url && media.media_type === "video") {
    return (
      <video
        className="h-full w-full object-cover"
        controls={!compact}
        muted={compact}
        loop={compact}
        playsInline
        poster={media.thumbnail_url || thumbnail || undefined}
      >
        <source src={media.media_url} />
      </video>
    );
  }

  if (media?.media_url) {
    return (
      <img
        src={media.media_url}
        alt={media.alt_text || workout.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt={workout.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,rgba(184,245,61,0.1),rgba(255,255,255,0.025))] text-[var(--fc-accent)]">
      <Dumbbell className="h-10 w-10" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone = "lime" }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-300/12 text-rose-100 ring-1 ring-rose-300/18"
      : tone === "sky"
        ? "bg-sky-300/12 text-sky-100 ring-1 ring-sky-300/18"
        : "bg-emerald-300/12 text-emerald-100 ring-1 ring-emerald-300/18";

  return (
    <article className="rounded-[1.35rem] border border-emerald-300/12 bg-white/[0.045] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100/52">
            {label}
          </p>
          <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">{value}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-50/62">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labelFor = labelFromValue,
  includeAll = true,
}) {
  const finalOptions = includeAll ? [allValue, ...options] : options;

  return (
    <label className="grid gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-100/52">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-emerald-300/14 bg-black/25 px-4 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-emerald-300/45 focus:ring-4 focus:ring-emerald-300/10"
      >
        {finalOptions.map((option) => (
          <option key={option} value={option}>
            {option === allValue && includeAll ? `All ${label.toLowerCase()}` : labelFor(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterBar({
  filters,
  categories,
  difficulties,
  muscleGroups,
  resultCount,
  totalCount,
  setFilter,
  resetFilters,
}) {
  return (
    <section className="mb-7 overflow-hidden rounded-[1.45rem] border border-emerald-300/12 bg-white/[0.035] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-100 ring-1 ring-emerald-300/18">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Find the right session</h2>
            <p className="mt-1 text-sm text-emerald-50/58">
              Showing {resultCount} of {totalCount} workouts
            </p>
          </div>
        </div>
        <button type="button" onClick={resetFilters} className={secondaryButtonClass}>
          <Filter className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.85fr_0.95fr_1fr]">
        <label className="grid gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-100/52">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-100/45" />
            <input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              className="h-12 w-full rounded-2xl border border-emerald-300/14 bg-black/25 px-11 text-sm font-semibold text-white outline-none transition placeholder:text-emerald-50/38 focus:border-emerald-300/45 focus:ring-4 focus:ring-emerald-300/10"
              placeholder="Search by name, muscle, or goal"
            />
          </span>
        </label>

        <FilterSelect
          label="Category"
          value={filters.category}
          onChange={(value) => setFilter("category", value)}
          options={categories}
        />
        <FilterSelect
          label="Level"
          value={filters.difficulty}
          onChange={(value) => setFilter("difficulty", value)}
          options={difficulties}
        />
        <FilterSelect
          label="Duration"
          value={filters.duration}
          onChange={(value) => setFilter("duration", value)}
          options={durationFilters.map((item) => item.value)}
          labelFor={(value) => durationFilters.find((item) => item.value === value)?.label || value}
          includeAll={false}
        />
        <FilterSelect
          label="Muscle"
          value={filters.muscle}
          onChange={(value) => setFilter("muscle", value)}
          options={muscleGroups}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {viewFilters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter("view", value)}
            className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-black transition ${
              filters.view === value
                ? "bg-emerald-300 text-[#05110a] shadow-[0_0_24px_rgba(52,211,153,0.22)]"
                : "border border-emerald-300/12 bg-white/[0.04] text-emerald-50/66 hover:border-emerald-300/28 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function MetaPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-sm font-semibold text-[var(--fc-muted)]">
      <Icon className="h-4 w-4 text-[rgba(184,245,61,0.82)]" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function workoutCalories(workout) {
  const minutes = Number(workout.duration_minutes || 0);
  if (!minutes) return "--";
  return Math.max(120, Math.round(minutes * 12.5));
}

function PremiumChip({ icon: Icon, children, roomy = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-300/16 bg-white/[0.065] font-black text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
        roomy ? "min-h-12 px-4 text-sm" : "min-h-7 px-2.5 text-[0.68rem]"
      }`}
    >
      <Icon className={`${roomy ? "h-4 w-4" : "h-3.5 w-3.5"} text-emerald-300`} />
      {children}
    </span>
  );
}

function WorkoutArrowButton({ workout, label = "Start session" }) {
  return (
    <Link
      href={`/workout/session?workout=${workout.id}`}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-200/18 bg-emerald-300/16 text-emerald-50 shadow-[0_0_26px_rgba(52,211,153,0.2)] transition group-hover:border-emerald-200/35 group-hover:bg-emerald-300 group-hover:text-[#05110a]"
      aria-label={label}
    >
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function WorkoutCard({
  workout,
  preference,
  completedRows,
  recommended,
  busy,
  onOpen,
  onToggleFavorite,
  onComplete,
  featured = false,
  wide = false,
  displayTitle,
}) {
  const title = displayTitle || workout.title;
  const category = workout.category || "Workout";
  const description = workout.description || "A focused session with simple coaching and steady pacing.";
  const imageShellClass = featured
    ? "relative min-h-[360px] overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-black/35 sm:min-h-[520px] lg:min-h-[620px]"
    : wide
      ? "relative aspect-[21/8] min-h-[160px] overflow-hidden rounded-[1rem] border border-white/[0.08] bg-black/35 sm:aspect-[21/7]"
      : "relative aspect-[16/10] overflow-hidden rounded-[1rem] border border-white/[0.08] bg-black/35";

  if (featured) {
    return (
      <article className="group grid overflow-hidden rounded-[1.45rem] border border-emerald-300/18 bg-[linear-gradient(145deg,rgba(16,62,36,0.56),rgba(5,13,9,0.84))] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_34px_rgba(52,211,153,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300/36 hover:shadow-[0_28px_80px_rgba(0,0,0,0.5),0_0_42px_rgba(52,211,153,0.18)] sm:grid-cols-[1.05fr_0.95fr] sm:p-4">
        <button
          type="button"
          onClick={() => onOpen(workout)}
          className={imageShellClass}
          aria-label={`Open ${title}`}
        >
          <MediaFrame workout={workout} compact />
          <span className="absolute left-4 top-4 rounded-full border border-white/14 bg-black/45 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.08em] text-white backdrop-blur">
            Featured plan
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/68 to-transparent" />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            <PremiumChip icon={Clock3}>{workout.duration_minutes || "--"} min</PremiumChip>
            <PremiumChip icon={Flame}>{workoutCalories(workout)} kcal</PremiumChip>
          </div>
        </button>

        <div className="flex min-h-full flex-col p-4 sm:p-5 lg:p-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Featured plan
            </span>
            <button type="button" onClick={() => onOpen(workout)} className="mt-7 block text-left">
              <h3 className="text-4xl font-black leading-[1.04] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                {title}
              </h3>
            </button>
            <p className="mt-5 max-w-sm text-base leading-8 text-emerald-50/68">{description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-2 text-xs font-black text-white">
                {workout.muscle_group || "Full body"}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-2 text-xs font-black text-white">
                {workout.difficulty || "Beginner"} pacing
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.08] pt-6 sm:mt-auto">
            <div className="flex flex-wrap gap-3">
              <PremiumChip icon={Clock3} roomy>{workout.duration_minutes || "--"} min</PremiumChip>
              <PremiumChip icon={Flame} roomy>{workoutCalories(workout)} kcal</PremiumChip>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onToggleFavorite(workout)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-emerald-50 transition hover:border-rose-200/25 hover:text-rose-100 disabled:opacity-60"
                aria-label={preference?.is_favorite ? "Remove favorite" : "Save favorite"}
              >
                <Heart className={`h-4 w-4 ${preference?.is_favorite ? "fill-current text-rose-300" : ""}`} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onComplete(workout)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-emerald-50 transition hover:border-emerald-200/30 hover:text-emerald-200 disabled:opacity-60"
                aria-label="Mark workout completed"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <WorkoutArrowButton workout={workout} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group flex min-h-full flex-col overflow-hidden rounded-[1.15rem] border border-emerald-300/14 bg-[linear-gradient(150deg,rgba(22,58,38,0.48),rgba(7,13,10,0.82))] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300/34 hover:shadow-[0_24px_64px_rgba(0,0,0,0.42),0_0_32px_rgba(52,211,153,0.16)] ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className={imageShellClass}
        aria-label={`Open ${title}`}
      >
        <MediaFrame workout={workout} compact />
        <span className="absolute left-3 top-3 rounded-full border border-white/12 bg-black/48 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-white backdrop-blur">
          {category}
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      </button>
      <div className="flex flex-1 flex-col p-1 pt-4">
        <div className="flex flex-wrap gap-2">
          <PremiumChip icon={Clock3}>{workout.duration_minutes || "--"} min</PremiumChip>
          <PremiumChip icon={Flame}>{workoutCalories(workout)} kcal</PremiumChip>
        </div>
        <button type="button" onClick={() => onOpen(workout)} className="mt-4 block min-w-0 text-left">
          <p className="line-clamp-2 text-xl font-black leading-tight text-white">{title}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-emerald-50/62">{description}</p>
        </button>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            {recommended ? (
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Recommended</p>
            ) : null}
            {completedRows.length > 0 ? (
              <p className="mt-1 text-xs font-semibold text-emerald-50/52">Completed {completedRows.length} times</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleFavorite(workout)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-emerald-50 transition hover:border-rose-200/25 hover:text-rose-100 disabled:opacity-60"
            aria-label={preference?.is_favorite ? "Remove favorite" : "Save favorite"}
          >
              <Heart className={`h-4 w-4 ${preference?.is_favorite ? "fill-current text-rose-300" : ""}`} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onComplete(workout)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-emerald-50 transition hover:border-emerald-200/30 hover:text-emerald-200 disabled:opacity-60"
            aria-label="Mark workout completed"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
            <WorkoutArrowButton workout={workout} />
          </div>
        </div>
      </div>
    </article>
  );
}

function WorkoutDetailModal({
  workout,
  preference,
  completedRows,
  busy,
  onClose,
  onToggleFavorite,
  onComplete,
}) {
  useEffect(() => {
    if (!workout) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, workout]);

  if (!workout) return null;

  const latestCompletion = completedRows?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/76 px-4 py-6 backdrop-blur-md">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.7rem] border border-white/[0.1] bg-[rgba(9,12,9,0.96)] shadow-[0_30px_110px_rgba(0,0,0,0.5)]">
        <div className="relative border-b border-white/[0.08] bg-[linear-gradient(135deg,rgba(184,245,61,0.08),rgba(255,255,255,0.025))] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-[rgba(184,245,61,0.82)]">
                {workout.category || "Workout details"}
              </p>
              <h2 className="mt-2 break-words text-2xl font-black tracking-[-0.02em] text-white sm:text-4xl">
                {workout.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.045] text-[var(--fc-muted)] transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
              aria-label="Close workout details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="aspect-video overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
              <MediaFrame workout={workout} />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MetaPill icon={Dumbbell} label={workout.muscle_group || "Full body"} />
              <MetaPill icon={Sparkles} label={workout.difficulty || "Beginner"} />
              <MetaPill icon={Clock3} label={`${workout.duration_minutes || "--"} min`} />
            </div>

            <p className="mt-5 text-sm leading-7 text-[var(--fc-muted)]">
              {workout.description || "No description available yet."}
            </p>
          </div>

          <div className="grid content-start gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onToggleFavorite(workout)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition disabled:opacity-60 ${
                  preference?.is_favorite
                    ? "bg-rose-300/14 text-rose-100 ring-1 ring-rose-300/18"
                    : secondaryButtonClass
                }`}
              >
                <Heart className={`h-4 w-4 ${preference?.is_favorite ? "fill-current" : ""}`} />
                {preference?.is_favorite ? "Saved favorite" : "Save favorite"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onComplete(workout)}
                className={primaryButtonClass}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark completed
              </button>
              <Link
                href={`/workout/session?workout=${workout.id}`}
                className={secondaryButtonClass}
              >
                <PlayCircle className="h-4 w-4" />
                Start session
              </Link>
            </div>

            {latestCompletion ? (
              <div className="rounded-[1.2rem] border border-emerald-300/16 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
                Completed {completedRows.length} time{completedRows.length === 1 ? "" : "s"}.
                Last session: {toDateInputValue(latestCompletion.completed_at)}
              </div>
            ) : null}

            <section className="rounded-[1.3rem] border border-white/[0.08] bg-white/[0.035] p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-white">
                Step-by-step coaching
              </h3>
              <ol className="mt-4 grid gap-3">
                {(workout.workout_steps || []).map((step, index) => (
                  <li
                    key={step.id || `${workout.id}-${index}`}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-[1.1rem] border border-white/[0.08] bg-black/20 p-4"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fc-accent)]/14 text-sm font-black text-[var(--fc-accent)] ring-1 ring-[rgba(184,245,61,0.22)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{step.title}</p>
                      {step.description ? (
                        <p className="mt-1 text-sm leading-6 text-[var(--fc-muted)]">
                          {step.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineError({ message, onRetry }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[1.25rem] border border-rose-300/14 bg-rose-300/8 p-4 text-sm text-rose-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-300/12 text-rose-100">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <p className="font-bold text-white">Workout update paused</p>
          <p className="mt-1 leading-6 text-rose-100/78">{friendlyWorkoutErrorMessage(message)}</p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className={secondaryButtonClass}>
        Retry
      </button>
    </div>
  );
}

function WorkoutContent({ profile }) {
  const [workouts, setWorkouts] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filters, setFilters] = useState({
    view: "recommended",
    search: "",
    category: allValue,
    difficulty: allValue,
    duration: allValue,
    muscle: allValue,
  });

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const result = await loadWorkoutModuleData();
      setWorkouts(result.workouts);
      setPreferences(result.preferences);
      setCompletedWorkouts(result.completedWorkouts);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const preferencesByWorkout = useMemo(() => preferenceMap(preferences), [preferences]);
  const completedByWorkout = useMemo(() => completedMap(completedWorkouts), [completedWorkouts]);

  const categories = useMemo(() => optionValues(workouts, "category"), [workouts]);
  const difficulties = useMemo(() => optionValues(workouts, "difficulty"), [workouts]);
  const muscleGroups = useMemo(() => optionValues(workouts, "muscle_group"), [workouts]);

  const enrichedWorkouts = useMemo(() => {
    return workouts
      .map((workout) => {
        const preference = preferencesByWorkout.get(workout.id);
        return {
          workout,
          preference,
          completedRows: completedByWorkout.get(workout.id) || [],
          score: recommendationScore(workout, profile, preference),
          recommended: isRecommended(workout, profile, preference),
        };
      })
      .sort((a, b) => {
        if (filters.view === "recommended") return b.score - a.score;
        return String(a.workout.title).localeCompare(String(b.workout.title));
      });
  }, [completedByWorkout, filters.view, preferencesByWorkout, profile, workouts]);

  const filteredWorkouts = useMemo(() => {
    const query = normalize(filters.search);
    const durationFilter = durationFilters.find((item) => item.value === filters.duration) || durationFilters[0];

    return enrichedWorkouts.filter(({ workout, preference, completedRows, recommended }) => {
      if (filters.view === "recommended" && !recommended) return false;
      if (filters.view === "favorites" && !preference?.is_favorite) return false;
      if (filters.view === "completed" && completedRows.length === 0) return false;
      if (filters.category !== allValue && workout.category !== filters.category) return false;
      if (filters.difficulty !== allValue && workout.difficulty !== filters.difficulty) return false;
      if (filters.muscle !== allValue && workout.muscle_group !== filters.muscle) return false;
      if (!durationFilter.test(workout.duration_minutes)) return false;
      if (query && !searchableText(workout).includes(query)) return false;
      return true;
    });
  }, [enrichedWorkouts, filters]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      view: "all",
      search: "",
      category: allValue,
      difficulty: allValue,
      duration: allValue,
      muscle: allValue,
    });
  };

  const toggleFavorite = async (workout) => {
    const preference = preferencesByWorkout.get(workout.id);
    const nextFavorite = !preference?.is_favorite;
    setBusyAction(`favorite:${workout.id}`);
    setError("");
    try {
      if (workout.is_local_catalog) {
        setPreferences((current) => {
          const others = current.filter((item) => item.workout_id !== workout.id);
          return nextFavorite
            ? [
                {
                  id: `local-favorite-${workout.id}`,
                  workout_id: workout.id,
                  is_favorite: true,
                  selected_at: new Date().toISOString(),
                },
                ...others,
              ]
            : others;
        });
        return;
      }

      const saved = await saveWorkoutPreference(workout.id, {
        is_favorite: nextFavorite,
        selected_at: nextFavorite ? new Date().toISOString() : null,
      });
      setPreferences((current) => {
        const others = current.filter((item) => item.workout_id !== workout.id);
        return [saved, ...others];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction("");
    }
  };

  const completeWorkout = async (workout) => {
    setBusyAction(`complete:${workout.id}`);
    setError("");
    try {
      const row = await completeLibraryWorkout(workout);
      setCompletedWorkouts((current) => [row, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction("");
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    setError("");
    try {
      await createWorkoutPlan(null, profile);
      await load();
      setFilters((current) => ({ ...current, view: "all", category: allValue, search: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  const selectedPreference = selectedWorkout ? preferencesByWorkout.get(selectedWorkout.id) : null;
  const selectedCompletedRows = selectedWorkout ? completedByWorkout.get(selectedWorkout.id) || [] : [];
  const favoriteCount = preferences.filter((item) => item.is_favorite).length;

  return (
    <AppLayout
      title="Workouts"
      subtitle={`A curated training library tuned for ${formatGoal(profile?.goal)} and ${formatLevel(profile?.fitness_level)}.`}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generatePlan}
            disabled={generating}
            className={primaryButtonClass}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate AI plan
          </button>
          <button
            type="button"
            onClick={load}
            disabled={state === "loading"}
            className={lightButtonClass}
          >
            <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      }
    >
      {error && state !== "error" ? <InlineError message={error} onRetry={load} /> : null}

      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-300/14 bg-[#020705] px-4 py-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:px-6 sm:py-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 22% 5%, rgba(34,197,94,0.26), transparent 30%), radial-gradient(circle at 72% 16%, rgba(16,185,129,0.15), transparent 28%), radial-gradient(circle at 50% 98%, rgba(132,204,22,0.13), transparent 35%), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), radial-gradient(rgba(134,239,172,0.16) 1px, transparent 1px)",
            backgroundSize: "auto, auto, auto, 48px 48px, 48px 48px, 18px 18px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,7,5,0.16),rgba(2,7,5,0.72))]" aria-hidden />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-emerald-300">
                Workout Library
              </p>
              <h2 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                Train every part of you
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/66 sm:text-base">
                Pick a focused session, then let the coach adjust the pace around your goals, energy, and schedule.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilters((current) => ({ ...current, view: "all", search: "", category: allValue, difficulty: allValue, duration: allValue, muscle: allValue }))}
              className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-5 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-emerald-300/35 hover:bg-emerald-300/14"
            >
              View all
              <ArrowUpRight className="h-4 w-4 text-emerald-300" />
            </button>
          </div>

          <section className="mb-7 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Library}
              label="Library"
              value={workouts.length}
              helper="Workouts available to browse"
            />
            <StatCard
              icon={Heart}
              label="Saved"
              value={favoriteCount}
              helper="Favorites linked to your profile"
              tone="rose"
            />
            <StatCard
              icon={BarChart3}
              label="Completed"
              value={completedWorkouts.length}
              helper="Sessions logged by your account"
              tone="sky"
            />
          </section>

          <FilterBar
            filters={filters}
            categories={categories}
            difficulties={difficulties}
            muscleGroups={muscleGroups}
            resultCount={filteredWorkouts.length}
            totalCount={workouts.length}
            setFilter={setFilter}
            resetFilters={resetFilters}
          />

          {state === "loading" ? <LoadingSpinner label="Preparing your workout library..." /> : null}

      {state === "error" ? (
        <EmptyState
          icon={DatabaseZap}
          title="We couldn’t load your workout library"
          description={friendlyWorkoutErrorMessage(error)}
          actionLabel="Refresh library"
          onAction={load}
          secondaryActionLabel="Back to dashboard"
          secondaryActionHref="/dashboard"
          tone="danger"
        />
      ) : null}

      {state === "ready" && workouts.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Your workout library is waiting for content"
          description="Apply the workout catalog migration or add workouts in Supabase, then refresh this page to start browsing."
          actionLabel="Refresh library"
          onAction={load}
          secondaryActionLabel="Go to dashboard"
          secondaryActionHref="/dashboard"
        />
      ) : null}

      {state === "ready" && workouts.length > 0 && filteredWorkouts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No workouts match these filters"
          description="Try a broader category, a different duration, or clear filters to see more training options."
          actionLabel="Clear filters"
          onAction={resetFilters}
          secondaryActionLabel="Show recommended"
          onSecondaryAction={() => setFilter("view", "recommended")}
        />
      ) : null}

      {state === "ready" && filteredWorkouts.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
          <WorkoutCard
            key={filteredWorkouts[0].workout.id}
            workout={filteredWorkouts[0].workout}
            preference={filteredWorkouts[0].preference}
            completedRows={filteredWorkouts[0].completedRows}
            recommended={filteredWorkouts[0].recommended}
            busy={Boolean(busyAction)}
            onOpen={setSelectedWorkout}
            onToggleFavorite={toggleFavorite}
            onComplete={completeWorkout}
            featured
            displayTitle="Strength Builder"
          />
          <div className="grid gap-4 sm:grid-cols-2">
          {filteredWorkouts.slice(1, 6).map(({ workout, preference, completedRows, recommended }, index) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              preference={preference}
              completedRows={completedRows}
              recommended={recommended}
              busy={Boolean(busyAction)}
              onOpen={setSelectedWorkout}
              onToggleFavorite={toggleFavorite}
              onComplete={completeWorkout}
              wide={index === 4}
              displayTitle={["Cardio", "Squats", "Boxing", "Push-Ups", "HIIT"][index] || workout.title}
            />
          ))}
          </div>
        </div>
      ) : null}
        </div>
      </section>

      <WorkoutDetailModal
        workout={selectedWorkout}
        preference={selectedPreference}
        completedRows={selectedCompletedRows}
        busy={Boolean(busyAction)}
        onClose={() => setSelectedWorkout(null)}
        onToggleFavorite={toggleFavorite}
        onComplete={completeWorkout}
      />
    </AppLayout>
  );
}

export default function WorkoutPlanPage() {
  return (
    <ProtectedRoute>
      {({ profile }) => <WorkoutContent profile={profile} />}
    </ProtectedRoute>
  );
}
