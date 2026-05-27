"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, BadgeCheck, Camera, CheckCircle2, Clock3, Flame, Gauge, Loader2, Play, ShieldAlert, Square, Target, TrendingUp } from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { fetchAiEndpoint } from "@/lib/aiFetch";
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

type AiSessionSummary = {
  headline: string;
  summary: string;
  focus_next: string;
  cues: string[];
  source?: string;
  warning?: string;
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

const ISSUE_LABELS: Record<string, string> = {
  "visibility ankles": "Keep ankles visible so the tracker can judge stance and depth.",
  "visibility knees": "Keep knees visible from start to finish.",
  "visibility hips": "Keep hips in frame so posture feedback stays accurate.",
  "visibility shoulders": "Keep shoulders in frame and square to the camera.",
  "visibility elbows": "Keep elbows visible during arm movements.",
  "visibility wrists": "Keep wrists visible so reps are counted cleanly.",
  "lateral raise short range": "Raise arms closer to shoulder height before lowering.",
  "front raise short range": "Lift arms through the full front-raise range.",
  "squat knee cave": "Push knees out so they track over your toes.",
  "squat partial depth": "Sit lower and finish the full squat depth.",
  "deadlift short hinge": "Hinge hips farther back before standing tall.",
  "pushup shallow depth": "Lower with more control before pressing up.",
  "biceps curl short range": "Fully extend and curl through a complete range.",
  "russian twist short range": "Rotate farther to each side before switching.",
  "rep not counted": "Finish the full range of motion before starting the next rep.",
};

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

function normalizeIssue(issue: string) {
  return issue.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function sentenceCase(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function humanizeIssue(issue: string) {
  const normalized = normalizeIssue(issue);
  if (!normalized) return "";
  return ISSUE_LABELS[normalized] || sentenceCase(normalized);
}

function uniqueList(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function coachText(text: string) {
  let output = text;
  Object.entries(ISSUE_LABELS).forEach(([issue, replacement]) => {
    output = output.replace(new RegExp(issue, "gi"), replacement);
  });
  return output;
}

function exerciseNames(exercises: AutoExercise[]) {
  const names = exercises
    .filter((exercise) => exercise !== "general")
    .map((exercise) => EXERCISE_LABELS[exercise] || exercise.replace(/_/g, " "));
  if (!names.length) return "your movement";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

function summarizeRep(rep: RepSummary | null) {
  if (!rep) return null;
  return {
    exercise: rep.exercise,
    exercise_label: rep.exercise_label,
    score: rep.score,
    confidence: rep.confidence,
    issues: rep.issues?.map(humanizeIssue).filter(Boolean).slice(0, 4) || [],
    partial: Boolean(rep.partial),
    kind: rep.kind,
  };
}

function compactExerciseTotals(report: FinalSessionResult) {
  return Object.entries(report.repsByExercise).reduce<Record<string, unknown>>((acc, [exercise, total]) => {
    if (!total || (total.reps <= 0 && total.hold_seconds <= 0 && total.duration_seconds <= 0)) return acc;
    acc[exercise] = {
      label: total.label,
      reps: total.reps,
      valid_reps: total.valid_reps,
      partial_reps: total.partial_reps,
      duration_seconds: Math.round(total.duration_seconds || 0),
      hold_seconds: Math.round(total.hold_seconds || 0),
      average_form_score: Math.round(total.average_form_score || 0),
      average_confidence: Math.round(total.average_confidence || 0),
      issues: (total.issues || []).map((issue) => ({
        issue: humanizeIssue(issue.issue),
        count: issue.count,
      })),
      best_rep: summarizeRep(total.best_rep),
      worst_rep: summarizeRep(total.worst_rep),
    };
    return acc;
  }, {});
}

function movementDurations(report: FinalSessionResult) {
  return Object.entries(report.repsByExercise).reduce<Record<string, number>>((acc, [exercise, total]) => {
    const seconds = Math.round((total?.hold_seconds || 0) + (total?.duration_seconds || 0));
    if (seconds > 0) acc[exercise] = seconds;
    return acc;
  }, {});
}

function repQualityMaps(report: FinalSessionResult, key: "best_rep" | "worst_rep") {
  return Object.entries(report.repsByExercise).reduce<Record<string, unknown>>((acc, [exercise, total]) => {
    const rep = summarizeRep(total?.[key] || null);
    if (rep) acc[exercise] = rep;
    return acc;
  }, {});
}

function buildLocalSessionSummary(report: FinalSessionResult): AiSessionSummary {
  const score = Math.round(report.formScore || 0);
  const confidence = Math.round(report.avgConfidence || 0);
  const partialRatio = report.validReps > 0 ? report.partialReps / report.validReps : report.partialReps > 0 ? 1 : 0;
  const mainIssue = report.postureIssues[0];
  const exercises = exerciseNames(report.detectedExercises);
  const headline =
    score >= 85 && confidence >= 70
      ? "Strong controlled session."
      : partialRatio > 0.45
        ? "Good effort, but range of motion needs work."
        : mainIssue
          ? "Solid session with one form priority."
          : "Session complete with clean movement data.";
  const summary = [
    `You completed ${report.totalReps} reps across ${exercises} in ${formatDuration(report.duration)}.`,
    `Average form score was ${score}/100 with ${confidence}% tracking confidence.`,
    mainIssue ? `Main coaching pattern: ${mainIssue}` : "No repeated posture issue was flagged.",
    report.partialReps > 0 ? `${report.partialReps} partial reps suggest slowing down and finishing the full range.` : "Rep range looked consistent overall.",
  ].join(" ");
  const focus = mainIssue || (partialRatio > 0.3 ? "Finish the full range before adding speed." : "Keep the same tempo and camera setup next time.");
  const cues = uniqueList([
    report.bestCue,
    mainIssue,
    partialRatio > 0.3 ? "Pause briefly at the end range so reps count cleanly." : "Keep reps smooth and controlled.",
    confidence < 60 ? "Move farther from the camera and keep the full body visible." : "Keep the camera stable for consistent tracking.",
  ].filter(Boolean).map(coachText)).slice(0, 4);

  return {
    headline,
    summary: coachText(summary),
    focus_next: coachText(focus),
    cues,
    source: "local",
  };
}

function normalizeAiSummary(raw: Partial<AiSessionSummary> | undefined, fallback: AiSessionSummary, source?: string, warning?: string): AiSessionSummary {
  const cues = Array.isArray(raw?.cues) ? raw.cues.map((cue) => coachText(String(cue))).filter(Boolean).slice(0, 4) : [];
  return {
    headline: coachText(raw?.headline || fallback.headline),
    summary: coachText(raw?.summary || fallback.summary),
    focus_next: coachText(raw?.focus_next || fallback.focus_next),
    cues: cues.length ? cues : fallback.cues,
    source: source || fallback.source,
    warning,
  };
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

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-200";
  if (score >= 60) return "text-lime-200";
  if (score >= 40) return "text-amber-200";
  return "text-rose-200";
}

function reportMetric(label: string, value: ReactNode, icon: ReactNode, helper?: string) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-white/42">{label}</p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white/70">{icon}</span>
      </div>
      <p className="mt-3 break-words text-2xl font-black leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs font-semibold leading-5 text-white/45">{helper}</p> : null}
    </div>
  );
}

function scoreBar(label: string, value: number, suffix = "/100") {
  const safeValue = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span className="uppercase tracking-[0.12em] text-white/42">{label}</span>
        <span className={scoreTone(safeValue)}>{safeValue}{suffix}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[var(--fc-accent-strong)] transition-all duration-500" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function reportExerciseRows(report: FinalSessionResult) {
  return topExerciseTotals(report.repsByExercise).slice(0, 5);
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
  const [aiSummary, setAiSummary] = useState<AiSessionSummary | null>(null);
  const [aiSummaryState, setAiSummaryState] = useState<"idle" | "loading" | "ready">("idle");
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
    setAiSummary(null);
    setAiSummaryState("idle");
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
      postureIssues: uniqueList((workoutState?.detectedIssues || []).map((item) => humanizeIssue(item.issue)).filter(Boolean)).slice(0, 5),
      feedback,
      improvementTips: workoutState?.improvementTips?.length ? workoutState.improvementTips : [bestTip(workoutState)],
      bestCue: cleanCueText(workoutState?.feedback?.[0]) || bestTip(workoutState),
      repEvents: workoutState?.repEvents || [],
    };
  }, [durationSeconds, workoutState]);

  const generateAiSummary = useCallback(async (sessionReport: FinalSessionResult) => {
    const fallback = buildLocalSessionSummary(sessionReport);
    setAiSummary(null);
    setAiSummaryState("loading");

    try {
      const response = await fetchAiEndpoint("/api/coach/pose-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_name: "AI Form Coach",
          exercise_type: "automatic_form_tracker",
          detected_exercises: sessionReport.detectedExercises
            .filter((exercise) => exercise !== "general")
            .map((exercise) => EXERCISE_LABELS[exercise] || exercise),
          exercise_totals: compactExerciseTotals(sessionReport),
          reps: sessionReport.totalReps,
          average_form_score: Math.round(sessionReport.formScore || 0),
          score: Math.round(sessionReport.formScore || 0),
          duration_seconds: Math.round(sessionReport.duration || 0),
          movement_durations: movementDurations(sessionReport),
          detected_issues: sessionReport.postureIssues.map((issue) => ({ issue, count: 1 })),
          best_reps: repQualityMaps(sessionReport, "best_rep"),
          worst_reps: repQualityMaps(sessionReport, "worst_rep"),
          cues: uniqueList([
            sessionReport.bestCue,
            ...sessionReport.improvementTips,
            ...sessionReport.postureIssues,
          ].filter(Boolean).map(coachText)).slice(0, 8),
        }),
      });

      if (!response.ok) {
        throw new Error("AI summary is unavailable for this session.");
      }

      const data = await response.json() as {
        summary?: Partial<AiSessionSummary>;
        source?: string;
        warning?: string;
      };
      setAiSummary(normalizeAiSummary(data.summary, fallback, data.source, data.warning));
    } catch {
      setAiSummary(fallback);
    } finally {
      setAiSummaryState("ready");
    }
  }, []);

  const endSession = useCallback(() => {
    const sessionReport = buildFinalReport();
    setFinalSessionResult(sessionReport);
    setCameraActive(false);
    void generateAiSummary(sessionReport);
  }, [buildFinalReport, generateAiSummary]);

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
    const coachSummary = aiSummary || buildLocalSessionSummary(report);
    const summaryLoading = aiSummaryState === "loading" && !aiSummary;
    const tips = uniqueList([
      ...coachSummary.cues,
      ...report.improvementTips.map(coachText),
    ].filter(Boolean)).slice(0, 4);
    const summarySource = coachSummary.source && coachSummary.source !== "local" ? "AI generated" : "Smart feedback";
    const exerciseRows = reportExerciseRows(report);
    const issueList = report.postureIssues.length ? report.postureIssues : ["No repeated posture issue was flagged."];
    const validShare = report.validReps + report.partialReps > 0
      ? Math.round((report.validReps / (report.validReps + report.partialReps)) * 100)
      : 0;
    const topExercise = exerciseRows[0];

    return (
      <div className="min-h-screen bg-[#070707] px-4 py-5 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5">
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

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className={cn(panelClass, "overflow-hidden")}>
              <div className="border-b border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">
                        <BadgeCheck className="h-4 w-4" />
                        Session completed
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-white/55">
                        Ended {new Date(report.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-4xl">{summaryLoading ? "Building your session report" : coachSummary.headline}</h2>
                    <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/64">
                      {summaryLoading ? "AI coach is reading your reps, confidence, and form patterns. This report updates automatically." : coachSummary.summary}
                    </p>
                  </div>

                  <div className="w-full shrink-0 rounded-lg border border-[var(--fc-accent-strong)]/20 bg-[var(--fc-accent)]/10 p-4 md:w-52">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/45">Form score</p>
                    <p className={cn("mt-3 text-5xl font-black leading-none", scoreTone(report.formScore))}>{Math.round(report.formScore)}</p>
                    <p className="mt-1 text-xs font-black text-white/45">out of 100</p>
                    <div className="mt-4">{scoreBar("Confidence", report.avgConfidence, "%")}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
                {reportMetric("Duration", formatDuration(report.duration), <Clock3 className="h-4 w-4" />, "Total tracked time")}
                {reportMetric("Total reps", report.totalReps, <Activity className="h-4 w-4" />, topExercise ? `Top: ${topExercise.label}` : "No movement counted")}
                {reportMetric("Valid / partial", `${report.validReps} / ${report.partialReps}`, <CheckCircle2 className="h-4 w-4" />, `${validShare}% valid reps`)}
                {reportMetric("Calories", report.caloriesEstimate, <Flame className="h-4 w-4" />, "Estimated effort")}
              </div>
            </div>

            <aside className={cn(panelClass, "p-5 sm:p-6")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Detected</p>
                  <h3 className="mt-2 text-xl font-black leading-tight text-white">{detected}</h3>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[var(--fc-accent-strong)]">
                  <Gauge className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {scoreBar("Tracking confidence", report.avgConfidence, "%")}
                {scoreBar("Valid rep quality", validShare, "%")}
              </div>
              <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-white/42">Best cue</p>
                <p className="mt-2 text-sm font-black leading-6 text-white">{report.bestCue}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {compactMetric("Rep events", report.repEvents.length)}
                {compactMetric("AI status", summaryLoading ? "Analyzing" : summarySource)}
              </div>
            </aside>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className={cn(panelClass, "p-5 sm:p-6")}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--fc-accent-strong)]/14 text-[var(--fc-accent-strong)]">
                  {summaryLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fc-accent-strong)]">Focus next</p>
                  <h3 className="mt-2 text-2xl font-black leading-tight text-white">
                    {summaryLoading ? "Finding your next priority" : coachSummary.focus_next}
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {(summaryLoading ? ["Analyzing movement quality", "Checking valid vs partial reps", "Preparing real coach cues"] : tips).map((tip, index) => (
                  <div key={tip} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-xs font-black text-white/70">{index + 1}</span>
                    <p className="text-sm font-semibold leading-6 text-white/72">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(panelClass, "p-5 sm:p-6")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Exercise breakdown</p>
                  <h3 className="mt-2 text-xl font-black text-white">What the tracker saw</h3>
                </div>
                <TrendingUp className="h-5 w-5 text-white/45" />
              </div>

              <div className="mt-5 grid gap-3">
                {exerciseRows.length ? exerciseRows.map((item) => {
                  const total = item.exercise === "plank" || item.exercise === "wall_sit" || item.exercise === "superman_hold" || item.exercise === "side_plank"
                    ? formatDuration(item.hold_seconds || item.duration_seconds || 0)
                    : `${item.reps} reps`;
                  const issue = item.issues?.[0]?.issue ? humanizeIssue(item.issues[0].issue) : "No top issue flagged.";
                  return (
                    <div key={item.exercise} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{item.label}</p>
                          <p className="mt-1 text-xs font-semibold text-white/45">{issue}</p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-sm font-black text-white">{total}</p>
                          <p className={cn("text-xs font-black", scoreTone(item.average_form_score))}>{Math.round(item.average_form_score || 0)}/100</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[var(--fc-accent-strong)]" style={{ width: `${Math.max(0, Math.min(100, Math.round(item.average_form_score || 0)))}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-6 text-white/60">
                    No exercise was counted. Start a new session with your full body visible and move slowly through the first reps.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={cn(panelClass, "p-5 sm:p-6")}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/42">Coach feedback</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {issueList.slice(0, 4).map((issue) => (
                <div key={issue} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-sm font-black leading-6 text-white">{issue}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 text-white/40">
              Report uses the final realtime tracker state from this session, including counted reps, partial reps, confidence, and posture issues.
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
