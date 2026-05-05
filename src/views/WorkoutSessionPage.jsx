"use client";

/* eslint-disable @next/next/no-img-element -- Workout thumbnails can come from user-controlled Supabase URLs. */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Star,
} from "lucide-react";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import {
  completeWorkout,
  getUpcomingWorkoutSessions,
  getWorkoutById,
  startWorkoutSession,
} from "@/src/utils/supabaseData";

function formatTime(seconds) {
  const s = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(s / 60);
  const rest = s % 60;
  return `${mins}:${String(rest).padStart(2, "0")}`;
}

function exerciseWorkSeconds(exercise) {
  return Number(exercise?.time_seconds || 45);
}

function exerciseRestSeconds(exercise) {
  return Number(exercise?.rest_seconds || 45);
}

function exerciseSets(exercise) {
  return Math.max(1, Number(exercise?.sets || 3));
}

function estimateCalories(minutes, completedSets) {
  return Math.max(50, Math.round(Number(minutes || 25) * 6.8 + completedSets * 7));
}

const youtubeExerciseVideos = [
  { match: ["goblet squat"], id: "MeIiIdhvXT4" },
  { match: ["bodyweight squat", "squat"], id: "u-xm0I1Lcgs" },
  { match: ["incline push-up", "incline push up", "push-up", "push up"], id: "IODxDxX7oi4" },
  { match: ["floor press", "chest press"], id: "VmB1G1K7v94" },
  { match: ["shoulder tap"], id: "gWHQpMUd7vw" },
  { match: ["dumbbell row", "row"], id: "roCP6wCXPqo" },
  { match: ["reverse fly"], id: "JoCRRZ3zRtI" },
  { match: ["lat pulldown"], id: "CAwf7n6Luuc" },
  { match: ["biceps curl", "curl"], id: "ykJmrZ5v0Oo" },
  { match: ["triceps dip", "dip"], id: "6kALZikXxLc" },
  { match: ["side plank"], id: "K2VljzCC16g" },
  { match: ["plank"], id: "pSHjTRCQxIw" },
  { match: ["dead bug"], id: "g_BYB0R-4Ws" },
  { match: ["bird dog"], id: "wiFNA3sqjCA" },
  { match: ["bicycle crunch"], id: "9FGilxCbdz8" },
  { match: ["mountain climber"], id: "nmwgirgXLYM" },
  { match: ["jumping jack"], id: "c4DAnQ6DtF8" },
  { match: ["burpee"], id: "TU8QYVW0gDU" },
  { match: ["high knees"], id: "oDdkytliOqE" },
  { match: ["marching"], id: "ZllXIKITzfg" },
  { match: ["shoulder press", "press"], id: "B-aVuyhvLHU" },
  { match: ["lateral raise"], id: "3VcKaXpzqRo" },
  { match: ["front raise"], id: "-t7fuZ0KhDA" },
  { match: ["reverse lunge", "lunge"], id: "QOVaHwm-Q6U" },
  { match: ["romanian deadlift", "deadlift"], id: "JCXUYuzwNrM" },
  { match: ["step-up", "step up"], id: "dQqApCGd5Ss" },
  { match: ["glute bridge"], id: "wPM8icPu6H8" },
];

const youtubeWorkoutFallbacks = [
  { match: ["shoulder", "deltoid"], id: "B-aVuyhvLHU" },
  { match: ["leg", "lower"], id: "u-xm0I1Lcgs" },
  { match: ["hiit", "fat", "cardio"], id: "nmwgirgXLYM" },
  { match: ["pull", "back"], id: "roCP6wCXPqo" },
  { match: ["core", "stability"], id: "pSHjTRCQxIw" },
  { match: ["chest", "push"], id: "IODxDxX7oi4" },
];

const genderVideoOverrides = {
  female: [
    { match: ["squat", "goblet"], id: "R1v152b72lo" },
    { match: ["push-up", "push up"], id: "jWxvty2KROs" },
    { match: ["row"], id: "HEENGjNnB7Q" },
    { match: ["plank"], id: "TvxNkmjdhMM" },
    { match: ["lunge"], id: "QOVaHwm-Q6U" },
    { match: ["shoulder", "press", "raise"], id: "hRJ6tR5-if0" },
    { match: ["glute bridge"], id: "wPM8icPu6H8" },
    { match: ["dead bug", "bird dog", "bicycle"], id: "g_BYB0R-4Ws" },
    { match: ["mountain", "burpee", "jumping"], id: "nmwgirgXLYM" },
  ],
  male: [
    { match: ["squat", "goblet"], id: "u-xm0I1Lcgs" },
    { match: ["push-up", "push up"], id: "IODxDxX7oi4" },
    { match: ["row"], id: "-ulLckHTvBc" },
    { match: ["plank"], id: "pSHjTRCQxIw" },
    { match: ["lunge"], id: "QOVaHwm-Q6U" },
    { match: ["shoulder", "press", "raise"], id: "B-aVuyhvLHU" },
    { match: ["deadlift"], id: "JCXUYuzwNrM" },
    { match: ["curl"], id: "ykJmrZ5v0Oo" },
    { match: ["mountain", "burpee", "jumping"], id: "nmwgirgXLYM" },
  ],
};

function profileVideoGender(profile) {
  const gender = String(profile?.gender || "").toLowerCase();
  if (["female", "femer", "femër", "woman", "women"].some((value) => gender.includes(value))) return "female";
  if (["male", "mashkull", "man", "men"].some((value) => gender.includes(value))) return "male";
  return "";
}

function youtubeEmbedForExercise(exercise, workout, profile) {
  const text = `${exercise?.name || ""} ${workout?.title || ""} ${workout?.category || ""}`.toLowerCase();
  const gender = profileVideoGender(profile);
  const genderHit = genderVideoOverrides[gender]?.find((item) => item.match.some((word) => text.includes(word)));
  const hit = youtubeExerciseVideos.find((item) => item.match.some((word) => text.includes(word)));
  const workoutHit = youtubeWorkoutFallbacks.find((item) => item.match.some((word) => text.includes(word)));
  const id = genderHit?.id || hit?.id || workoutHit?.id || "u-xm0I1Lcgs";
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

function isYouTubeUrl(value) {
  return /youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(String(value || ""));
}

function toYouTubeEmbed(value) {
  const raw = String(value || "");
  const match =
    raw.match(/[?&]v=([^&]+)/) ||
    raw.match(/youtu\.be\/([^?&]+)/) ||
    raw.match(/embed\/([^?&]+)/);
  return match?.[1]
    ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`
    : raw;
}

function pickWorkoutMedia(workout, exercise, profile) {
  const media =
    workout?.workout_media?.find((item) => item.is_primary) ||
    workout?.workout_media?.[0] ||
    null;
  const explicitExerciseVideo = exercise?.fallback ? null : exercise?.video_url;
  const explicitVideo = explicitExerciseVideo || workout?.video_url || null;

  return {
    video:
      explicitExerciseVideo ||
      (media?.media_type === "video" ? media.media_url : null) ||
      workout?.video_url ||
      null,
    image:
      exercise?.image_url ||
      (media?.media_type === "image" ? media.media_url : null) ||
      media?.thumbnail_url ||
      workout?.thumbnail_url ||
      workout?.image_url ||
      null,
    youtube:
      isYouTubeUrl(explicitVideo)
        ? toYouTubeEmbed(explicitVideo)
        : youtubeEmbedForExercise(exercise, workout, profile),
  };
}

function SessionMedia({ workout, exercise, profile }) {
  const media = pickWorkoutMedia(workout, exercise, profile);

  if (media.video && !isYouTubeUrl(media.video)) {
    return (
      <video
        key={media.video}
        src={media.video}
        poster={media.image || undefined}
        className="h-full w-full object-cover"
        controls
        playsInline
      />
    );
  }

  if (media.youtube) {
    return (
      <iframe
        key={media.youtube}
        src={media.youtube}
        title={`${exercise?.name || workout.title} video`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (media.image) {
    return <img src={media.image} alt={exercise?.name || workout.title} className="h-full w-full object-cover" />;
  }

  return (
    <div className="grid h-full place-items-center bg-[#111827] text-[#22c55e]">
      <Dumbbell className="h-16 w-16" />
    </div>
  );
}

function UpcomingSessions() {
  const [sessions, setSessions] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const data = await getUpcomingWorkoutSessions();
      setSessions(data);
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

  if (state === "loading") return <LoadingSpinner label="Loading scheduled sessions..." />;
  if (state === "error") {
    return <EmptyState title="Could not load sessions" description={error} actionLabel="Retry" onAction={load} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="pulse-kicker">Guided training</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Choose a session to start</h1>
        </div>
        <Link href="/workout-plan" className="rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-4 py-2 text-sm font-bold">
          Workout library
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No scheduled sessions yet"
          description="Generate an AI plan first, then start the daily sessions from here."
          actionLabel="Generate plan"
          actionHref="/workout-plan"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/workout/session?workout=${session.workout_id}&session=${session.id}`}
              className="pulse-card block rounded-[1.4rem] p-5 transition hover:-translate-y-0.5 hover:border-[var(--fc-accent)]/35"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-accent)]">
                    {session.status}
                  </p>
                  <h2 className="mt-2 text-xl font-black">{session.title}</h2>
                  <p className="mt-2 text-sm text-[var(--fc-muted)]">
                    {session.scheduled_for ? new Date(session.scheduled_for).toLocaleString() : "Unscheduled"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--fc-muted)]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRunner({ user, profile, workout, initialSessionId }) {
  const exercises = useMemo(() => workout?.exercises || [], [workout]);
  const [session, setSession] = useState(initialSessionId ? { id: initialSessionId } : null);
  const [startedAt, setStartedAt] = useState(null);
  const [index, setIndex] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [phase, setPhase] = useState("idle");
  const [remaining, setRemaining] = useState(exerciseWorkSeconds(exercises[0]));
  const [running, setRunning] = useState(false);
  const [completedSets, setCompletedSets] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const exercise = exercises[index];
  const totalSets = exerciseSets(exercise);
  const totalPossibleSets = exercises.reduce((sum, item) => sum + exerciseSets(item), 0);
  const progress = totalPossibleSets ? Math.round((completedSets.length / totalPossibleSets) * 100) : 0;
  const heartRate = 105 + Math.min(40, completedSets.length * 2);

  useEffect(() => {
    if (!running || phase === "idle" || phase === "complete") return undefined;
    const id = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, running]);

  useEffect(() => {
    if (phase === "rest" && remaining === 0) {
      setPhase("work");
      setRemaining(exerciseWorkSeconds(exercise));
      setRunning(false);
    }
  }, [exercise, phase, remaining]);

  const ensureSession = useCallback(async () => {
    if (session?.id) return session;
    const created = await startWorkoutSession(workout);
    setSession(created);
    return created;
  }, [session, workout]);

  const start = async () => {
    setError("");
    try {
      await ensureSession();
      setStartedAt((current) => current || new Date());
      setPhase("work");
      setRemaining((current) => (current > 0 ? current : exerciseWorkSeconds(exercise)));
      setRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const resetTimer = () => {
    setRunning(false);
    setPhase("idle");
    setRemaining(exerciseWorkSeconds(exercise));
  };

  const moveNextExercise = () => {
    if (index + 1 >= exercises.length) {
      setPhase("complete");
      setRunning(false);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setSetNo(1);
    setPhase("idle");
    setRunning(false);
    setRemaining(exerciseWorkSeconds(exercises[nextIndex]));
  };

  const completeSet = () => {
    if (!exercise) return;
    setCompletedSets((current) => [
      ...current,
      {
        exercise: exercise.name,
        set: setNo,
        at: new Date().toISOString(),
      },
    ]);
    setRunning(false);
    if (setNo < totalSets) {
      setSetNo((value) => value + 1);
      setPhase("rest");
      setRemaining(exerciseRestSeconds(exercise));
      return;
    }
    moveNextExercise();
  };

  const skipExercise = () => {
    if (exercise) {
      setSkipped((current) => [...current, { exercise: exercise.name, at: new Date().toISOString() }]);
    }
    moveNextExercise();
  };

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      const started = startedAt || new Date();
      const duration = Math.max(1, Math.round((Date.now() - started.getTime()) / 60000));
      const calories = estimateCalories(duration, completedSets.length);
      const saved = await completeWorkout(user.id, workout, {
        session_id: session?.id || initialSessionId || null,
        duration_minutes: duration,
        calories_burned: calories,
        rating,
        notes,
      });
      setDone(saved);
      setPhase("complete");
      setRunning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!exercise && !done) {
    return (
      <EmptyState
        title="This workout has no exercises"
        description="Regenerate your AI plan or choose another workout with exercise steps."
        actionLabel="Back to workouts"
        actionHref="/workout-plan"
      />
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-white">
        <div className="pulse-card rounded-[1.6rem] p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--fc-accent)]" />
          <h1 className="mt-4 text-3xl font-black">Workout saved</h1>
          <p className="mt-2 text-sm text-[var(--fc-muted)]">
            {done.workout_title} - {done.duration_minutes} min - {done.calories_burned} kcal estimated
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard" className="rounded-full bg-[var(--fc-accent)] px-5 py-3 text-sm font-black text-[var(--fc-accent-ink)]">
              Dashboard
            </Link>
            <Link href="/workout-plan" className="rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-5 py-3 text-sm font-bold">
              More workouts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 text-[#171717] sm:px-5 lg:px-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link href="/workout-plan" className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-4 py-2 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" />
          Workouts
        </Link>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#6b7280]">
          {progress}% complete
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="overflow-hidden rounded-[1.6rem] bg-white p-4 shadow-[0_12px_30px_rgba(17,24,39,0.08)] sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#22c55e]">
            {workout.category || "Guided session"}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{workout.title}</h1>
          <p className="mt-2 text-sm leading-7 text-[#6b7280]">{workout.description}</p>

          <div className="mt-4 aspect-video overflow-hidden rounded-[1.2rem] bg-[#111827]">
            <SessionMedia workout={workout} exercise={exercise} profile={profile} />
          </div>

          <div className="mt-4 rounded-[1.2rem] bg-[#f3f4f6] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b7280]">
                  Exercise {index + 1} / {exercises.length}
                </p>
                <h2 className="mt-2 text-2xl font-black">{exercise.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[#6b7280]">{exercise.notes || "Move smoothly and keep control."}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs text-[#6b7280]">Set</p>
                <p className="text-2xl font-black">{setNo}/{totalSets}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#4ade80_0deg,#4ade80_220deg,#e5e7eb_220deg)] p-2 sm:h-52 sm:w-52">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#6b7280]">
                    {phase === "rest" ? "Rest" : phase === "work" ? "Work" : "Ready"}
                  </p>
                  <p className="mt-2 text-5xl font-black sm:text-6xl">{formatTime(remaining)}</p>
                </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {!running ? (
                <button type="button" onClick={start} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#22c55e] px-5 py-3 text-sm font-black text-white transition hover:brightness-110">
                  <Play className="h-4 w-4" />
                  {phase === "idle" ? "Start" : "Resume"}
                </button>
              ) : (
                <button type="button" onClick={() => setRunning(false)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-3 text-sm font-bold">
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              )}
              <button type="button" onClick={completeSet} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Complete set
              </button>
              <button type="button" onClick={skipExercise} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-3 text-sm font-bold">
                <SkipForward className="h-4 w-4" />
                Skip exercise
              </button>
              <button type="button" onClick={resetTimer} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-5 py-3 text-sm font-bold">
                <RotateCcw className="h-4 w-4" />
                Reset timer
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b7280]">Session stats</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[#f3f4f6] p-4">
                <Dumbbell className="h-4 w-4 text-[#22c55e]" />
                <p className="mt-2 text-xl font-black">{completedSets.length}</p>
                <p className="text-xs text-[#6b7280]">sets</p>
              </div>
              <div className="rounded-2xl bg-[#f3f4f6] p-4">
                <Clock3 className="h-4 w-4 text-[#22c55e]" />
                <p className="mt-2 text-xl font-black">{workout.duration_minutes || "--"}</p>
                <p className="text-xs text-[#6b7280]">planned min</p>
              </div>
              <div className="rounded-2xl bg-[#f3f4f6] p-4">
                <Flame className="h-4 w-4 text-[#22c55e]" />
                <p className="mt-2 text-xl font-black">{estimateCalories(workout.duration_minutes, completedSets.length)}</p>
                <p className="text-xs text-[#6b7280]">kcal est</p>
              </div>
            </div>
            <div className="mt-2 rounded-2xl bg-[#f3f4f6] p-3">
              <p className="text-xs font-bold text-[#6b7280]">Heart rate</p>
              <p className="text-xl font-black">{heartRate} bpm</p>
            </div>
          </div>

          <div className="rounded-[1.4rem] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b7280]">Finish workout</p>
            <label className="mt-4 block text-sm font-semibold">
              Rating
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={value <= rating ? "text-[var(--fc-accent)]" : "text-[var(--fc-muted)]"}
                    aria-label={`Rate ${value}`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:ring-4 focus:ring-emerald-100"
                placeholder="Energy, form wins, anything to remember..."
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={finish}
              className="mt-4 w-full rounded-full bg-[#22c55e] px-5 py-3 text-sm font-black text-white transition hover:brightness-110 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Finish and save"}
            </button>
            {skipped.length ? (
              <p className="mt-3 text-xs text-[var(--fc-muted)]">{skipped.length} exercise skipped in this session.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SessionContent({ user, profile }) {
  const searchParams = useSearchParams();
  const workoutId = searchParams?.get("workout") || "";
  const sessionId = searchParams?.get("session") || "";
  const [workout, setWorkout] = useState(null);
  const [state, setState] = useState(workoutId ? "loading" : "choose");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workoutId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setState("loading");
      setError("");
      getWorkoutById(workoutId)
        .then((data) => {
          if (cancelled) return;
          setWorkout(data);
          setState(data ? "ready" : "missing");
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : String(err));
          setState("error");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  if (!workoutId) return <UpcomingSessions />;
  if (state === "loading") return <LoadingSpinner label="Preparing workout session..." />;
  if (state === "error") {
    return <EmptyState title="Could not load workout" description={error} actionLabel="Back to workouts" actionHref="/workout-plan" />;
  }
  if (state === "missing" || !workout) {
    return <EmptyState title="Workout not found" description="Choose a workout from the library." actionLabel="Back to workouts" actionHref="/workout-plan" />;
  }
  return <SessionRunner user={user} profile={profile} workout={workout} initialSessionId={sessionId} />;
}

function WorkoutSessionPageInner() {
  return (
    <ProtectedRoute>
      {({ user, profile }) => <SessionContent user={user} profile={profile} />}
    </ProtectedRoute>
  );
}

export default function WorkoutSessionPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Opening session..." />}>
      <WorkoutSessionPageInner />
    </Suspense>
  );
}
