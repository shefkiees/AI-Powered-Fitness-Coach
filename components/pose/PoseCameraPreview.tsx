"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { drawPoseOnCanvas, type PoseKeypoint } from "@/lib/pose/drawPose";
import {
  analyzePoseForm,
  type FormStatus,
} from "@/lib/pose/formHeuristics";

export type PoseCameraPreviewProps = {
  embedded?: boolean;
  className?: string;
  /** Load MoveNet + draw skeleton. Off for very low-end embeds if needed. */
  enablePoseDetection?: boolean;
  /** Live cues from keypoints (heuristic, not medical advice). */
  formFeedback?: boolean;
};

export function PoseCameraPreview({
  embedded = false,
  className,
  enablePoseDetection = true,
  formFeedback = false,
}: PoseCameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  // Loaded only via dynamic import(); keep ref loose so Turbopack does not analyze TF types.
  const detectorRef = useRef<{ estimatePoses: (v: HTMLVideoElement, c?: object) => Promise<{ keypoints?: { x: number; y: number; score?: number }[] }[]>; dispose: () => void } | null>(null);
  const activeRef = useRef(false);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>("off_frame");
  const [formHeadline, setFormHeadline] = useState("Analyzing…");
  const [formTips, setFormTips] = useState<string[]>([]);
  const frameCountRef = useRef(0);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
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
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx?.clearRect(0, 0, c.width, c.height);
    }
    setActive(false);
  }, []);

  const runPoseLoop = useCallback(() => {
    const tick = () => {
      if (!activeRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        void (async () => {
          if (!activeRef.current) return;
          const v = videoRef.current;
          const cv = canvasRef.current;
          const detector = detectorRef.current;
          if (!v || !cv || !detector) {
            if (activeRef.current) tick();
            return;
          }
          if (busyRef.current) {
            tick();
            return;
          }
          busyRef.current = true;
          try {
            if (v.readyState >= 2) {
              const poses = await detector.estimatePoses(v, {
                flipHorizontal: false,
              });
              const kp = poses[0]?.keypoints as PoseKeypoint[] | undefined;
              if (kp?.length) {
                drawPoseOnCanvas(cv, v, kp);
                if (formFeedback) {
                  frameCountRef.current += 1;
                  if (frameCountRef.current % 10 === 0) {
                    const { status, headline, tips } = analyzePoseForm(kp, {
                      width: v.videoWidth || v.clientWidth,
                      height: v.videoHeight || v.clientHeight,
                    });
                    setFormStatus(status);
                    setFormHeadline(headline);
                    setFormTips(tips);
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
  }, [formFeedback]);

  const startPoseModel = useCallback(async () => {
    if (!enablePoseDetection) return;
    setModelLoading(true);
    setError(null);
    try {
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");
      await tf.setBackend("webgl");
      await tf.ready();

      const poseDetection = await import("@tensorflow-models/pose-detection");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        },
      );
      if (!activeRef.current) {
        await detector.dispose();
        setModelLoading(false);
        return;
      }
      detectorRef.current = detector as typeof detectorRef.current;
      setModelReady(true);
      runPoseLoop();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not load pose model.";
      setError(msg);
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
      void startPoseModel();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not access camera.";
      setError(msg);
      setActive(false);
      activeRef.current = false;
    }
  }, [embedded, startPoseModel]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-slate-700/80 shadow-lg shadow-black/20",
        embedded ? "border-lime-500/15" : "border-lime-500/25",
        className,
      )}
    >
      {!embedded ? (
        <div className="border-b border-slate-800/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400/90">
            Pose estimation
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Live camera with MoveNet skeleton overlay. Allow camera access when
            prompted.
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
          <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-lime-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading pose model…
          </div>
        ) : null}
        {active && enablePoseDetection && modelReady ? (
          <div className="absolute bottom-2 right-2 rounded-lg bg-lime-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-lime-200">
            Tracking
          </div>
        ) : null}
        {active && formFeedback && modelReady ? (
          <div
            className={`absolute left-2 right-2 top-2 rounded-xl border px-3 py-2 text-left shadow-lg backdrop-blur-md sm:left-auto sm:right-2 sm:max-w-sm ${
              formStatus === "good"
                ? "border-emerald-500/40 bg-emerald-950/75 text-emerald-50"
                : formStatus === "adjust"
                  ? "border-amber-500/40 bg-amber-950/75 text-amber-50"
                  : "border-slate-600/60 bg-slate-950/80 text-slate-200"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              Form check
            </p>
            <p className="mt-0.5 text-sm font-bold">{formHeadline}</p>
            <ul className="mt-1 list-inside list-disc text-xs leading-snug opacity-95">
              {formTips.map((t, idx) => (
                <li key={`${idx}-${t.slice(0, 24)}`}>{t}</li>
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
              "focus-visible:ring-2 focus-visible:ring-lime-400/50",
            )}
            onClick={() => void startCamera()}
          >
            <Camera className="h-4 w-4" />
            {embedded ? "Start camera" : "Start camera & tracking"}
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
