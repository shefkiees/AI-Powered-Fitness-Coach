"use client";

/* eslint-disable @next/next/no-img-element -- Workout media can be user/Supabase-hosted arbitrary URLs. */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Dumbbell,
  Heart,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import WorkoutLibraryShowcase from "@/src/components/WorkoutLibraryShowcase";
import {
  completeLibraryWorkout,
  createWorkoutPlan,
  loadWorkoutModuleData,
  saveWorkoutPreference,
} from "@/src/services/workoutService";
import { formatGoal, formatLevel, toDateInputValue } from "@/src/utils/formatters";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_16px_36px_rgba(184,245,61,0.13)] transition hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.045] px-4 py-2.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-white/[0.18] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60";

const lightButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-black text-[#111827] shadow-sm transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
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

function MetaPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-3 py-2 text-sm font-semibold text-[var(--fc-muted)]">
      <Icon className="h-4 w-4 text-[rgba(184,245,61,0.82)]" />
      <span className="truncate">{label}</span>
    </span>
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
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);

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
        if (!showAllWorkouts) return b.score - a.score;
        return String(a.workout.title).localeCompare(String(b.workout.title));
      });
  }, [completedByWorkout, preferencesByWorkout, profile, showAllWorkouts, workouts]);

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
      setShowAllWorkouts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  const selectedPreference = selectedWorkout ? preferencesByWorkout.get(selectedWorkout.id) : null;
  const selectedCompletedRows = selectedWorkout ? completedByWorkout.get(selectedWorkout.id) || [] : [];

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

      {state === "ready" && enrichedWorkouts.length > 0 ? (
        <WorkoutLibraryShowcase
          items={enrichedWorkouts}
          busy={Boolean(busyAction)}
          onOpen={setSelectedWorkout}
          onToggleFavorite={toggleFavorite}
          onComplete={completeWorkout}
          onViewAll={() => setShowAllWorkouts(true)}
        />
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
