"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Camera,
  CircleAlert,
  Clock,
  Eye,
  ListChecks,
  RefreshCw,
  Save,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type ExerciseTotal,
} from "@/lib/pose/autoWorkoutTracker";
import { getPoseHistory, savePoseSession } from "@/src/services/workoutService";

type PoseHistoryRow = {
  id: string;
  exercise_name: string;
  exercise_type?: string | null;
  reps: number;
  score: number;
  form_score?: number | null;
  summary?: string | null;
  feedback_summary?: string | null;
  ai_coach_summary?: string | null;
  exercise_totals?: Record<string, ExerciseTotal> | null;
  duration_seconds?: number | null;
  completed_at?: string | null;
  created_at: string;
};

type AiSummary = {
  headline: string;
  summary: string;
  focus_next: string;
  cues: string[];
};

const TRACKED_EXERCISES: AutoExercise[] = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
];

const SETUP_DEFAULTS = [
  { label: "Shoulders visible", ok: false },
  { label: "Hips visible", ok: false },
  { label: "Knees visible", ok: false },
  { label: "Ankles visible", ok: false },
  { label: "Hands visible", ok: false },
  { label: "Tracking confidence", ok: false },
];

function phaseLabel(phase?: string) {
  switch (phase) {
    case "standing":
      return "Standing";
    case "bottom":
      return "Bottom";
    case "top":
      return "Top";
    case "down":
      return "Down";
    case "hold":
      return "Hold";
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "not_detected":
      return "Not detected";
    default:
      return "Tracking";
  }
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatMetricValue(key: string, value: number) {
  if (key === "arms_overhead" || key === "setup_ready") return value >= 1 ? "Yes" : "No";
  if (key === "visible_keypoints") return `${Math.round(value)}/17`;
  if (key === "confidence") return `${Math.round(value * 100)}%`;
  if (key.includes("ratio")) return `${value.toFixed(2)}x`;
  if (key.includes("angle") || key === "asymmetry" || key === "range_of_motion") return `${Math.round(value)} deg`;
  if (
    key.includes("shift") ||
    key.includes("lean") ||
    key.includes("offset") ||
    key.includes("drift") ||
    key.includes("depth") ||
    key.includes("motion") ||
    key.includes("stability")
  ) {
    return `${Math.round(Math.abs(value) * 100)}%`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function issueLabel(issue: string) {
  return issue
    .replace(/^jack_/, "jumping jack ")
    .replace(/^curl_/, "curl ")
    .replace(/^press_/, "press ")
    .replace(/^plank_/, "plank ")
    .replace(/_/g, " ");
}

function emptyTotals() {
  return TRACKED_EXERCISES.reduce<Record<AutoExercise, ExerciseTotal>>((totals, exercise) => {
    totals[exercise] = {
      exercise,
      label: EXERCISE_LABELS[exercise],
      reps: 0,
      duration_seconds: 0,
      hold_seconds: 0,
      average_form_score: 0,
      issues: [],
      best_rep: null,
      worst_rep: null,
    };
    return totals;
  }, {} as Record<AutoExercise, ExerciseTotal>);
}

function activeTotals(totals: Record<string, ExerciseTotal>) {
  return TRACKED_EXERCISES.map((exercise) => totals[exercise]).filter(Boolean);
}

function summarizeHistoryTotals(item: PoseHistoryRow) {
  const totals = item.exercise_totals;
  if (!totals || typeof totals !== "object") {
    return `${item.reps || 0} reps`;
  }
  const pieces = TRACKED_EXERCISES.flatMap((exercise) => {
    const total = totals[exercise];
    if (!total) return [];
    if (exercise === "plank" && total.hold_seconds > 0) {
      return [`Plank ${formatDuration(total.hold_seconds)}`];
    }
    if (total.reps > 0) return [`${total.label} ${total.reps}`];
    return [];
  });
  return pieces.length ? pieces.join(" - ") : `${item.reps || 0} reps`;
}

export function PoseWorkoutScreen() {
  const [cameraActive, setCameraActive] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [history, setHistory] = useState<PoseHistoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [workoutState, setWorkoutState] = useState<AutoWorkoutState | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const sessionStartedAtRef = useRef<number | null>(null);

  const totals = useMemo(() => workoutState?.totals || emptyTotals(), [workoutState?.totals]);
  const setup = workoutState?.setup;
  const liveFeedback = workoutState?.feedback || [];
  const detectedIssues = workoutState?.detectedIssues || [];
  const totalReps = workoutState?.totalReps || 0;
  const averageScore = workoutState?.averageFormScore || workoutState?.score || 0;
  const detectedExercise = workoutState?.detectedExercise || "general";
  const detectedLabel = workoutState?.detectedLabel || "Looking for movement";
  const confidence = workoutState?.confidence || 0;

  const loadHistory = useCallback(async () => {
    try {
      setHistory((await getPoseHistory()) as PoseHistoryRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setCameraActive(active);
    if (active && !sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
  }, []);

  const handleWorkoutAnalysis = useCallback((analysis: AutoWorkoutState) => {
    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
    setWorkoutState(analysis);
  }, []);

  useEffect(() => {
    if (!cameraActive) return undefined;
    if (!sessionStartedAtRef.current) sessionStartedAtRef.current = Date.now();
    const updateDuration = () => {
      if (sessionStartedAtRef.current) {
        setDurationSeconds(Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
      }
    };
    updateDuration();
    const intervalId = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(intervalId);
  }, [cameraActive]);

  const resetSessionStats = () => {
    sessionStartedAtRef.current = cameraActive ? Date.now() : null;
    setDurationSeconds(0);
    setWorkoutState(null);
    setAiSummary(null);
    setSavedNotice("");
    setError("");
    setResetKey((current) => current + 1);
  };

  const saveSession = async () => {
    setSaving(true);
    setError("");
    setSavedNotice("");
    try {
      const completedAt = new Date();
      const startedAt = sessionStartedAtRef.current
        ? new Date(sessionStartedAtRef.current)
        : new Date(completedAt.getTime() - durationSeconds * 1000);
      const safeDuration = Math.max(
        durationSeconds,
        Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
      );
      const exerciseTotals = workoutState?.totals || emptyTotals();
      const movementDurations = Object.fromEntries(
        activeTotals(exerciseTotals).map((total) => [
          total.exercise,
          total.exercise === "plank" ? total.hold_seconds : total.duration_seconds,
        ]),
      );
      const commonIssues = workoutState?.detectedIssues || [];
      const feedbackLines = liveFeedback.map((item) => item.text);
      const summaryResponse = await fetch("/api/coach/pose-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_name: "AI Gym Tracker",
          exercise_type: "auto",
          detected_exercises: activeTotals(exerciseTotals)
            .filter((total) => total.reps > 0 || total.hold_seconds > 0)
            .map((total) => total.exercise),
          exercise_totals: exerciseTotals,
          reps: totalReps,
          score: averageScore,
          average_form_score: averageScore,
          duration_seconds: safeDuration,
          movement_durations: movementDurations,
          detected_issues: commonIssues,
          best_reps: workoutState?.bestReps || {},
          worst_reps: workoutState?.worstReps || {},
          cues: feedbackLines.slice(0, 8),
        }),
      });
      const summaryData = (await summaryResponse.json().catch(() => ({}))) as {
        summary?: AiSummary;
      };
      const coachSummary = summaryResponse.ok ? summaryData.summary : null;
      if (coachSummary) setAiSummary(coachSummary);

      await savePoseSession({
        exercise_name: "AI Gym Tracker",
        exercise_type: "auto",
        movement: "auto",
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        ended_at: completedAt.toISOString(),
        duration_seconds: safeDuration,
        reps: totalReps,
        score: averageScore,
        form_score: averageScore,
        exercise_totals: exerciseTotals,
        detected_issues: commonIssues,
        ai_coach_summary: coachSummary?.summary || "",
        feedback_summary:
          coachSummary?.summary ||
          (totalReps > 0
            ? `Tracked ${totalReps} reps across detected movements.`
            : "Tracked an automatic pose session."),
        summary:
          coachSummary?.summary ||
          (totalReps > 0
            ? `Tracked ${totalReps} reps across detected movements.`
            : "Tracked an automatic pose session."),
        cues: feedbackLines,
      });
      await loadHistory();
      setSavedNotice("AI Gym Tracker session saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const topMetricKeys = [
    "knee_angle",
    "elbow_angle",
    "body_angle",
    "ankle_width_ratio",
    "hip_offset",
    "visible_keypoints",
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="pulse-kicker">Pose lab</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            AI Gym Tracker
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fc-muted)]">
            Start the camera and move. The tracker detects the exercise, counts completed reps, and saves only structured workout metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={resetSessionStats}>
            <RefreshCw className="h-4 w-4" />
            Reset session
          </Button>
          <Button type="button" onClick={saveSession} loading={saving} disabled={saving}>
            <Save className="h-4 w-4" />
            End and save
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {savedNotice ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {savedNotice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-4">
          <div className="fc-glass overflow-hidden rounded-[1.75rem] ring-1 ring-white/[0.05]">
            <PoseCameraPreview
              autoDetect
              formFeedback
              enablePoseDetection
              sessionResetKey={resetKey}
              onCameraActiveChange={handleCameraActiveChange}
              onWorkoutAnalysis={handleWorkoutAnalysis}
              className="border-none bg-black/50"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <ScanLine className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Detected</p>
              </div>
              <p className="mt-2 text-xl font-black text-white">{detectedLabel}</p>
              <p className="mt-1 text-xs text-[var(--fc-muted)]">{confidence}% confidence</p>
            </div>
            <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <Activity className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Phase</p>
              </div>
              <p className="mt-2 text-xl font-black text-white">{phaseLabel(workoutState?.phase)}</p>
              <p className="mt-1 text-xs text-[var(--fc-muted)]">{workoutState?.headline || "Waiting for movement"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <Target className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Total reps</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[var(--fc-accent-strong)]">{totalReps}</p>
              <p className="mt-1 text-xs text-[var(--fc-muted)]">Across all detected exercises</p>
            </div>
            <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <Timer className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Duration</p>
              </div>
              <p className="mt-2 text-3xl font-black text-white">{formatDuration(durationSeconds)}</p>
              <p className="mt-1 text-xs text-[var(--fc-muted)]">Form score {Math.round(averageScore) || "--"}</p>
            </div>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-5">
            <div className="flex items-center gap-2 text-[var(--fc-accent)]">
              <ListChecks className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Session totals</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {activeTotals(totals).map((total) => (
                <div
                  key={total.exercise}
                  className={cn(
                    "rounded-2xl border p-4 transition",
                    detectedExercise === total.exercise
                      ? "border-[var(--fc-accent)]/45 bg-[var(--fc-accent)]/12"
                      : "border-[var(--fc-border)] bg-black/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-white">{total.label}</p>
                    {detectedExercise === total.exercise ? (
                      <span className="rounded-full bg-[var(--fc-accent)] px-2 py-0.5 text-[10px] font-black text-[var(--fc-accent-ink)]">
                        Live
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-3xl font-black text-[var(--fc-accent-strong)]">
                    {total.exercise === "plank" ? formatDuration(total.hold_seconds) : total.reps}
                  </p>
                  <p className="mt-1 text-xs text-[var(--fc-muted)]">
                    {total.exercise === "plank" ? "hold duration" : "completed reps"}
                    {total.average_form_score ? ` - ${total.average_form_score}/100` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="fc-glass rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <Eye className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Body visibility</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(setup?.checklist || SETUP_DEFAULTS).map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold",
                      item.ok
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-100",
                    )}
                  >
                    {item.ok ? <BadgeCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(setup?.messages.length ? setup.messages : ["Start camera"]).map((message) => (
                  <span
                    key={message}
                    className="rounded-full border border-[var(--fc-border)] bg-black/25 px-3 py-1.5 text-xs font-black text-[var(--fc-muted)]"
                  >
                    {message}
                  </span>
                ))}
              </div>
            </div>

            <div className="fc-glass rounded-[1.75rem] p-5">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Live metrics</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {topMetricKeys.map((key) => {
                  const value = workoutState?.metrics?.[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-[var(--fc-border)] bg-black/20 px-3 py-2"
                    >
                      <p className="text-[11px] font-bold capitalize text-[var(--fc-muted)]">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        {typeof value === "number" ? formatMetricValue(key, value) : "--"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="fc-glass rounded-[1.75rem] p-6">
            <div className="flex items-center gap-2 text-[var(--fc-accent)]">
              <Camera className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Live coaching</p>
            </div>
            <ul className="mt-4 space-y-3">
              {liveFeedback.length ? liveFeedback.slice(0, 7).map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--fc-muted)]"
                >
                  <span className="font-black text-white">{EXERCISE_LABELS[item.exercise]}: </span>
                  {item.text.replace(`${EXERCISE_LABELS[item.exercise]}: `, "")}
                </li>
              )) : (
                <li className="rounded-xl border border-dashed border-[var(--fc-border)] bg-black/10 px-4 py-3 text-sm text-[var(--fc-muted)]">
                  Live cues appear here after the skeleton locks on.
                </li>
              )}
            </ul>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-6">
            <div className="flex items-center gap-2 text-[var(--fc-accent)]">
              <CircleAlert className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Common issues</p>
            </div>
            <div className="mt-4 space-y-2">
              {detectedIssues.length ? detectedIssues.slice(0, 6).map((issue) => (
                <div
                  key={issue.issue}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm"
                >
                  <span className="font-bold capitalize text-[var(--fc-muted)]">{issueLabel(issue.issue)}</span>
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-black text-amber-100">
                    {issue.count}
                  </span>
                </div>
              )) : (
                <p className="rounded-xl border border-dashed border-[var(--fc-border)] bg-black/10 px-4 py-3 text-sm text-[var(--fc-muted)]">
                  No repeated form issue has been detected yet.
                </p>
              )}
            </div>
          </div>

          {aiSummary ? (
            <div className="fc-glass rounded-[1.75rem] p-6">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">AI coach summary</p>
              </div>
              <h2 className="mt-3 text-lg font-black text-white">{aiSummary.headline}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">{aiSummary.summary}</p>
              <p className="mt-3 rounded-2xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm font-bold text-white">
                Next focus: {aiSummary.focus_next}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--fc-muted)]">
                {aiSummary.cues.slice(0, 4).map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex gap-3 rounded-[1.25rem] border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>
              General movement cues only. Stop if you feel sharp pain, dizziness, or instability.
            </p>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-6">
            <div className="flex items-center gap-2 text-[var(--fc-accent)]">
              <Clock className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Saved sessions</p>
            </div>
            <div className="mt-4 space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--fc-border)] bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.exercise_name}</p>
                    <span className="rounded-full bg-[var(--fc-accent)]/12 px-3 py-1 text-xs font-black text-[var(--fc-accent)]">
                      {Math.round(Number(item.form_score ?? item.score ?? 0))}/100
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--fc-muted)]">
                    {summarizeHistoryTotals(item)}
                    {item.duration_seconds ? ` - ${formatDuration(item.duration_seconds)}` : ""}
                    {" - "}
                    {new Date(item.completed_at || item.created_at).toLocaleDateString()}
                  </p>
                  {item.ai_coach_summary || item.feedback_summary || item.summary ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">
                      {item.ai_coach_summary || item.feedback_summary || item.summary}
                    </p>
                  ) : null}
                </div>
              ))}
              {history.length === 0 ? (
                <p className="text-sm text-[var(--fc-muted)]">No saved pose sessions yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
