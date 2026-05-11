"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  CheckCircle2,
  CircleAlert,
  Clock,
  Eye,
  FileVideo,
  Gauge,
  ListVideo,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { drawPoseOnCanvas } from "@/lib/pose/drawPose";
import {
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type ExerciseTotal,
  type LiveFeedbackItem,
} from "@/lib/pose/autoWorkoutTracker";
import {
  analyzeUploadedWorkoutVideo,
  labelForVideoAnalysisStatus,
  type VideoAnalysisStatus,
} from "@/lib/pose/video/videoAnalysisService";
import {
  MAX_VIDEO_FILE_SIZE_BYTES,
  SUPPORTED_VIDEO_EXTENSIONS,
  formatVideoFileSize,
  prepareWorkoutVideo,
  revokeWorkoutVideoAsset,
  type VideoUploadAsset,
} from "@/lib/pose/video/videoUploadService";
import {
  summarizeAndSaveVideoAnalysis,
  type PoseAiSummary,
} from "@/lib/pose/video/sessionSummaryService";
import type {
  PoseVideoAnalysisResult,
  VideoAnalysisProgress,
  VideoKeypointSample,
} from "@/lib/pose/video/poseVideoTrackingService";
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

type AiSummary = PoseAiSummary;

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

const quietPanelClass = "rounded-2xl bg-white/[0.035] ring-1 ring-white/[0.08] backdrop-blur-xl";

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

function allExerciseTotals(totals: Record<string, ExerciseTotal>) {
  return TRACKED_EXERCISES.map((exercise) => totals[exercise]).filter(Boolean);
}

function completedExerciseTotals(totals: Record<string, ExerciseTotal>) {
  return allExerciseTotals(totals).filter((total) => total.reps > 0 || total.hold_seconds > 0);
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

function cleanCueText(item?: LiveFeedbackItem) {
  if (!item?.text) return "";
  const label = EXERCISE_LABELS[item.exercise];
  return item.text.replace(`${label}: `, "");
}

function AdvancedSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <details className={cn(quietPanelClass, "group overflow-hidden")}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3 text-sm font-black text-white">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[var(--fc-accent-strong)]">
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/45 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/[0.06] px-5 py-4">{children}</div>
    </details>
  );
}

function MetricPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
      <p className="text-[11px] font-semibold capitalize text-white/45">{label}</p>
      <p className="mt-0.5 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function TrackingOverlay({
  exercise,
  countLabel,
  countValue,
  confidence,
  cue,
}: {
  exercise: string;
  countLabel: string;
  countValue: ReactNode;
  confidence: string;
  cue: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 rounded-2xl bg-black/45 px-4 py-3 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Current exercise</p>
          <p className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{exercise}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-black/45 px-4 py-3 text-right backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Confidence</p>
          <p className="mt-1 text-xl font-black text-[var(--fc-accent-strong)] sm:text-2xl">{confidence}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-end">
        <div className="rounded-2xl bg-black/50 px-5 py-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{countLabel}</p>
          <p className="mt-1 text-6xl font-black leading-none text-white sm:text-7xl">{countValue}</p>
        </div>
        <div className="rounded-2xl bg-black/50 px-5 py-4 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Coach cue</p>
          <p className="mt-2 text-lg font-black leading-7 text-white sm:text-2xl sm:leading-9">{cue}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full bg-[var(--fc-accent)] transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function StatusPill({ status }: { status: VideoAnalysisStatus }) {
  const failed = status === "failed";
  const done = status === "completed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
        failed
          ? "bg-red-500/10 text-red-100"
          : done
            ? "bg-[var(--fc-accent)]/14 text-[var(--fc-accent-strong)]"
            : "bg-white/[0.06] text-white/70",
      )}
    >
      {failed ? <AlertTriangle className="h-3.5 w-3.5" /> : done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      {labelForVideoAnalysisStatus(status)}
    </span>
  );
}

function formatEta(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "Estimating";
  if (seconds <= 1) return "Almost done";
  if (seconds < 60) return `${seconds}s left`;
  return `${Math.ceil(seconds / 60)}m left`;
}

function nearestKeypointSample(samples: VideoKeypointSample[], timeSeconds: number) {
  if (!samples.length) return null;
  return samples.reduce((nearest, sample) =>
    Math.abs(sample.timeSeconds - timeSeconds) < Math.abs(nearest.timeSeconds - timeSeconds)
      ? sample
      : nearest,
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
  const [videoStatus, setVideoStatus] = useState<VideoAnalysisStatus>("idle");
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoAnalysisProgress, setVideoAnalysisProgress] = useState<VideoAnalysisProgress | null>(null);
  const [videoAsset, setVideoAsset] = useState<VideoUploadAsset | null>(null);
  const [videoResult, setVideoResult] = useState<PoseVideoAnalysisResult | null>(null);
  const [videoSummary, setVideoSummary] = useState<AiSummary | null>(null);
  const [videoError, setVideoError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoAssetRef = useRef<VideoUploadAsset | null>(null);
  const videoAbortRef = useRef<AbortController | null>(null);
  const replayVideoRef = useRef<HTMLVideoElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const totals = useMemo(() => workoutState?.totals || emptyTotals(), [workoutState?.totals]);
  const setup = workoutState?.setup;
  const liveFeedback = workoutState?.feedback || [];
  const detectedIssues = workoutState?.detectedIssues || [];
  const totalReps = workoutState?.totalReps || 0;
  const averageScore = workoutState?.averageFormScore || workoutState?.score || 0;
  const detectedExercise = workoutState?.detectedExercise || "general";
  const detectedLabel = workoutState?.detectedLabel || "Finding your movement";
  const confidence = workoutState?.confidence || 0;
  const completedTotals = useMemo(() => completedExerciseTotals(totals), [totals]);
  const activeExerciseTotal = detectedExercise !== "general" ? totals[detectedExercise] : undefined;

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
    return () => {
      videoAbortRef.current?.abort();
      revokeWorkoutVideoAsset(videoAssetRef.current);
    };
  }, []);

  useEffect(() => {
    const video = replayVideoRef.current;
    if (!video || !videoAsset) return;

    if (videoStatus === "completed") {
      video.pause();
      video.currentTime = 0;
      return;
    }

    video.muted = true;
    void video.play().catch(() => undefined);
  }, [videoAsset, videoStatus]);

  useEffect(() => {
    const video = replayVideoRef.current;
    const canvas = skeletonCanvasRef.current;
    if (!showSkeletonOverlay || !videoResult || !video || !canvas) {
      const context = canvas?.getContext("2d");
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
      return undefined;
    }

    let frameId = 0;
    const draw = () => {
      if (!replayVideoRef.current || !skeletonCanvasRef.current) return;
      const sample = nearestKeypointSample(videoResult.keypointSamples, replayVideoRef.current.currentTime);
      if (sample) drawPoseOnCanvas(skeletonCanvasRef.current, replayVideoRef.current, sample.keypoints);
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [showSkeletonOverlay, videoResult]);

  const replaceVideoAsset = (asset: VideoUploadAsset | null) => {
    revokeWorkoutVideoAsset(videoAssetRef.current);
    videoAssetRef.current = asset;
    setVideoAsset(asset);
  };

  const resetVideoAnalysis = () => {
    videoAbortRef.current?.abort();
    videoAbortRef.current = null;
    replaceVideoAsset(null);
    setVideoStatus("idle");
    setVideoUploadProgress(0);
    setVideoAnalysisProgress(null);
    setVideoResult(null);
    setVideoSummary(null);
    setVideoError("");
    setShowSkeletonOverlay(false);
  };

  const analyzeVideoFile = async (file: File) => {
    videoAbortRef.current?.abort();
    const controller = new AbortController();
    videoAbortRef.current = controller;

    replaceVideoAsset(null);
    setVideoStatus("uploading");
    setVideoUploadProgress(0);
    setVideoAnalysisProgress(null);
    setVideoResult(null);
    setVideoSummary(null);
    setVideoError("");
    setShowSkeletonOverlay(false);

    try {
      const asset = await prepareWorkoutVideo(file, (progress) => {
        if (!controller.signal.aborted) setVideoUploadProgress(progress);
      });
      if (controller.signal.aborted) {
        revokeWorkoutVideoAsset(asset);
        return;
      }

      videoAssetRef.current = asset;
      setVideoAsset(asset);
      setVideoStatus("processing");

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      setVideoStatus("analyzing");

      const result = await analyzeUploadedWorkoutVideo(asset, {
        signal: controller.signal,
        onProgress: (progress) => {
          if (controller.signal.aborted) return;
          setVideoAnalysisProgress(progress);
          setVideoStatus(progress.stage === "processing" ? "processing" : "analyzing");
        },
      });
      if (controller.signal.aborted) return;

      setVideoResult(result);
      const { summary } = await summarizeAndSaveVideoAnalysis(asset, result);
      if (controller.signal.aborted) return;

      setVideoSummary(summary);
      setAiSummary(summary);
      setSavedNotice("Video analysis saved.");
      setVideoStatus("completed");
      await loadHistory();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setVideoError(err instanceof Error ? err.message : String(err));
      setVideoStatus("failed");
    } finally {
      if (videoAbortRef.current === controller) videoAbortRef.current = null;
    }
  };

  const handleVideoInput = (file?: File | null) => {
    if (!file) return;
    void analyzeVideoFile(file);
  };

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
        allExerciseTotals(exerciseTotals)
          .filter((total) => total.reps > 0 || total.hold_seconds > 0 || total.duration_seconds > 0)
          .map((total) => [
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
          detected_exercises: allExerciseTotals(exerciseTotals)
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
      setSavedNotice("Session saved.");
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
  const metricRows = topMetricKeys.flatMap((key) => {
    const value = workoutState?.metrics?.[key];
    return typeof value === "number" ? [{ key, value }] : [];
  });
  const countLabel = detectedExercise === "plank" ? "Hold" : "Reps";
  const countValue = detectedExercise === "plank" ? formatDuration(activeExerciseTotal?.hold_seconds || 0) : totalReps;
  const cueText =
    cleanCueText(liveFeedback[0]) ||
    workoutState?.headline ||
    (cameraActive ? "Center your body and settle into the movement." : "Start when you are ready.");
  const showSessionDetails = cameraActive || durationSeconds > 0 || completedTotals.length > 0;
  const videoProgressValue =
    videoStatus === "uploading"
      ? videoUploadProgress
      : videoAnalysisProgress?.percentage || (videoStatus === "completed" ? 100 : 0);
  const videoDetectedLabel = videoAnalysisProgress?.detectedLabel || videoResult?.finalState.detectedLabel || "Waiting for video";
  const videoRepCount = videoAnalysisProgress?.totalReps ?? videoResult?.finalState.totalReps ?? 0;
  const videoConfidence = videoAnalysisProgress?.confidence ?? videoResult?.confidence ?? 0;
  const videoStatusText =
    videoAnalysisProgress?.statusText ||
    (videoStatus === "uploading" ? "Reading video file" : "Drop a workout video to start");
  const videoCompletedTotals = videoResult?.completedTotals || [];
  const videoDuration = videoResult?.durationSeconds || videoAsset?.durationSeconds || 0;

  return (
    <div className="min-h-screen bg-[#070707] px-3 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5">
        <header className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--fc-accent-strong)]">
              AI Form Coach
            </p>
            <h1 className="mt-2 text-4xl font-black leading-none text-white sm:text-5xl">Train in frame.</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="border border-white/10 bg-white/[0.03] px-4 py-2.5 shadow-none hover:bg-white/[0.06]"
              onClick={resetSessionStats}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              type="button"
              className="px-4 py-2.5 shadow-none hover:shadow-none"
              onClick={saveSession}
              loading={saving}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              End
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 ring-1 ring-red-400/20">
            {error}
          </div>
        ) : null}

        {savedNotice ? (
          <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/20">
            {savedNotice}
          </div>
        ) : null}

        <PoseCameraPreview
          autoDetect
          formFeedback
          enablePoseDetection
          sessionResetKey={resetKey}
          showHeader={false}
          showTrackingStatus={false}
          feedbackMode="hidden"
          controlsMode="minimal"
          cameraFrameClassName="aspect-[4/5] min-h-[420px] sm:aspect-video sm:min-h-[520px] lg:min-h-[620px]"
          onCameraActiveChange={handleCameraActiveChange}
          onWorkoutAnalysis={handleWorkoutAnalysis}
          className="!rounded-[2rem] !border-white/10 !bg-[#090909] !p-0 !shadow-none"
          cameraOverlay={
            cameraActive ? (
              <TrackingOverlay
                exercise={detectedLabel}
                countLabel={countLabel}
                countValue={countValue}
                confidence={`${confidence}%`}
                cue={cueText}
              />
            ) : null
          }
        />

        <section className={cn(quietPanelClass, "overflow-hidden")}>
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-[var(--fc-accent-strong)]">
                <FileVideo className="h-4 w-4" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em]">Upload Workout Video</p>
              </div>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Analyze a saved set.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Upload a workout clip and get the same rep count, form score, cues, and saved history as live tracking.
              </p>
            </div>
            <div className="shrink-0 self-start sm:self-auto">
              <StatusPill status={videoStatus} />
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/[0.06] p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div
              className={cn(
                "relative min-h-[300px] overflow-hidden rounded-[1.5rem] bg-[#050609] ring-1 ring-white/[0.08]",
                dragActive ? "ring-[var(--fc-accent)]/60" : "",
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleVideoInput(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                className="hidden"
                onChange={(event) => {
                  handleVideoInput(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />

              {videoAsset ? (
                <>
                  <video
                    ref={replayVideoRef}
                    src={videoAsset.objectUrl}
                    poster={videoAsset.thumbnailUrl}
                    muted={videoStatus !== "completed"}
                    autoPlay={videoStatus !== "completed"}
                    controls={videoStatus === "completed"}
                    playsInline
                    className="h-full min-h-[300px] w-full object-cover"
                  />
                  <canvas
                    ref={skeletonCanvasRef}
                    className={cn(
                      "pointer-events-none absolute inset-0 h-full w-full object-cover",
                      showSkeletonOverlay ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />

                  {videoStatus !== "completed" ? (
                    <div className="absolute inset-0 flex flex-col justify-between bg-black/50 p-4 backdrop-blur-[2px] sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 rounded-2xl bg-black/45 px-4 py-3 backdrop-blur-md">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Detected</p>
                          <p className="mt-1 truncate text-xl font-black text-white">{videoDetectedLabel}</p>
                        </div>
                        <div className="shrink-0 rounded-2xl bg-black/45 px-4 py-3 text-right backdrop-blur-md">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Confidence</p>
                          <p className="mt-1 text-xl font-black text-[var(--fc-accent-strong)]">{videoConfidence}%</p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-black/55 p-4 backdrop-blur-md">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Reps</p>
                            <p className="mt-1 text-5xl font-black leading-none text-white">{videoRepCount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                              {formatEta(videoAnalysisProgress?.estimatedRemainingSeconds)}
                            </p>
                            <p className="mt-1 text-sm font-bold text-white/70">{videoStatusText}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <ProgressBar value={videoProgressValue} />
                          <p className="mt-2 text-right text-xs font-bold text-white/45">{videoProgressValue}%</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {videoResult?.repMarkers.length ? (
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="relative h-2 rounded-full bg-white/15">
                        {videoResult.repMarkers.map((marker) => (
                          <button
                            key={marker.id}
                            type="button"
                            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--fc-accent)] ring-4 ring-black/55"
                            style={{ left: `${Math.min(100, (marker.timeSeconds / Math.max(1, videoDuration)) * 100)}%` }}
                            aria-label={`Jump to rep ${marker.rep}`}
                            onClick={() => {
                              if (replayVideoRef.current) replayVideoRef.current.currentTime = marker.timeSeconds;
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  className="flex h-full min-h-[300px] w-full flex-col items-center justify-center px-6 text-center transition hover:bg-white/[0.02]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--fc-accent)]/12 text-[var(--fc-accent-strong)]">
                    <Upload className="h-7 w-7" />
                  </span>
                  <span className="mt-5 text-2xl font-black text-white">Drop video here</span>
                  <span className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                    MP4, WebM, or MOV up to {formatVideoFileSize(MAX_VIDEO_FILE_SIZE_BYTES)}
                  </span>
                </button>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/35">Supported formats</p>
                <p className="mt-2 text-sm font-bold text-white">{SUPPORTED_VIDEO_EXTENSIONS.join(", ")}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">Max size {formatVideoFileSize(MAX_VIDEO_FILE_SIZE_BYTES)}</p>
              </div>

              {videoStatus !== "idle" ? (
                <div className="rounded-2xl bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">{videoStatusText}</p>
                    <p className="text-sm font-black text-[var(--fc-accent-strong)]">{videoProgressValue}%</p>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={videoProgressValue} />
                  </div>
                  {videoAnalysisProgress ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <MetricPill label="Frames" value={`${videoAnalysisProgress.processedFrames}/${videoAnalysisProgress.totalFrames}`} />
                      <MetricPill label="ETA" value={formatEta(videoAnalysisProgress.estimatedRemainingSeconds)} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {videoError ? (
                <div className="rounded-2xl bg-red-500/10 p-4 text-sm font-semibold leading-6 text-red-100 ring-1 ring-red-400/20">
                  {videoError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="px-4 py-2.5 shadow-none"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={videoStatus === "uploading" || videoStatus === "processing" || videoStatus === "analyzing"}
                >
                  {videoStatus === "uploading" || videoStatus === "processing" || videoStatus === "analyzing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileVideo className="h-4 w-4" />
                  )}
                  Choose video
                </Button>
                {videoAsset ? (
                  <Button type="button" variant="ghost" className="border border-white/10 bg-white/[0.03] px-4 py-2.5" onClick={resetVideoAnalysis}>
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {videoStatus === "completed" && videoResult ? (
            <div className="border-t border-white/[0.06] p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {videoCompletedTotals.length ? (
                  <MetricPill label="Detected exercises" value={videoCompletedTotals.map((total) => total.label).join(", ")} />
                ) : null}
                {videoResult.finalState.totalReps > 0 ? <MetricPill label="Total reps" value={videoResult.finalState.totalReps} /> : null}
                <MetricPill label="Duration" value={formatDuration(videoDuration)} />
                {videoResult.formScore > 0 ? <MetricPill label="Session score" value={`${Math.round(videoResult.formScore)}/100`} /> : null}
              </div>

              {videoSummary ? (
                <div className="mt-4 rounded-2xl bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-[var(--fc-accent-strong)]">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]">AI coaching feedback</p>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-white">{videoSummary.headline}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{videoSummary.summary}</p>
                  <p className="mt-3 text-sm font-bold text-white">Next focus: {videoSummary.focus_next}</p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {videoCompletedTotals.length ? (
                  <div className="rounded-2xl bg-white/[0.035] p-4">
                    <div className="flex items-center gap-2 text-white/45">
                      <Gauge className="h-4 w-4" />
                      <p className="text-[11px] font-black uppercase tracking-[0.16em]">Exercise breakdown</p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {videoCompletedTotals.map((total) => (
                        <div key={total.exercise} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
                          <span className="font-bold text-white">{total.label}</span>
                          <span className="text-sm font-black text-[var(--fc-accent-strong)]">
                            {total.exercise === "plank" ? formatDuration(total.hold_seconds) : `${total.reps} reps`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {videoResult.timeline.length ? (
                  <div className="rounded-2xl bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-white/45">
                        <ListVideo className="h-4 w-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.16em]">Timeline summary</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-white/60"
                        onClick={() => setShowSkeletonOverlay((current) => !current)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Skeleton {showSkeletonOverlay ? "on" : "off"}
                      </button>
                    </div>
                    <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 custom-scrollbar">
                      {videoResult.timeline.slice(0, 10).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-left transition hover:bg-white/[0.07]"
                          onClick={() => {
                            if (replayVideoRef.current) {
                              replayVideoRef.current.currentTime = item.timeSeconds;
                              void replayVideoRef.current.play().catch(() => undefined);
                            }
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-white">{item.label}</span>
                            <span className="block truncate text-xs text-white/45">{item.detail}</span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-white/45">{formatDuration(item.timeSeconds)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="border border-white/10 bg-white/[0.03] px-4 py-2.5"
                  onClick={() => {
                    if (replayVideoRef.current) {
                      replayVideoRef.current.currentTime = 0;
                      void replayVideoRef.current.play().catch(() => undefined);
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Replay
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="border border-white/10 bg-white/[0.03] px-4 py-2.5"
                  onClick={() => setShowSkeletonOverlay((current) => !current)}
                >
                  <Eye className="h-4 w-4" />
                  Skeleton {showSkeletonOverlay ? "on" : "off"}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        {aiSummary ? (
          <section className={cn(quietPanelClass, "p-5")}>
            <div className="flex items-center gap-3 text-[var(--fc-accent-strong)]">
              <Sparkles className="h-4 w-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.18em]">Coach recap</p>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">{aiSummary.headline}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{aiSummary.summary}</p>
            <p className="mt-4 text-sm font-bold text-white">Next focus: {aiSummary.focus_next}</p>
          </section>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          {showSessionDetails ? (
            <AdvancedSection icon={<Timer className="h-4 w-4" />} title="Session details">
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricPill label="Duration" value={formatDuration(durationSeconds)} />
                {totalReps > 0 ? <MetricPill label="Total reps" value={totalReps} /> : null}
                {averageScore > 0 ? <MetricPill label="Form score" value={`${Math.round(averageScore)}/100`} /> : null}
              </div>

              {completedTotals.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {completedTotals.map((total) => (
                    <div key={total.exercise} className="rounded-xl bg-white/[0.04] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-black text-white">{total.label}</p>
                        {detectedExercise === total.exercise ? (
                          <span className="rounded-full bg-[var(--fc-accent)]/15 px-2 py-0.5 text-[10px] font-black text-[var(--fc-accent-strong)]">
                            Live
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-2xl font-black text-white">
                        {total.exercise === "plank" ? formatDuration(total.hold_seconds) : total.reps}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </AdvancedSection>
          ) : null}

          {workoutState ? (
            <AdvancedSection icon={<TrendingUp className="h-4 w-4" />} title="Advanced tracking">
              <div className="grid gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                    <Eye className="h-3.5 w-3.5" />
                    Body visibility
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(setup?.checklist || SETUP_DEFAULTS).map((item) => (
                      <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/70">
                        {item.ok ? (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--fc-accent-strong)]" />
                        ) : (
                          <CircleAlert className="h-4 w-4 shrink-0 text-white/35" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {metricRows.length ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                      <Target className="h-3.5 w-3.5" />
                      Tracking metrics
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {metricRows.map(({ key, value }) => (
                        <MetricPill key={key} label={key.replace(/_/g, " ")} value={formatMetricValue(key, value)} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {detectedIssues.length ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                      <CircleAlert className="h-3.5 w-3.5" />
                      Repeated cues
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {detectedIssues.slice(0, 4).map((issue) => (
                        <div key={issue.issue} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                          <span className="min-w-0 truncate font-bold capitalize text-white/70">{issueLabel(issue.issue)}</span>
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-black text-white">
                            {issue.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </AdvancedSection>
          ) : null}

          {history.length ? (
            <AdvancedSection icon={<Clock className="h-4 w-4" />} title="Recent sessions">
              <div className="grid gap-2">
                {history.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-xl bg-white/[0.04] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-black text-white">{item.exercise_name}</p>
                      <span className="text-xs font-bold text-white/45">
                        {new Date(item.completed_at || item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      {summarizeHistoryTotals(item)}
                      {item.duration_seconds ? ` - ${formatDuration(item.duration_seconds)}` : ""}
                    </p>
                    {item.ai_coach_summary || item.feedback_summary || item.summary ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">
                        {item.ai_coach_summary || item.feedback_summary || item.summary}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </AdvancedSection>
          ) : null}
        </div>

        <div className="flex items-start gap-2 pb-4 text-xs leading-5 text-white/40">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>General movement cues only. Stop if you feel sharp pain, dizziness, or instability.</p>
        </div>
      </div>
    </div>
  );
}
