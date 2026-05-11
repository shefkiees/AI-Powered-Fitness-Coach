"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const panelClass =
  "rounded-2xl border border-white/10 bg-[#10140f]/90 shadow-[0_18px_46px_rgba(0,0,0,0.28)] backdrop-blur-xl";
const compactCardClass = "rounded-xl border border-white/10 bg-black/25";

function SectionHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[var(--fc-accent-strong)]">
        {icon}
        <p className="text-[11px] font-black uppercase tracking-[0.18em]">{title}</p>
      </div>
      {action}
    </div>
  );
}

function PrimaryStatCard({
  icon,
  label,
  value,
  helper,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  helper: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn(compactCardClass, "min-h-28 p-4")}>
      <div className="flex items-center gap-2 text-[var(--fc-accent-strong)]">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className={cn("mt-2 truncate text-2xl font-black", accent ? "text-[var(--fc-accent-strong)]" : "text-white")}>
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{helper}</p>
    </div>
  );
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
  const visibleTotals = activeTotals(totals);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 text-slate-100">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--fc-accent-strong)]">Pose lab</p>
          <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">AI Gym Tracker</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Start the camera and move. The tracker detects exercises, counts clean reps, and saves structured workout metrics.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="ghost" className="border border-white/10 bg-white/[0.03] px-4 py-2.5" onClick={resetSessionStats}>
            <RefreshCw className="h-4 w-4" />
            Reset session
          </Button>
          <Button type="button" className="px-4 py-2.5" onClick={saveSession} loading={saving} disabled={saving}>
            <Save className="h-4 w-4" />
            End and save
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
          {error}
        </div>
      ) : null}

      {savedNotice ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          {savedNotice}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <PoseCameraPreview
            autoDetect
            formFeedback
            enablePoseDetection
            sessionResetKey={resetKey}
            onCameraActiveChange={handleCameraActiveChange}
            onWorkoutAnalysis={handleWorkoutAnalysis}
            className="rounded-2xl border-white/10 bg-[#080a08] shadow-[0_20px_56px_rgba(0,0,0,0.34)]"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PrimaryStatCard
              icon={<ScanLine className="h-4 w-4" />}
              label="Detected exercise"
              value={detectedLabel}
              helper={`${confidence}% confidence`}
            />
            <PrimaryStatCard
              icon={<Activity className="h-4 w-4" />}
              label="Phase"
              value={phaseLabel(workoutState?.phase)}
              helper={workoutState?.headline || "Waiting for movement"}
            />
            <PrimaryStatCard
              icon={<Target className="h-4 w-4" />}
              label="Total reps"
              value={totalReps}
              helper="Across all detected exercises"
              accent
            />
            <PrimaryStatCard
              icon={<Timer className="h-4 w-4" />}
              label="Duration"
              value={formatDuration(durationSeconds)}
              helper={`Form score ${Math.round(averageScore) || "--"}`}
            />
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
            <section className={cn(panelClass, "p-4")}>
              <SectionHeading icon={<ListChecks className="h-4 w-4" />} title="Session totals" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTotals.map((total) => (
                  <div
                    key={total.exercise}
                    className={cn(
                      compactCardClass,
                      "p-3 transition",
                      detectedExercise === total.exercise
                        ? "border-[var(--fc-accent)]/45 bg-[var(--fc-accent)]/12"
                        : "border-white/10",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-black text-white">{total.label}</p>
                      {detectedExercise === total.exercise ? (
                        <span className="rounded-full bg-[var(--fc-accent)] px-2 py-0.5 text-[10px] font-black text-white">
                          Live
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-2xl font-black text-[var(--fc-accent-strong)]">
                      {total.exercise === "plank" ? formatDuration(total.hold_seconds) : total.reps}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300">
                      {total.exercise === "plank" ? "hold time" : "reps"}
                      {total.average_form_score ? ` - ${total.average_form_score}/100` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-1">
              <section className={cn(panelClass, "p-4")}>
                <SectionHeading icon={<Eye className="h-4 w-4" />} title="Body visibility" />
                <div className="mt-3 grid gap-2">
                  {(setup?.checklist || SETUP_DEFAULTS).map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold",
                        item.ok
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                          : "border-amber-400/25 bg-amber-400/10 text-amber-100",
                      )}
                    >
                      {item.ok ? <BadgeCheck className="h-4 w-4 shrink-0" /> : <CircleAlert className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(setup?.messages.length ? setup.messages : ["Start camera"]).map((message) => (
                    <span
                      key={message}
                      className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-black text-slate-300"
                    >
                      {message}
                    </span>
                  ))}
                </div>
              </section>

              <section className={cn(panelClass, "p-4")}>
                <SectionHeading icon={<TrendingUp className="h-4 w-4" />} title="Live metrics" />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {topMetricKeys.map((key) => {
                    const value = workoutState?.metrics?.[key];
                    return (
                      <div key={key} className={cn(compactCardClass, "px-3 py-2")}>
                        <p className="text-[11px] font-bold capitalize text-slate-400">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="mt-0.5 text-sm font-black text-white">
                          {typeof value === "number" ? formatMetricValue(key, value) : "--"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className={cn(panelClass, "p-4")}>
            <SectionHeading
              icon={<Camera className="h-4 w-4" />}
              title="Live coaching"
              action={<span className="rounded-full bg-[var(--fc-accent)]/12 px-2.5 py-1 text-[11px] font-black text-[var(--fc-accent-strong)]">{cameraActive ? "Active" : "Ready"}</span>}
            />
            <ul className="mt-3 space-y-2">
              {liveFeedback.length ? liveFeedback.slice(0, 6).map((item) => (
                <li key={item.id} className={cn(compactCardClass, "px-3 py-2.5 text-sm leading-6 text-slate-200")}>
                  <span className="font-black text-white">{EXERCISE_LABELS[item.exercise]}: </span>
                  {item.text.replace(`${EXERCISE_LABELS[item.exercise]}: `, "")}
                </li>
              )) : (
                <li className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-3 text-sm leading-6 text-slate-300">
                  Live cues appear here after the skeleton locks on.
                </li>
              )}
            </ul>
          </section>

          <section className={cn(panelClass, "p-4")}>
            <SectionHeading icon={<CircleAlert className="h-4 w-4" />} title="Common issues" />
            <div className="mt-3 space-y-2">
              {detectedIssues.length ? detectedIssues.slice(0, 5).map((issue) => (
                <div key={issue.issue} className={cn(compactCardClass, "flex items-center justify-between gap-3 px-3 py-2.5 text-sm")}>
                  <span className="min-w-0 truncate font-bold capitalize text-slate-200">{issueLabel(issue.issue)}</span>
                  <span className="rounded-full bg-amber-400/12 px-2 py-0.5 text-xs font-black text-amber-100">
                    {issue.count}
                  </span>
                </div>
              )) : (
                <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-3 text-sm text-slate-300">
                  No repeated form issue has been detected yet.
                </p>
              )}
            </div>
          </section>

          {aiSummary ? (
            <section className={cn(panelClass, "p-4")}>
              <SectionHeading icon={<Sparkles className="h-4 w-4" />} title="AI coach summary" />
              <h2 className="mt-3 text-lg font-black text-white">{aiSummary.headline}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{aiSummary.summary}</p>
              <p className={cn(compactCardClass, "mt-3 px-3 py-2.5 text-sm font-bold text-white")}>
                Next focus: {aiSummary.focus_next}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {aiSummary.cues.slice(0, 4).map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>General movement cues only. Stop if you feel sharp pain, dizziness, or instability.</p>
          </div>

          <section className={cn(panelClass, "p-4")}>
            <SectionHeading icon={<Clock className="h-4 w-4" />} title="Saved sessions" />
            <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className={cn(compactCardClass, "px-3 py-2.5")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold text-white">{item.exercise_name}</p>
                    <span className="rounded-full bg-[var(--fc-accent)]/12 px-2.5 py-1 text-xs font-black text-[var(--fc-accent-strong)]">
                      {Math.round(Number(item.form_score ?? item.score ?? 0))}/100
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {summarizeHistoryTotals(item)}
                    {item.duration_seconds ? ` - ${formatDuration(item.duration_seconds)}` : ""}
                    {" - "}
                    {new Date(item.completed_at || item.created_at).toLocaleDateString()}
                  </p>
                  {item.ai_coach_summary || item.feedback_summary || item.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                      {item.ai_coach_summary || item.feedback_summary || item.summary}
                    </p>
                  ) : null}
                </div>
              ))}
              {history.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-3 text-sm text-slate-300">
                  No saved pose sessions yet.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
