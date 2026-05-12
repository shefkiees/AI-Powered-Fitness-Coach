"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  DatabaseZap,
  Heart,
  Library,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import ExerciseVideoCard from "@/src/components/workouts/ExerciseVideoCard";
import WorkoutCard from "@/src/components/workouts/WorkoutCard";
import WorkoutFilters, { allValue, durationFilters } from "@/src/components/workouts/WorkoutFilters";
import WorkoutMediaHero from "@/src/components/workouts/WorkoutMediaHero";
import {
  estimateWorkoutCalories,
  getDisplayTitle,
  splitMuscles,
} from "@/src/components/workouts/mediaUtils";
import {
  completeLibraryWorkout,
  createWorkoutPlan,
  loadWorkoutModuleData,
  saveWorkoutPreference,
} from "@/src/services/workoutService";
import { formatGoal, formatLevel, toDateInputValue } from "@/src/utils/formatters";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-sm font-black text-white shadow-[0_16px_36px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-[#030712] disabled:cursor-not-allowed disabled:opacity-70";

const accentButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-white shadow-[0_16px_36px_rgba(34,197,94,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70";

const lightButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-black text-[#111827] shadow-sm transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryDarkButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.075] px-4 py-2.5 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
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
    getDisplayTitle(workout.title),
    workout.description,
    workout.category,
    workout.muscle_group,
    workout.difficulty,
    workout.equipment,
    ...(workout.goal_tags || []),
    ...(workout.exercises || []).map((exercise) => `${exercise.name} ${exercise.muscle_group} ${exercise.instructions || exercise.notes}`),
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

function difficultyRank(value) {
  const text = normalize(value);
  if (text.includes("beginner")) return 1;
  if (text.includes("intermediate")) return 2;
  if (text.includes("advanced")) return 3;
  return 4;
}

function sortWorkoutEntries(entries, sortBy) {
  const list = [...entries];
  return list.sort((a, b) => {
    if (sortBy === "duration") {
      return Number(a.workout.duration_minutes || 999) - Number(b.workout.duration_minutes || 999);
    }
    if (sortBy === "difficulty") {
      return difficultyRank(a.workout.difficulty) - difficultyRank(b.workout.difficulty);
    }
    if (sortBy === "popularity") {
      const aScore = a.completedRows.length * 3 + (a.preference?.is_favorite ? 2 : 0) + a.score;
      const bScore = b.completedRows.length * 3 + (b.preference?.is_favorite ? 2 : 0) + b.score;
      return bScore - aScore;
    }

    const aTime = new Date(a.workout.created_at || a.workout.updated_at || 0).getTime();
    const bTime = new Date(b.workout.created_at || b.workout.updated_at || 0).getTime();
    if (aTime !== bTime) return bTime - aTime;
    return String(getDisplayTitle(a.workout.title)).localeCompare(String(getDisplayTitle(b.workout.title)));
  });
}

function StatCard({ icon: Icon, label, value, helper, tone = "emerald" }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-600"
      : tone === "sky"
        ? "bg-sky-50 text-sky-600"
        : "bg-emerald-50 text-emerald-600";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.35rem] border border-white bg-white p-5 shadow-[0_14px_36px_rgba(17,24,39,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9ca3af]">{label}</p>
          <p className="mt-3 text-4xl font-black tracking-normal text-[#111827]">{value}</p>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.article>
  );
}

function InlineError({ message, onRetry }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <p className="font-black text-rose-950">Workout update paused</p>
          <p className="mt-1 leading-6 text-rose-800">{friendlyWorkoutErrorMessage(message)}</p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className={lightButtonClass}>
        Retry
      </button>
    </div>
  );
}

function PremiumEmptyState({ icon: Icon = Search, title, description, actionLabel, onAction, secondaryLabel, onSecondaryAction }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[1.6rem] border border-white bg-white p-6 text-center shadow-[0_20px_50px_rgba(17,24,39,0.08)]"
    >
      <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.28),transparent_42%),linear-gradient(145deg,#111827,#020617)] text-emerald-300 shadow-[0_22px_46px_rgba(17,24,39,0.18)]">
        <Icon className="h-11 w-11" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-normal text-[#111827]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#6b7280]">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {actionLabel ? (
          <button type="button" onClick={onAction} className={primaryButtonClass}>
            {actionLabel}
          </button>
        ) : null}
        {secondaryLabel ? (
          <button type="button" onClick={onSecondaryAction} className={lightButtonClass}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </motion.section>
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

  const exercises = workout?.exercises || [];
  const muscles = workout ? splitMuscles(workout.muscle_group, exercises) : [];
  const latestCompletion = completedRows?.[0];

  return (
    <AnimatePresence>
      {workout ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/78 px-3 py-5 backdrop-blur-md sm:px-5"
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.26 }}
            className="mx-auto max-w-6xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#f5f6f8] shadow-[0_34px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="relative bg-[#050806] p-3 sm:p-4">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-6 top-6 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-xl transition hover:bg-white hover:text-[#111827]"
                aria-label="Close workout details"
              >
                <X className="h-5 w-5" />
              </button>
              <WorkoutMediaHero workout={workout} completedCount={completedRows.length} />
            </div>

            <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[0.74fr_1.26fr]">
              <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
                <section className="rounded-[1.45rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(17,24,39,0.07)]">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9ca3af]">Workout summary</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#f3f4f6] p-3">
                      <p className="text-xs font-bold text-[#6b7280]">Exercises</p>
                      <p className="mt-1 text-2xl font-black text-[#111827]">{exercises.length || "--"}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f3f4f6] p-3">
                      <p className="text-xs font-bold text-[#6b7280]">Calories</p>
                      <p className="mt-1 text-2xl font-black text-[#111827]">{estimateWorkoutCalories(workout)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9ca3af]">Target muscles</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {muscles.map((muscle) => (
                        <span key={muscle} className="rounded-full bg-[#ecfdf5] px-3 py-1.5 text-xs font-black text-emerald-700">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>

                  {latestCompletion ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                      Completed {completedRows.length} time{completedRows.length === 1 ? "" : "s"}.
                      Last session: {toDateInputValue(latestCompletion.completed_at)}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[1.45rem] border border-[#111827] bg-[#111827] p-5 text-white shadow-[0_18px_42px_rgba(17,24,39,0.18)]">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/48">Actions</p>
                  <div className="mt-4 grid gap-2">
                    <Link href={`/workout/session?workout=${workout.id}`} className={accentButtonClass}>
                      <PlayCircle className="h-4 w-4" />
                      Start Workout
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onToggleFavorite(workout)}
                      className={preference?.is_favorite ? secondaryDarkButtonClass : "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-[#111827] transition hover:-translate-y-0.5 disabled:opacity-60"}
                    >
                      <Heart className={`h-4 w-4 ${preference?.is_favorite ? "fill-current text-rose-300" : ""}`} />
                      {preference?.is_favorite ? "Saved favorite" : "Save favorite"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => onComplete(workout)} className={secondaryDarkButtonClass}>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      Mark completed
                    </button>
                  </div>
                </section>
              </aside>

              <section>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Exercise demos</p>
                    <h3 className="mt-1 text-2xl font-black tracking-normal text-[#111827]">Movement preview</h3>
                  </div>
                  <p className="max-w-md text-sm leading-6 text-[#6b7280]">
                    Each block includes media, sets, reps, rest timing, and clear coaching cues.
                  </p>
                </div>

                {exercises.length ? (
                  <div className="grid gap-4">
                    {exercises.map((exercise, index) => (
                      <ExerciseVideoCard
                        key={exercise.id || `${workout.id}-${exercise.name}-${index}`}
                        exercise={exercise}
                        workout={workout}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <PremiumEmptyState
                    icon={Zap}
                    title="Exercise previews are coming soon"
                    description="This workout has a cover and summary, but no exercise-level media yet."
                  />
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
    sortBy: "newest",
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
    return workouts.map((workout) => {
      const preference = preferencesByWorkout.get(workout.id);
      return {
        workout,
        preference,
        completedRows: completedByWorkout.get(workout.id) || [],
        score: recommendationScore(workout, profile, preference),
        recommended: isRecommended(workout, profile, preference),
      };
    });
  }, [completedByWorkout, preferencesByWorkout, profile, workouts]);

  const filteredWorkouts = useMemo(() => {
    const query = normalize(filters.search);
    const durationFilter = durationFilters.find((item) => item.value === filters.duration) || durationFilters[0];

    const filtered = enrichedWorkouts.filter(({ workout, preference, completedRows, recommended }) => {
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

    return sortWorkoutEntries(filtered, filters.sortBy);
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
      sortBy: "newest",
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
      title="Workout Library"
      subtitle={`Premium training sessions tuned for ${formatGoal(profile?.goal)} and ${formatLevel(profile?.fitness_level)}.`}
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={generatePlan} disabled={generating} className={accentButtonClass}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate AI plan
          </button>
          <button type="button" onClick={load} disabled={state === "loading"} className={lightButtonClass}>
            <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      }
    >
      {error && state !== "error" ? <InlineError message={error} onRetry={load} /> : null}

      <section className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Library} label="Library" value={workouts.length} helper="Visual workouts ready to browse" />
        <StatCard icon={Heart} label="Saved" value={favoriteCount} helper="Favorites linked to your profile" tone="rose" />
        <StatCard icon={BarChart3} label="Completed" value={completedWorkouts.length} helper="Sessions logged by your account" tone="sky" />
      </section>

      <WorkoutFilters
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
          title="We couldn't load your workout library"
          description={friendlyWorkoutErrorMessage(error)}
          actionLabel="Refresh library"
          onAction={load}
          secondaryActionLabel="Back to dashboard"
          secondaryActionHref="/dashboard"
          tone="danger"
        />
      ) : null}

      {state === "ready" && workouts.length === 0 ? (
        <PremiumEmptyState
          icon={Zap}
          title="Your workout library is waiting for content"
          description="Apply the workout catalog migration or add workouts in Supabase, then refresh this page to start browsing."
          actionLabel="Refresh library"
          onAction={load}
          secondaryLabel="Go to dashboard"
          onSecondaryAction={() => window.location.assign("/dashboard")}
        />
      ) : null}

      {state === "ready" && workouts.length > 0 && filteredWorkouts.length === 0 ? (
        <PremiumEmptyState
          icon={Search}
          title="No workouts match your filters"
          description="Try a broader category, a different duration, or reset filters to bring more sessions back."
          actionLabel="Reset filters"
          onAction={resetFilters}
          secondaryLabel="Show recommended"
          onSecondaryAction={() => setFilter("view", "recommended")}
        />
      ) : null}

      {state === "ready" && filteredWorkouts.length > 0 ? (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
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
              />
            ))}
          </AnimatePresence>
        </motion.div>
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
