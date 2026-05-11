"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BadgeCheck, Camera, Play, ShieldAlert, Square } from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type ExerciseTotal,
  type LiveFeedbackItem,
  type RepSummary,
} from "@/lib/pose/autoWorkoutTracker";

type FinalSessionResult = {
  startedAt: string;
  endedAt: string;
  duration: number;
  detectedExercises: AutoExercise[];
  totalReps: number;
  repsByExercise: Record<AutoExercise, ExerciseTotal>;
  formScore: number;
  avgConfidence: number;
  validReps: number;
  partialReps: number;
  feedback: string;
  improvementTips: string[];
  bestCue: string;
  repEvents: RepSummary[];
};

const TRACKED_EXERCISES: AutoExercise[] = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
  "situp",
  "lateral_raise",
  "deadlift",
];

const EXERCISES: AutoExercise[] = ["general", ...TRACKED_EXERCISES];
const panelClass = "rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_16px_42px_rgba(0,0,0,0.22)]";

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function emptyTotals() {
  return EXERCISES.reduce<Record<AutoExercise, ExerciseTotal>>((acc, exercise) => {
    acc[exercise] = {
      exercise,
      label: EXERCISE_LABELS[exercise],
      reps: 0,
      valid_reps: 0,
      invalid_reps: 0,
      partial_reps: 0,
      duration_seconds: 0,
      hold_seconds: 0,
      average_form_score: 0,
      average_confidence: 0,
      issues: [],
      best_rep: null,
      worst_rep: null,
      rep_events: [],
      average_tempo_ms: 0,
      last_rep_at: null,
    };
    return acc;
  }, {} as Record<AutoExercise, ExerciseTotal>);
}

function cleanCueText(item?: LiveFeedbackItem) {
  if (!item?.text) return "";
  return item.text.replace(/^[A-Za-z -]+:\s*/, "");
}

function topExerciseTotals(totals: Record<AutoExercise, ExerciseTotal>) {
  return TRACKED_EXERCISES
    .map((exercise) => totals[exercise])
    .filter((item) => item && (item.reps > 0 || item.hold_seconds > 0 || item.valid_reps > 0))
    .sort((a, b) => {
      const aValue = a.exercise === "plank" ? a.hold_seconds : a.reps;
      const bValue = b.exercise === "plank" ? b.hold_seconds : b.reps;
      return bValue - aValue;
    });
}

function metric(label: string, value: ReactNode, accent = false) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-white/45">{label}</p>
      <p className={cn("mt-1 truncate text-lg font-black text-white", accent ? "text-[var(--fc-accent-strong)]" : "")}>
        {value}
      </p>
    </div>
  );
}

function compactMetric(label: string, value: ReactNode) {
  return (
    <div className="rounded-lg bg-white/[0.045] px-4 py-3">
      <p className="text-xs font-semibold text-white/45">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function detectedExerciseText(state: AutoWorkoutState | null) {
  if (!state || state.activeExercise === "general" || state.detectedExercise === "general") {
    return "Scanning movement";
  }
  return EXERCISE_LABELS[state.activeExercise];
}

function liveCueText(state: AutoWorkoutState | null) {
  if (!state || state.activeExercise === "general") return "Start moving in frame";
  return cleanCueText(state.feedback?.[0]) || state.tips?.[0] || "Keep the movement controlled.";
}

function bestTip(state: AutoWorkoutState | null) {
  return state?.improvementTips?.[0] || state?.tips?.[0] || "Keep full reps smooth and controlled.";
}

export function PoseWorkoutScreen() {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStartSignal, setCameraStartSignal] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState("");
  const [workoutState, setWorkoutState] = useState<AutoWorkoutState | null>(null);
  const [finalSessionResult, setFinalSessionResult] = useState<FinalSessionResult | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const sessionStartedAtRef = useRef<number | null>(null);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setCameraActive(active);
    if (active && !sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
  }, []);

  const handleWorkoutAnalysis = useCallback((analysis: AutoWorkoutState) => {
    if (!sessionStartedAtRef.current) sessionStartedAtRef.current = Date.now();
    setWorkoutState(analysis);
  }, []);

  useEffect(() => {
    if (!cameraActive) return undefined;
    const updateTimer = () => {
      if (sessionStartedAtRef.current) {
        setDurationSeconds(Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
      }
    };
    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [cameraActive]);

  const startSession = useCallback(() => {
    setError("");
    setFinalSessionResult(null);
    setWorkoutState(null);
    setDurationSeconds(0);
    sessionStartedAtRef.current = null;
    setResetKey((value) => value + 1);
    setCameraStartSignal((value) => value + 1);
  }, []);

  const startNewSession = useCallback(() => {
    setCameraActive(false);
    startSession();
  }, [startSession]);

  const buildFinalReport = useCallback((): FinalSessionResult => {
    const now = new Date();
    const startedAt = sessionStartedAtRef.current ? new Date(sessionStartedAtRef.current) : new Date(now.getTime() - durationSeconds * 1000);
    const totals = workoutState?.totals || emptyTotals();
    const detectedExercises = workoutState?.detectedExercises?.length
      ? workoutState.detectedExercises
      : topExerciseTotals(totals).map((item) => item.exercise);
    const feedback = workoutState?.headline || liveCueText(workoutState);

    return {
      startedAt: startedAt.toISOString(),
      endedAt: now.toISOString(),
      duration: Math.max(durationSeconds, Math.round((now.getTime() - startedAt.getTime()) / 1000)),
      detectedExercises,
      totalReps: workoutState?.totalReps || 0,
      repsByExercise: totals,
      formScore: workoutState?.averageFormScore || workoutState?.score || 0,
      avgConfidence: workoutState?.averageConfidence || workoutState?.confidence || 0,
      validReps: workoutState?.validReps || 0,
      partialReps: workoutState?.partialReps || 0,
      feedback,
      improvementTips: workoutState?.improvementTips?.length ? workoutState.improvementTips : [bestTip(workoutState)],
      bestCue: cleanCueText(workoutState?.feedback?.[0]) || bestTip(workoutState),
      repEvents: workoutState?.repEvents || [],
    };
  }, [durationSeconds, workoutState]);

  const endSession = useCallback(() => {
    setFinalSessionResult(buildFinalReport());
    setCameraActive(false);
  }, [buildFinalReport]);

  const report = finalSessionResult;
  const totals = workoutState?.totals || emptyTotals();
  const activeExercise = workoutState?.activeExercise || "general";
  const activeTotal = totals[activeExercise] || totals.general;
  const repsValue = activeExercise === "plank" ? formatDuration(activeTotal.hold_seconds || 0) : workoutState?.totalReps || 0;
  const formScore = Math.round(workoutState?.averageFormScore || workoutState?.score || 0);
  const confidence = Math.round(workoutState?.confidence || 0);
  const cue = liveCueText(workoutState);

  if (report) {
    const detected = report.detectedExercises.length
      ? report.detectedExercises.map((exercise) => EXERCISE_LABELS[exercise]).join(", ")
      : "No exercise detected";
    const tips = report.improvementTips.filter(Boolean).slice(0, 3);

    return (
      <div className="min-h-screen bg-[#070707] px-4 py-5 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fc-accent-strong)]">AI Form Coach</p>
              <h1 className="mt-1 text-3xl font-black">Session report</h1>
            </div>
            <Button type="button" className="w-fit shadow-none" onClick={startNewSession}>
              <Play className="h-4 w-4" />
              Start new session
            </Button>
          </header>

          <section className={cn(panelClass, "p-5 sm:p-6")}>
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--fc-accent)]/12 text-[var(--fc-accent-strong)]">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/55">Session completed</p>
                <h2 className="mt-1 text-2xl font-black">{detected}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{report.feedback}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {compactMetric("Total duration", formatDuration(report.duration))}
              {compactMetric("Total reps", report.totalReps)}
              {compactMetric("Form score", `${Math.round(report.formScore)}/100`)}
              {compactMetric("Confidence", `${Math.round(report.avgConfidence)}%`)}
              {compactMetric("Valid vs partial", `${report.validReps} / ${report.partialReps}`)}
              {compactMetric("Best cue", report.bestCue)}
              {compactMetric("Rep events", report.repEvents.length)}
              {compactMetric("Ended", new Date(report.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}
            </div>
          </section>

          <section className={cn(panelClass, "p-5 sm:p-6")}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Improvement tips</p>
            <div className="mt-3 grid gap-2">
              {tips.map((tip) => (
                <p key={tip} className="rounded-lg bg-white/[0.045] px-4 py-3 text-sm font-semibold leading-6 text-white/72">
                  {tip}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fc-accent-strong)]">AI Form Coach</p>
            <h1 className="mt-1 text-3xl font-black">Automatic workout tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-white">
              {formatDuration(durationSeconds)}
            </div>
            {!cameraActive ? (
              <Button type="button" className="shadow-none" onClick={startSession}>
                <Camera className="h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button type="button" variant="danger" className="shadow-none" onClick={endSession}>
                <Square className="h-4 w-4" />
                End
              </Button>
            )}
          </div>
        </header>

        {error ? <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 ring-1 ring-red-400/20">{error}</div> : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,680px)_380px]">
          <div className={cn(panelClass, "overflow-hidden p-3 sm:p-4")}>
            <PoseCameraPreview
              autoDetect
              selectedExercise="general"
              formFeedback
              enablePoseDetection
              sessionResetKey={resetKey}
              startSignal={cameraStartSignal}
              showHeader={false}
              showTrackingStatus={false}
              feedbackMode="hidden"
              controlsMode="hidden"
              cameraFrameClassName="aspect-video max-h-[500px] min-h-[260px]"
              onCameraActiveChange={handleCameraActiveChange}
              onWorkoutAnalysis={handleWorkoutAnalysis}
              className="!rounded-lg !border-white/10 !bg-[#090909] !p-0 !shadow-none"
            />
          </div>

          <aside className={cn(panelClass, "p-5")}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Live performance</p>
            <h2 className="mt-2 text-2xl font-black">{detectedExerciseText(workoutState)}</h2>

            <div className="mt-6 grid grid-cols-2 gap-5">
              {metric("Reps", repsValue, true)}
              {metric("Form score", `${formScore}/100`)}
              {metric("Confidence", `${confidence}%`)}
              {metric("Phase", String(workoutState?.phase || "Ready"))}
            </div>

            <div className="mt-6 rounded-lg bg-white/[0.045] px-4 py-4">
              <p className="text-xs font-semibold text-white/45">Current cue</p>
              <p className="mt-2 text-base font-black leading-6 text-white">{cue}</p>
            </div>
          </aside>
        </section>

        <section className={cn(panelClass, "grid gap-4 p-4 sm:grid-cols-4")}>
          {compactMetric("Duration", formatDuration(durationSeconds))}
          {compactMetric("Valid reps", workoutState?.validReps || 0)}
          {compactMetric("Partial reps", workoutState?.partialReps || 0)}
          {compactMetric("Best tip", bestTip(workoutState))}
        </section>

        <div className="flex items-start gap-2 pb-2 text-xs leading-5 text-white/40">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Movement-specific coaching only. Stop if you feel pain, dizziness, or instability.</p>
        </div>
      </div>
    </div>
  );
}
