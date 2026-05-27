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
  caloriesEstimate: number;
  validReps: number;
  partialReps: number;
  postureIssues: string[];
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
  "burpee",
  "mountain_climber",
  "tricep_dip",
  "high_knees",
  "jumping_squat",
  "calf_raise",
  "side_lunge",
  "russian_twist",
  "bicycle_crunch",
  "leg_raise",
  "wall_sit",
  "superman_hold",
  "glute_bridge",
  "donkey_kick",
  "fire_hydrant",
  "front_raise",
  "bent_over_row",
  "pullup",
  "chinup",
  "toe_touch",
  "side_plank",
  "reverse_crunch",
  "step_up",
  "kettlebell_swing",
  "box_jump",
  "seated_shoulder_press",
  "hammer_curl",
  "arnold_press",
  "flutter_kicks",
  "bear_crawl",
  "skater_jump",
  "inchworm",
  "hip_thrust",
  "sumo_squat",
  "goblet_squat",
  "overhead_tricep_extension",
  "resistance_band_row",
  "lateral_walk",
  "sprint_in_place",
];

const EXERCISES: AutoExercise[] = ["general", ...TRACKED_EXERCISES];
const panelClass = "rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_16px_42px_rgba(0,0,0,0.22)]";

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function estimateCalories(durationSeconds: number, reps: number) {
  const minutes = Math.max(1, durationSeconds / 60);
  return Math.round(minutes * 6.4 + reps * 0.35);
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
    return state?.headline || "Waiting for body detection";
  }
  return `Detected: ${EXERCISE_LABELS[state.activeExercise]}`;
}

function liveCueText(state: AutoWorkoutState | null) {
  if (!state) return "Stand back until full body is visible.";
  if (state.phase === "calibrating") return "Hold still while tracking calibrates.";
  if (state.activeExercise === "general") return state.tips?.[0] || "Ready to analyze movement.";
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
      caloriesEstimate: estimateCalories(durationSeconds, workoutState?.totalReps || 0),
      validReps: workoutState?.validReps || 0,
      partialReps: workoutState?.partialReps || 0,
      postureIssues: (workoutState?.detectedIssues || []).map((item) => item.issue.replace(/_/g, " ")).slice(0, 5),
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
  const isHoldExercise = ["plank", "wall_sit", "superman_hold", "side_plank"].includes(activeExercise);
  const repsValue = isHoldExercise ? formatDuration(activeTotal.hold_seconds || 0) : activeTotal.reps || 0;
  const trackingStarted = Boolean(cameraActive && workoutState?.sessionReady);
  const formScore = trackingStarted ? Math.round(workoutState?.averageFormScore || workoutState?.score || 0) : null;
  const confidence = workoutState ? Math.round(workoutState.confidence || 0) : null;
  const postureQuality = trackingStarted ? Math.round(Number(workoutState?.metrics?.posture_quality || workoutState?.metrics?.score_alignment || 0)) : null;
  const movementStability = trackingStarted ? Math.round(Number(workoutState?.metrics?.movement_stability || workoutState?.metrics?.score_stability || 0)) : null;
  const trackingStable = Boolean(workoutState?.trackingStable && workoutState?.setup?.trackable && (confidence || 0) >= 35);
  const setupMessages = workoutState?.setup?.messages?.length
    ? workoutState.setup.messages
    : ["Stand back until full body is visible", "Ensure good lighting", "Keep camera stable", "Face the camera"];
  const missingJoints = workoutState?.missingJoints || [];
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
              {compactMetric("Calories est.", report.caloriesEstimate)}
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
            <p className="mt-4 text-xs font-semibold leading-5 text-white/40">
              Posture issues observed: {report.postureIssues.length ? report.postureIssues.join(", ") : "none flagged during this session"}.
            </p>
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
            <div className="mb-3 grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs font-semibold text-white/58 sm:grid-cols-2">
              {["Stand back until full body is visible", "Ensure good lighting", "Keep camera stable", "Face the camera"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", trackingStable ? "bg-[var(--fc-accent-strong)]" : "bg-white/24")} />
                  {item}
                </div>
              ))}
            </div>
            <PoseCameraPreview
              autoDetect
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Live performance</p>
                <h2 className="mt-2 text-2xl font-black">{detectedExerciseText(workoutState)}</h2>
              </div>
              <span className={cn("mt-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", trackingStable ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/12 text-amber-100")}>
                {trackingStable ? "Stable" : cameraActive ? "Calibrating" : "Waiting"}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              {metric("Reps", repsValue, true)}
              {metric("Form score", formScore === null ? "Waiting" : `${formScore}/100`)}
              {metric("Confidence", confidence === null ? "--" : `${confidence}%`)}
              {metric("Phase", String(workoutState?.phase || "Ready"))}
              {metric("Posture quality", postureQuality === null ? "Waiting" : `${postureQuality}%`)}
              {metric("Movement stability", movementStability === null ? "Waiting" : `${movementStability}%`)}
            </div>

            <div className="mt-6 rounded-lg bg-white/[0.045] px-4 py-4">
              <p className="text-xs font-semibold text-white/45">Current cue</p>
              <p className="mt-2 text-base font-black leading-6 text-white">{cue}</p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs font-semibold text-white/45">Tracking guidance</p>
              <div className="mt-2 grid gap-1.5">
                {setupMessages.slice(0, 4).map((message) => (
                  <p key={message} className="text-xs font-semibold leading-5 text-white/62">{message}</p>
                ))}
              </div>
              {missingJoints.length ? (
                <p className="mt-2 text-xs font-bold leading-5 text-amber-100">
                  Missing keypoints: {missingJoints.slice(0, 4).join(", ")}
                </p>
              ) : null}
            </div>
          </aside>
        </section>

        <section className={cn(panelClass, "grid gap-4 p-4 sm:grid-cols-4")}>
          {compactMetric("Session total", workoutState?.totalReps || 0)}
          {compactMetric("Current valid reps", activeTotal.valid_reps || 0)}
          {compactMetric("Current partial reps", activeTotal.partial_reps || 0)}
          {compactMetric("Best tip", bestTip(workoutState))}
        </section>

        <div className="flex items-start gap-2 pb-2 text-xs leading-5 text-white/40">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>This application is not medical advice and should not replace professional fitness or healthcare guidance. Stop if you feel pain, dizziness, or instability.</p>
        </div>
      </div>
    </div>
  );
}
