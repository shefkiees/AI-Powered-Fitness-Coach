"use client";

/* eslint-disable @next/next/no-img-element -- Workout media can be user/Supabase-hosted arbitrary URLs. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Dumbbell,
  Filter,
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
} from "@/src/utils/supabaseData";
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
      ? "bg-rose-50 text-rose-600"
      : tone === "sky"
        ? "bg-sky-50 text-sky-600"
        : "bg-emerald-50 text-emerald-600";

  return (
    <article className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_28px_rgba(17,24,39,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9ca3af]">
            {label}
          </p>
          <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#111827]">{value}</p>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">{helper}</p>
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
    <label className="grid gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#9ca3af]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[#111827] outline-none transition focus:border-[#22c55e] focus:ring-4 focus:ring-emerald-100"
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
    <section className="mb-7 overflow-hidden rounded-[1.45rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_12px_32px_rgba(17,24,39,0.06)] sm:p-5">
      <div className="flex flex-col gap-3 border-b border-[#eef0f4] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#111827]">Find the right session</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Showing {resultCount} of {totalCount} workouts
            </p>
          </div>
        </div>
        <button type="button" onClick={resetFilters} className={lightButtonClass}>
          <Filter className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.85fr_0.95fr_1fr]">
        <label className="grid gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#9ca3af]">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#e5e7eb] bg-white px-11 text-sm font-semibold text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:ring-4 focus:ring-emerald-100"
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
                ? "bg-[#111827] text-white"
                : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
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

function WorkoutCard({
  workout,
  preference,
  completedRows,
  recommended,
  busy,
  onOpen,
  onToggleFavorite,
  onComplete,
}) {
  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-[#e5e7eb] bg-white shadow-[0_10px_28px_rgba(17,24,39,0.06)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_36px_rgba(17,24,39,0.09)]">
      <button
        type="button"
        onClick={() => onOpen(workout)}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[#e5e7eb]"
        aria-label={`Open ${workout.title}`}
      >
        <MediaFrame workout={workout} compact />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-black ${recommended ? "bg-[#dcfce7] text-[#15803d]" : "bg-white/90 text-[#111827]"}`}>
          {workout.category || "Workout"}
        </span>
      </button>
      <div className="p-4">
        <button type="button" onClick={() => onOpen(workout)} className="block min-w-0 text-left">
          <p className="line-clamp-2 text-lg font-black leading-tight text-[#111827]">{workout.title}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#6b7280]">
            <span>{workout.duration_minutes || "--"} min</span>
            <span className="h-1 w-1 rounded-full bg-[#d1d5db]" />
            <span>{workout.difficulty || "Beginner"}</span>
          </p>
        </button>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/workout/session?workout=${workout.id}`}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-full bg-[#111827] px-3 text-sm font-bold text-white"
          >
            <PlayCircle className="h-4 w-4" />
            Start
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleFavorite(workout)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280] disabled:opacity-60"
            aria-label={preference?.is_favorite ? "Remove favorite" : "Save favorite"}
          >
            <Heart className={`h-4 w-4 ${preference?.is_favorite ? "fill-current text-rose-500" : ""}`} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onComplete(workout)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d] disabled:opacity-60"
            aria-label="Mark workout completed"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
        {completedRows.length > 0 ? (
          <p className="mt-3 text-xs font-semibold text-[#6b7280]">Completed {completedRows.length} times</p>
        ) : null}
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkouts.map(({ workout, preference, completedRows, recommended }) => (
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
            />
          ))}
        </div>
      ) : null}

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
