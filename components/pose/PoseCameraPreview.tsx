"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
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
  enablePoseDetection?: boolean;
  formFeedback?: boolean;
  targetExercise?: FormExercise;
  onCameraActiveChange?: (active: boolean) => void;
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

const EXERCISE_LABELS: Record<FormExercise, string> = {
  general: "Form check",
  squat: "Squat coach",
  lunge: "Lunge coach",
  pushup: "Push-up coach",
  plank: "Plank coach",
  shoulder_press: "Shoulder press coach",
  biceps_curl: "Curl coach",
  jumping_jack: "Jumping jack coach",
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
  enablePoseDetection = true,
  formFeedback = false,
  targetExercise = "general",
  onCameraActiveChange,
  onFormAnalysis,
}: PoseCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const detectorRef = useRef<PoseDetectorLike | null>(null);
  const activeRef = useRef(false);
  const frameCountRef = useRef(0);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("off_frame");
  const [formHeadline, setFormHeadline] = useState("Analyzing...");
  const [formTips, setFormTips] = useState<string[]>([]);
  const [formPhase, setFormPhase] = useState<FormPhase>("unknown");
  const [formScore, setFormScore] = useState(0);

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
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setActive(false);
    onCameraActiveChange?.(false);
  }, [onCameraActiveChange]);

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
              if (keypoints?.length) {
                drawPoseOnCanvas(canvas, video, keypoints);
                if (formFeedback) {
                  frameCountRef.current += 1;
                  if (frameCountRef.current % 10 === 0) {
                    const { status, headline, tips, phase, score, metrics } =
                      analyzePoseForm(
                        keypoints,
                        {
                          width: video.videoWidth || video.clientWidth,
                          height: video.videoHeight || video.clientHeight,
                        },
                        targetExercise,
                      );
                    setFormStatus(status);
                    setFormHeadline(headline);
                    setFormTips(tips);
                    setFormPhase(phase);
                    setFormScore(score);
                    onFormAnalysis?.({ status, headline, tips, phase, score, metrics });
                  }
                }
              } else if (formFeedback) {
                drawPoseOnCanvas(canvas, video, []);
                frameCountRef.current += 1;
                if (frameCountRef.current % 10 === 0) {
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
  }, [formFeedback, onFormAnalysis, targetExercise]);

  const startPoseModel = useCallback(async () => {
    if (!enablePoseDetection) return;

    setModelLoading(true);
    setError(null);

    try {
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      await import("@tensorflow/tfjs-converter");

      try {
        await tf.setBackend("webgl");
      } catch {
        await import("@tensorflow/tfjs-backend-cpu");
        await tf.setBackend("cpu");
      }
      await tf.ready();

      const moveNetModule = (await import(
        "@tensorflow-models/pose-detection/dist/movenet/detector.js"
      )) as {
        load: (config?: {
          modelType?: string;
          enableSmoothing?: boolean;
        }) => Promise<PoseDetectorLike>;
      };

      const detector = await moveNetModule.load({
        modelType: "SinglePose.Lightning",
        enableSmoothing: true,
      });

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
    setError(null);
    try {
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
    }
  }, [embedded, onCameraActiveChange, startPoseModel]);

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
        className,
      )}
    >
      {!embedded ? (
        <div className="border-b border-white/8 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Form lab
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Live camera with MoveNet pose tracking and simple posture cues.
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "relative bg-black",
          embedded ? "aspect-video max-h-56" : "aspect-video",
        )}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />

        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-slate-400">
            <CameraOff className="h-10 w-10 opacity-50" />
            <p className="text-sm">Camera off</p>
          </div>
        ) : null}

        {active && enablePoseDetection && modelLoading ? (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-[var(--fc-accent)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading pose model...
          </div>
        ) : null}

        {active && enablePoseDetection && modelReady ? (
          <div className="absolute bottom-2 right-2 rounded-lg bg-[var(--fc-accent)]/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--fc-accent)]">
            Tracking
          </div>
        ) : null}

        {active && formFeedback && modelReady ? (
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
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              {EXERCISE_LABELS[targetExercise]}
            </p>
            <p className="mt-0.5 text-sm font-bold">{formHeadline}</p>
            {targetExercise !== "general" ? (
              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
                <span className="rounded-full bg-black/25 px-2 py-0.5">
                  {phaseLabel(formPhase)}
                </span>
                <span className="rounded-full bg-black/25 px-2 py-0.5">
                  Score {formScore || "--"}
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

      <div className="flex flex-wrap gap-2 p-3 sm:p-4">
        {!active ? (
          <Button
            type="button"
            className={cn(
              embedded ? "px-4 py-2 text-xs" : "",
              "focus-visible:ring-2 focus-visible:ring-[var(--fc-accent)]/40",
            )}
            onClick={() => void startCamera()}
          >
            <Camera className="h-4 w-4" />
            {embedded ? "Start camera" : "Start camera and tracking"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            className={embedded ? "px-4 py-2 text-xs" : ""}
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
