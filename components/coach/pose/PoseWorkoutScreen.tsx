"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ShieldAlert, Sparkles } from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { FormExercise, FormPhase } from "@/lib/pose/formHeuristics";
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
  duration_seconds?: number | null;
  completed_at?: string | null;
  created_at: string;
};

type MovementConfig = {
  id: FormExercise;
  label: string;
  short: string;
  setup: string;
  focus: string;
  checks: string[];
  metrics: Array<{
    key: string;
    label: string;
  }>;
  countable: boolean;
  metricLabel?: string;
  metricKey?: string;
};

const MOVEMENTS: MovementConfig[] = [
  {
    id: "squat",
    label: "Squat",
    short: "Depth, knees, torso",
    setup: "Face the camera and step back until shoulders, hips, knees, and ankles are visible.",
    focus: "Squat coach checks depth, knee tracking, hip position, and torso control.",
    checks: ["Knee angle", "Hip depth", "Knees over toes", "Torso lean"],
    metrics: [
      { key: "knee_angle", label: "Knee angle" },
      { key: "hip_angle", label: "Hip angle" },
      { key: "depth", label: "Depth" },
      { key: "torso_lean", label: "Torso lean" },
    ],
    countable: true,
    metricLabel: "Knee angle",
    metricKey: "knee_angle",
  },
  {
    id: "lunge",
    label: "Lunge",
    short: "Knee stack, hips, torso",
    setup: "Use a side or slight diagonal angle. Keep the full lower body visible.",
    focus: "Lunge coach checks front knee bend, knee stack, hip level, and upright torso.",
    checks: ["Front knee angle", "Knee over foot", "Hip level", "Torso lean"],
    metrics: [
      { key: "front_knee_angle", label: "Front knee" },
      { key: "knee_shift", label: "Knee shift" },
      { key: "torso_lean", label: "Torso lean" },
      { key: "hip_angle", label: "Hip angle" },
    ],
    countable: true,
    metricLabel: "Front knee",
    metricKey: "front_knee_angle",
  },
  {
    id: "pushup",
    label: "Push-up",
    short: "Body line, elbows, depth",
    setup: "Use a side angle if possible. Keep shoulders, hips, and hands visible.",
    focus: "Push-up coach checks elbow bend, body line, hand position, and even pressing.",
    checks: ["Elbow depth", "Body line", "Hands under shoulders", "Even shoulders"],
    metrics: [
      { key: "elbow_angle", label: "Elbow angle" },
      { key: "body_angle", label: "Body line" },
      { key: "wrist_shift", label: "Hand shift" },
      { key: "shoulder_angle", label: "Shoulder angle" },
    ],
    countable: true,
    metricLabel: "Elbow angle",
    metricKey: "elbow_angle",
  },
  {
    id: "plank",
    label: "Plank",
    short: "Body line and hip position",
    setup: "Use a side angle. Keep shoulders, hips, and ankles visible.",
    focus: "Plank coach checks hold time, straight body line, and whether hips drop or rise.",
    checks: ["Hold phase", "Shoulder-hip-ankle line", "Hip height", "Steady posture"],
    metrics: [
      { key: "body_angle", label: "Body line" },
      { key: "hip_offset", label: "Hip offset" },
      { key: "shoulder_angle", label: "Shoulder angle" },
      { key: "confidence", label: "Tracking" },
    ],
    countable: false,
    metricLabel: "Body angle",
    metricKey: "body_angle",
  },
  {
    id: "shoulder_press",
    label: "Shoulder press",
    short: "Wrist stack, lockout",
    setup: "Face the camera with both shoulders, elbows, and wrists visible.",
    focus: "Shoulder press coach checks wrist-over-elbow stack, lockout, and leaning back.",
    checks: ["Elbow extension", "Wrist stack", "Overhead finish", "Rib/torso lean"],
    metrics: [
      { key: "elbow_angle", label: "Elbow angle" },
      { key: "shoulder_angle", label: "Shoulder angle" },
      { key: "wrist_elbow_stack", label: "Wrist stack" },
      { key: "rib_lean", label: "Torso lean" },
    ],
    countable: true,
    metricLabel: "Elbow angle",
    metricKey: "elbow_angle",
  },
  {
    id: "biceps_curl",
    label: "Biceps curl",
    short: "Elbow control, symmetry",
    setup: "Face the camera and keep shoulders, elbows, and wrists visible.",
    focus: "Biceps curl coach checks curl range, elbow drift, arm symmetry, and control.",
    checks: ["Elbow bend", "Elbows stay close", "Left/right symmetry", "No swinging"],
    metrics: [
      { key: "elbow_angle", label: "Elbow angle" },
      { key: "elbow_drift", label: "Elbow drift" },
      { key: "asymmetry", label: "Arm symmetry" },
      { key: "shoulder_angle", label: "Shoulder angle" },
    ],
    countable: true,
    metricLabel: "Elbow angle",
    metricKey: "elbow_angle",
  },
  {
    id: "jumping_jack",
    label: "Jumping jack",
    short: "Open/close rhythm",
    setup: "Step back so hands and feet stay visible through the full movement.",
    focus: "Jumping jack coach checks open/close rhythm, stance width, arms overhead, and soft landings.",
    checks: ["Feet open/close", "Arms overhead", "Rhythm", "Full body in frame"],
    metrics: [
      { key: "width_ratio", label: "Stance width" },
      { key: "arms_overhead", label: "Arms overhead" },
      { key: "shoulder_angle", label: "Shoulder angle" },
      { key: "confidence", label: "Tracking" },
    ],
    countable: true,
    metricLabel: "Stance width",
    metricKey: "width_ratio",
  },
  {
    id: "general",
    label: "General form",
    short: "Full-body alignment",
    setup: "Keep your full body in frame for general posture feedback.",
    focus: "General form checks posture, body framing, hips, knees, and overall control.",
    checks: ["Full body visible", "Hip level", "Knee tracking", "Posture"],
    metrics: [
      { key: "confidence", label: "Tracking" },
      { key: "visible_keypoints", label: "Keypoints" },
      { key: "hip_angle", label: "Hip angle" },
      { key: "knee_angle", label: "Knee angle" },
    ],
    countable: false,
  },
];

const REP_COUNTERS: Partial<Record<FormExercise, { arm: FormPhase; count: FormPhase; message: string }>> = {
  squat: { arm: "bottom", count: "standing", message: "Rep counted - good return to standing." },
  lunge: { arm: "bottom", count: "standing", message: "Rep counted - strong return from the lunge." },
  pushup: { arm: "bottom", count: "top", message: "Rep counted - strong press to the top." },
  shoulder_press: { arm: "down", count: "top", message: "Rep counted - clean overhead press." },
  biceps_curl: { arm: "down", count: "top", message: "Rep counted - good curl finish." },
  jumping_jack: { arm: "open", count: "closed", message: "Rep counted - good open/close rhythm." },
};

const MANUAL_CUES: Record<FormExercise, string[]> = {
  squat: [
    "Good squat rep - keep knees tracking over toes.",
    "Control the lowering phase before driving up.",
    "Keep chest proud and weight balanced through mid-foot.",
  ],
  lunge: [
    "Good lunge rep - keep the front knee stacked over the foot.",
    "Stay tall through the torso as you lower.",
    "Push through the front foot and keep hips level.",
  ],
  pushup: [
    "Good push-up rep - keep shoulders, hips, and ankles in one line.",
    "Lower with control and press evenly through both arms.",
    "Keep hands close under the shoulders.",
  ],
  plank: [
    "Good plank hold - keep hips level and breathe steadily.",
    "Brace your core and keep shoulders, hips, and ankles aligned.",
    "Keep the hold steady without letting hips drop.",
  ],
  shoulder_press: [
    "Good press - stack wrists over elbows as you move overhead.",
    "Keep ribs down and avoid leaning back.",
    "Finish tall, then lower with control.",
  ],
  biceps_curl: [
    "Good curl rep - keep elbows close and avoid swinging.",
    "Curl both arms at the same speed.",
    "Lower slowly so the elbow angle opens with control.",
  ],
  jumping_jack: [
    "Good jumping jack - open feet and reach arms overhead.",
    "Keep the rhythm smooth and land softly.",
    "Bring feet back under hips before the next rep.",
  ],
  general: [
    "Good movement check - keep full body visible and move smoothly.",
    "Keep posture tall and control the tempo.",
    "Stay centered in the frame for cleaner tracking.",
  ],
};

function phaseLabel(phase: FormPhase) {
  switch (phase) {
    case "not_detected":
      return "Not detected";
    case "standing":
    case "top":
    case "open":
      return "Up";
    case "bottom":
    case "down":
    case "closed":
      return "Down";
    case "hold":
      return "Hold";
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
  if (key === "arms_overhead") return value >= 1 ? "Yes" : "No";
  if (key === "visible_keypoints") return `${Math.round(value)}/17`;
  if (key === "confidence") return `${Math.round(value * 100)}%`;
  if (key === "width_ratio" || key === "knee_ankle_ratio") return `${value.toFixed(2)}x`;
  if (key.includes("angle") || key === "asymmetry") return `${Math.round(value)} deg`;
  if (
    key.includes("shift") ||
    key.includes("lean") ||
    key.includes("offset") ||
    key.includes("drift") ||
    key === "depth"
  ) {
    return `${Math.round(Math.abs(value) * 100)}%`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function PoseWorkoutScreen() {
  const [cameraActive, setCameraActive] = useState(false);
  const [targetExercise, setTargetExercise] = useState<FormExercise>("squat");
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(82);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [phase, setPhase] = useState<FormPhase>("unknown");
  const [lastMetrics, setLastMetrics] = useState<Record<string, number> | null>(null);
  const [history, setHistory] = useState<PoseHistoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [aiSummary, setAiSummary] = useState<{
    headline: string;
    summary: string;
    focus_next: string;
    cues: string[];
  } | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<FormPhase>("unknown");
  const repArmedRef = useRef(false);
  const selectedMovement =
    MOVEMENTS.find((movement) => movement.id === targetExercise) || MOVEMENTS[0];

  const pushFeedback = useCallback((line: string) => {
    if (!line.trim()) return;
    setFeedback((prev) => (prev[0] === line ? prev : [line, ...prev].slice(0, 5)));
  }, []);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setCameraActive(active);
    if (active && !sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
  }, []);

  const handleFormAnalysis = useCallback(
    (analysis: {
      status: string;
      headline: string;
      tips: string[];
      phase: FormPhase;
      score: number;
      metrics?: Record<string, number>;
    }) => {
      if (!sessionStartedAtRef.current) {
        sessionStartedAtRef.current = Date.now();
      }
      setPhase(analysis.phase);
      setLastMetrics(analysis.metrics || null);
      setFormScore((current) => Math.round(current * 0.65 + analysis.score * 0.35));

      const counter = REP_COUNTERS[targetExercise];
      if (counter) {
        if (analysis.phase === counter.arm && lastPhaseRef.current !== counter.arm) {
          repArmedRef.current = true;
        }
        if (analysis.phase === counter.count && repArmedRef.current) {
          repArmedRef.current = false;
          setReps((current) => current + 1);
          pushFeedback(counter.message);
        }
      }
      lastPhaseRef.current = analysis.phase;

      pushFeedback([analysis.headline, ...analysis.tips].join(" - "));
    },
    [pushFeedback, targetExercise],
  );

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

  useEffect(() => {
    if (!cameraActive) return undefined;
    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
    const updateDuration = () => {
      if (sessionStartedAtRef.current) {
        setDurationSeconds(Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
      }
    };
    updateDuration();
    const intervalId = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(intervalId);
  }, [cameraActive]);

  const logRep = () => {
    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
    setReps((r) => r + 1);
    const cues = MANUAL_CUES[targetExercise] || MANUAL_CUES.general;
    pushFeedback(cues[Math.floor(Math.random() * cues.length)] ?? "Great form");
  };

  const resetSessionStats = () => {
    setReps(0);
    setFormScore(82);
    setPhase("unknown");
    setLastMetrics(null);
    setAiSummary(null);
    setSavedNotice("");
    sessionStartedAtRef.current = cameraActive ? Date.now() : null;
    setDurationSeconds(0);
    lastPhaseRef.current = "unknown";
    repArmedRef.current = false;
    setFeedback([]);
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
      const summaryResponse = await fetch("/api/coach/pose-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_name: selectedMovement.label,
          exercise_type: targetExercise,
          movement: targetExercise,
          reps,
          score: formScore,
          duration_seconds: safeDuration,
          cues: feedback,
        }),
      });
      const summaryData = (await summaryResponse.json().catch(() => ({}))) as {
        summary?: typeof aiSummary;
      };
      const coachSummary = summaryResponse.ok ? summaryData.summary : null;
      if (coachSummary) setAiSummary(coachSummary);

      await savePoseSession({
        exercise_name: selectedMovement.label,
        exercise_type: targetExercise,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_seconds: safeDuration,
        reps,
        score: formScore,
        cues: feedback,
        summary: coachSummary?.summary ||
          (formScore >= 85
            ? "Strong form quality. Keep the same tempo next session."
            : "Useful movement check. Focus on the latest cues before adding intensity."),
      });
      await loadHistory();
      setSavedNotice("Form session saved to history.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="pulse-kicker">Pose lab</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Camera session with live skeleton coaching.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--fc-muted)]">
          Pick a movement, let MoveNet read your skeleton, and get live cues for reps, depth, and alignment.
        </p>
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="fc-glass rounded-[1.25rem] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-muted)]">Movement coach</p>
                <h2 className="mt-2 text-xl font-black text-white">{selectedMovement.label}</h2>
              </div>
              <span className="rounded-full border border-[var(--fc-border)] bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--fc-muted)]">
                {selectedMovement.countable ? "Auto reps" : "Form hold"}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {MOVEMENTS.map((movement) => (
                <button
                  key={movement.id}
                  type="button"
                  onClick={() => {
                    setTargetExercise(movement.id);
                    resetSessionStats();
                  }}
                  className={cn(
                    "min-h-22 rounded-2xl border p-3 text-left transition",
                    targetExercise === movement.id
                      ? "border-[var(--fc-accent)]/45 bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_14px_34px_rgba(184,245,61,0.14)]"
                      : "border-[var(--fc-border)] bg-black/20 text-[var(--fc-muted)] hover:border-white/15 hover:text-white",
                  )}
                >
                  <span className="block text-sm font-black">{movement.label}</span>
                  <span className="mt-1 block text-xs font-semibold opacity-80">{movement.short}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--fc-muted)]">
              {selectedMovement.setup}
            </p>
            <div className="mt-3 rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--fc-muted)]">
                What AI checks
              </p>
              <p className="mt-2 text-sm leading-6 text-white">{selectedMovement.focus}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {selectedMovement.checks.map((check) => (
                  <span
                    key={check}
                    className="rounded-full border border-[var(--fc-border)] bg-black/25 px-3 py-2 text-xs font-bold text-[var(--fc-muted)]"
                  >
                    {check}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="fc-glass overflow-hidden rounded-[1.75rem] ring-1 ring-white/[0.05]">
            <PoseCameraPreview
              formFeedback
              enablePoseDetection
              targetExercise={targetExercise}
              onCameraActiveChange={handleCameraActiveChange}
              onFormAnalysis={handleFormAnalysis}
              className="border-none bg-black/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-accent)]/25 bg-[var(--fc-accent)]/10 px-4 py-2 text-sm font-black text-[var(--fc-accent)]">
              <Sparkles className="h-4 w-4" />
              {cameraActive ? "AI pose coach is tracking live" : "AI pose coach starts with camera"}
            </div>
            <Button type="button" variant="secondary" onClick={logRep}>
              Log rep + cue
            </Button>
            <Button type="button" variant="ghost" onClick={() => resetSessionStats()}>
              Reset form stats
            </Button>
            <Button type="button" onClick={saveSession} loading={saving} disabled={saving}>
              Save form session
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="fc-glass rounded-[1.75rem] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-muted)]">Session</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--fc-border)] bg-black/25 p-4">
                <p className="text-xs text-[var(--fc-muted)]">Rep counter</p>
                <p className="mt-2 text-4xl font-black text-[var(--fc-accent-strong)]">{reps}</p>
              </div>
              <div className="rounded-2xl border border-[var(--fc-border)] bg-black/25 p-4">
                <p className="text-xs text-[var(--fc-muted)]">Form score</p>
                <p className="mt-2 text-4xl font-black text-white">{formScore}</p>
              </div>
              <div className="rounded-2xl border border-[var(--fc-border)] bg-black/25 p-4">
                <p className="text-xs text-[var(--fc-muted)]">Duration</p>
                <p className="mt-2 text-4xl font-black text-white">{formatDuration(durationSeconds)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--fc-muted)]">Movement</span>
                <span className="text-sm font-black text-white">
                  {selectedMovement.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--fc-muted)]">Live phase</span>
                <span className="rounded-full bg-[var(--fc-accent)]/12 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--fc-accent)]">
                  {phaseLabel(phase)}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedMovement.metrics.map((metric) => {
                  const value = lastMetrics?.[metric.key];
                  return (
                    <div
                      key={metric.key}
                      className="rounded-xl border border-[var(--fc-border)] bg-black/20 px-3 py-2"
                    >
                      <p className="text-[11px] font-bold text-[var(--fc-muted)]">{metric.label}</p>
                      <p className="mt-1 text-sm font-black text-white">
                        {typeof value === "number" ? formatMetricValue(metric.key, value) : "--"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-6">
            <div className="flex items-center gap-2 text-[var(--fc-accent)]">
              <Camera className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Coach feedback</p>
            </div>
            <ul className="mt-4 space-y-3">
              {feedback.length ? feedback.map((line, idx) => (
                <li
                  key={`${idx}-${line.slice(0, 24)}`}
                  className={cn(
                    "rounded-xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm text-[var(--fc-muted)]",
                    line.toLowerCase().includes("great") && "border-emerald-500/25 text-emerald-100",
                  )}
                >
                  {line}
                </li>
              )) : (
                <li className="rounded-xl border border-dashed border-[var(--fc-border)] bg-black/10 px-4 py-3 text-sm text-[var(--fc-muted)]">
                  Start the camera. Live {selectedMovement.label.toLowerCase()} cues will appear here when the skeleton detects your movement.
                </li>
              )}
            </ul>
          </div>

          {aiSummary ? (
            <div className="fc-glass rounded-[1.75rem] p-6">
              <div className="flex items-center gap-2 text-[var(--fc-accent)]">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">AI form summary</p>
              </div>
              <h2 className="mt-3 text-lg font-black text-white">{aiSummary.headline}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">{aiSummary.summary}</p>
              <p className="mt-3 rounded-2xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm font-bold text-white">
                Next focus: {aiSummary.focus_next}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--fc-muted)]">
                {aiSummary.cues.slice(0, 3).map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex gap-3 rounded-[1.25rem] border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>
              General movement cues only - not a medical device. Stop if you feel sharp pain, dizziness, or
              instability.
            </p>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-muted)]">Form history</p>
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
                    {item.reps} reps
                    {item.duration_seconds ? ` - ${formatDuration(item.duration_seconds)}` : ""}
                    {" - "}
                    {new Date(item.completed_at || item.created_at).toLocaleDateString()}
                  </p>
                  {item.feedback_summary || item.summary ? (
                    <p className="mt-2 text-sm text-[var(--fc-muted)]">{item.feedback_summary || item.summary}</p>
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
