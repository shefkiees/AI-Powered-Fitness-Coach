"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  createAutoWorkoutTracker,
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type AutoWorkoutTracker,
} from "@/lib/pose/autoWorkoutTracker";
import { drawPoseOnCanvas, type PoseKeypoint } from "@/lib/pose/drawPose";
import {
  analyzePoseForm,
  type FormExercise,
  type FormPhase,
  type FormStatus,
} from "@/lib/pose/formHeuristics";

export type PoseCameraPreviewProps = {
  embedded?: boolean;
  className?: string;
  cameraFrameClassName?: string;
  cameraOverlay?: ReactNode;
  enablePoseDetection?: boolean;
  formFeedback?: boolean;
  feedbackMode?: "default" | "hidden";
  controlsMode?: "default" | "minimal" | "hidden";
  showHeader?: boolean;
  showTrackingStatus?: boolean;
  targetExercise?: FormExercise;
  selectedExercise?: AutoExercise;
  autoDetect?: boolean;
  startSignal?: number;
  sessionResetKey?: string | number;
  onCameraActiveChange?: (active: boolean) => void;
  onWorkoutAnalysis?: (analysis: AutoWorkoutState) => void;
  onFormAnalysis?: (analysis: {
    status: FormStatus;
    headline: string;
    tips: string[];
    phase: FormPhase;
    score: number;
    metrics?: Record<string, number>;
  }) => void;
};

type PoseDetectorLike = {
  estimatePoses: (
    video: HTMLVideoElement,
    config?: object,
  ) => Promise<{ keypoints?: { x: number; y: number; score?: number }[] }[]>;
  dispose: () => void | Promise<void>;
};

const MANUAL_EXERCISE_LABELS: Record<FormExercise, string> = {
  general: "Form check",
  squat: "Squat coach",
  lunge: "Lunge coach",
  pushup: "Push-up coach",
  plank: "Plank coach",
  shoulder_press: "Shoulder press coach",
  biceps_curl: "Curl coach",
  jumping_jack: "Jumping jack coach",
  situp: "Sit-up coach",
  lateral_raise: "Lateral raise coach",
  deadlift: "Deadlift coach",
};

function phaseLabel(phase: FormPhase | string) {
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

function cameraErrorMessage(caught: unknown) {
  if (caught instanceof DOMException) {
    if (caught.name === "NotAllowedError" || caught.name === "SecurityError") {
      return "Camera permission denied. Allow camera access in the browser and try again.";
    }
    if (caught.name === "NotFoundError" || caught.name === "DevicesNotFoundError") {
      return "No camera was found on this device.";
    }
    if (caught.name === "NotReadableError" || caught.name === "TrackStartError") {
      return "Camera is already in use by another app or browser tab.";
    }
  }
  return caught instanceof Error ? caught.message : "Could not access camera.";
}

export function PoseCameraPreview({
  embedded = false,
  className,
  cameraFrameClassName,
  cameraOverlay,
  enablePoseDetection = true,
  formFeedback = false,
  feedbackMode = "default",
  controlsMode = "default",
  showHeader,
  showTrackingStatus = true,
  targetExercise = "general",
  selectedExercise = "general",
  autoDetect = false,
  startSignal,
  sessionResetKey,
  onCameraActiveChange,
  onWorkoutAnalysis,
  onFormAnalysis,
}: PoseCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const detectorRef = useRef<PoseDetectorLike | null>(null);
  const trackerRef = useRef<AutoWorkoutTracker | null>(null);
  const activeRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastStartSignalRef = useRef<number | undefined>(undefined);

  const [active, setActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("off_frame");
  const [formHeadline, setFormHeadline] = useState("Analyzing...");
  const [formTips, setFormTips] = useState<string[]>([]);
  const [formPhase, setFormPhase] = useState<FormPhase | string>("unknown");
  const [formScore, setFormScore] = useState(0);
  const [workoutState, setWorkoutState] = useState<AutoWorkoutState | null>(null);

  if (!trackerRef.current) {
    trackerRef.current = createAutoWorkoutTracker();
  }

  const shouldShowHeader = showHeader ?? !embedded;
  const useMinimalControls = controlsMode === "minimal";
  const hideControls = controlsMode === "hidden";

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    try {
      void detectorRef.current?.dispose();
    } catch {
      /* ignore */
    }
    detectorRef.current = null;
    setModelReady(false);
    setModelLoading(false);
    setCameraStarting(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setActive(false);
    onCameraActiveChange?.(false);
  }, [onCameraActiveChange]);

  useEffect(() => {
    trackerRef.current?.reset();
    setWorkoutState(null);
    setFormStatus("off_frame");
    setFormHeadline("Analyzing...");
    setFormTips([]);
    setFormPhase("unknown");
    setFormScore(0);
  }, [sessionResetKey]);

  const runPoseLoop = useCallback(() => {
    const tick = () => {
      if (!activeRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        void (async () => {
          if (!activeRef.current) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const detector = detectorRef.current;

          if (!video || !canvas || !detector) {
            if (activeRef.current) tick();
            return;
          }

          if (busyRef.current) {
            tick();
            return;
          }

          busyRef.current = true;
          try {
            if (video.readyState >= 2) {
              const poses = await detector.estimatePoses(video, {
                flipHorizontal: false,
              });
              const keypoints = poses[0]?.keypoints as PoseKeypoint[] | undefined;
              const frame = {
                width: video.videoWidth || video.clientWidth,
                height: video.videoHeight || video.clientHeight,
              };
              drawPoseOnCanvas(canvas, video, keypoints || []);

              if (formFeedback) {
                frameCountRef.current += 1;
                if (frameCountRef.current % (autoDetect ? 3 : 10) === 0) {
                  if (autoDetect) {
                    const tracker = trackerRef.current || createAutoWorkoutTracker();
                    trackerRef.current = tracker;
                    const analysis = tracker.update(keypoints || [], frame, Date.now(), {
                      autoDetect,
                      selectedExercise,
                    });
                    setWorkoutState(analysis);
                    setFormStatus(analysis.status);
                    setFormHeadline(analysis.headline);
                    setFormTips(analysis.tips);
                    setFormPhase(analysis.phase);
                    setFormScore(analysis.score);
                    onWorkoutAnalysis?.(analysis);
                    onFormAnalysis?.({
                      status: analysis.status,
                      headline: analysis.headline,
                      tips: analysis.tips,
                      phase: analysis.phase as FormPhase,
                      score: analysis.score,
                      metrics: analysis.metrics as Record<string, number>,
                    });
                  } else if (keypoints?.length) {
                    const { status, headline, tips, phase, score, metrics } =
                      analyzePoseForm(
                        keypoints,
                        frame,
                        targetExercise,
                      );
                    setFormStatus(status);
                    setFormHeadline(headline);
                    setFormTips(tips);
                    setFormPhase(phase);
                    setFormScore(score);
                    onFormAnalysis?.({ status, headline, tips, phase, score, metrics });
                  } else {
                  const analysis = {
                    status: "off_frame" as FormStatus,
                    headline: "Body not detected",
                    tips: ["Step back and keep your full body in frame."],
                    phase: "not_detected" as FormPhase,
                    score: 0,
                    metrics: { visible_keypoints: 0 },
                  };
                  setFormStatus(analysis.status);
                  setFormHeadline(analysis.headline);
                  setFormTips(analysis.tips);
                  setFormPhase(analysis.phase);
                  setFormScore(analysis.score);
                  onFormAnalysis?.(analysis);
                  }
                }
              }
            }
          } catch {
            /* skip frame */
          } finally {
            busyRef.current = false;
          }

          tick();
        })();
      });
    };

    tick();
  }, [autoDetect, formFeedback, onFormAnalysis, onWorkoutAnalysis, selectedExercise, targetExercise]);

  const startPoseModel = useCallback(async () => {
    if (!enablePoseDetection) return;

    setModelLoading(true);
    setError(null);

    try {
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");

      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();

      const poseDetection = await import("@tensorflow-models/pose-detection");
      const detector = (await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        },
      )) as PoseDetectorLike;

      if (!activeRef.current) {
        await detector.dispose();
        setModelLoading(false);
        return;
      }

      detectorRef.current = detector;
      setModelReady(true);
      runPoseLoop();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not load pose model.";
      setError(message);
    } finally {
      setModelLoading(false);
    }
  }, [enablePoseDetection, runPoseLoop]);

  const startCamera = useCallback(async () => {
    if (activeRef.current || cameraStarting) return;
    setCameraStarting(true);
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: embedded ? 640 : 1280 },
          height: { ideal: embedded ? 480 : 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      activeRef.current = true;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      onCameraActiveChange?.(true);
      void startPoseModel();
    } catch (caught) {
      setError(cameraErrorMessage(caught));
      setActive(false);
      activeRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    } finally {
      setCameraStarting(false);
    }
  }, [cameraStarting, embedded, onCameraActiveChange, startPoseModel]);

  useEffect(() => {
    if (startSignal === undefined || startSignal === lastStartSignalRef.current) return;
    lastStartSignalRef.current = startSignal;
    if (startSignal > 0) {
      void startCamera();
    }
  }, [startCamera, startSignal]);

  useEffect(() => {
    if (active && enablePoseDetection && !modelReady && !modelLoading && !error) {
      void startPoseModel();
    }
  }, [active, enablePoseDetection, error, modelLoading, modelReady, startPoseModel]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-white/8 bg-[linear-gradient(180deg,var(--fc-panel)_0%,var(--fc-panel-strong)_100%)] p-0 shadow-[0_20px_56px_rgba(0,0,0,0.26)]",
        useMinimalControls ? "bg-[#090909] shadow-none" : "",
        className,
      )}
    >
      {shouldShowHeader ? (
        <div className="border-b border-white/8 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Form lab
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Live MoveNet tracking with automatic exercise detection and session totals.
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "relative bg-black",
          cameraFrameClassName ?? (embedded ? "aspect-video max-h-56" : "aspect-video"),
        )}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          aria-hidden
          style={{ transform: "scaleX(-1)" }}
        />

        {cameraOverlay ? <div className="pointer-events-none absolute inset-0 z-10">{cameraOverlay}</div> : null}

        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-slate-400">
            {cameraStarting ? <Loader2 className="h-10 w-10 animate-spin opacity-60" /> : <CameraOff className="h-10 w-10 opacity-50" />}
            <p className="text-sm">{cameraStarting ? "Requesting camera..." : "Ready when you are"}</p>
            {useMinimalControls ? (
              <Button
                type="button"
                className="mt-4 shadow-none"
                disabled={cameraStarting}
                onClick={() => void startCamera()}
              >
                {cameraStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {cameraStarting ? "Starting..." : "Start camera"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {showTrackingStatus && active && enablePoseDetection && modelLoading ? (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-[var(--fc-accent)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading pose model...
          </div>
        ) : null}

        {showTrackingStatus && active && enablePoseDetection && modelReady ? (
          <div className="absolute bottom-2 right-2 rounded-lg bg-[var(--fc-accent)]/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--fc-accent)]">
            Tracking
          </div>
        ) : null}

        {feedbackMode !== "hidden" && active && formFeedback && modelReady ? (
          <div
            className={cn(
              "absolute left-2 right-2 top-2 rounded-xl border px-3 py-2 text-left shadow-lg backdrop-blur-md sm:left-auto sm:right-2 sm:max-w-sm",
              formStatus === "good"
                ? "border-emerald-500/40 bg-emerald-950/75 text-emerald-50"
                : formStatus === "adjust"
                  ? "border-amber-500/40 bg-amber-950/75 text-amber-50"
                  : "border-slate-600/60 bg-slate-950/80 text-slate-200",
            )}
          >
            <div className="flex items-center gap-2">
              {autoDetect ? <ScanLine className="h-3.5 w-3.5" /> : null}
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {autoDetect ? "Auto-detected exercise" : MANUAL_EXERCISE_LABELS[targetExercise]}
              </p>
            </div>
            <p className="mt-0.5 text-sm font-bold">
              {autoDetect ? workoutState?.detectedLabel || "Looking for movement" : EXERCISE_LABELS[selectedExercise] || formHeadline}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
              <span className="rounded-full bg-black/25 px-2 py-0.5">
                {phaseLabel(formPhase)}
              </span>
              <span className="rounded-full bg-black/25 px-2 py-0.5">
                Score {formScore || "--"}
              </span>
              {autoDetect ? (
                <span className="rounded-full bg-black/25 px-2 py-0.5">
                  Confidence {workoutState?.confidence ?? 0}%
                </span>
              ) : (
                <span className="rounded-full bg-black/25 px-2 py-0.5">
                  {selectedExercise === "general" ? "Auto movement detection" : EXERCISE_LABELS[selectedExercise]}
                </span>
              )}
            </div>
            {autoDetect && workoutState?.setup.messages.length ? (
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold opacity-90">
                {workoutState.setup.messages.slice(0, 3).map((message) => (
                  <span key={message} className="rounded-full bg-black/20 px-2 py-0.5">
                    {message}
                  </span>
                ))}
              </div>
            ) : null}
            {!autoDetect || formHeadline !== workoutState?.detectedLabel ? (
              <p className="mt-1 text-xs font-bold opacity-95">{formHeadline}</p>
            ) : null}
            {autoDetect ? (
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
                <span className="rounded-full bg-black/25 px-2 py-0.5">
                  Reps {workoutState?.totalReps ?? 0}
                </span>
                <span className="rounded-full bg-black/25 px-2 py-0.5">
                  Visible {workoutState?.setup.visibleCount ?? 0}/17
                </span>
              </div>
            ) : null}
            <ul className="mt-1 list-inside list-disc text-xs leading-snug opacity-95">
              {formTips.map((tip, index) => (
                <li key={`${index}-${tip.slice(0, 24)}`}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="border-t border-red-500/20 bg-red-950/30 px-4 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap gap-2 p-3 sm:p-4",
          useMinimalControls ? "items-center justify-between border-t border-white/[0.06] bg-[#090909] px-4 py-3" : "",
          (useMinimalControls && !active) || hideControls ? "hidden" : "",
        )}
      >
        {!active ? (
          <Button
            type="button"
            className={cn(
              embedded ? "px-4 py-2 text-xs" : "",
              useMinimalControls ? "shadow-none" : "",
              "focus-visible:ring-2 focus-visible:ring-[var(--fc-accent)]/40",
            )}
            disabled={cameraStarting}
            onClick={() => void startCamera()}
          >
            {cameraStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {cameraStarting ? "Starting..." : "Start camera"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            className={cn(embedded ? "px-4 py-2 text-xs" : "", useMinimalControls ? "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]" : "")}
            onClick={stopCamera}
          >
            <CameraOff className="h-4 w-4" />
            Stop
          </Button>
        )}
      </div>
    </Card>
  );
}
