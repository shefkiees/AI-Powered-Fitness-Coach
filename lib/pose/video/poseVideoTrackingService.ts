import {
  createAutoWorkoutTracker,
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type ExerciseTotal,
} from "@/lib/pose/autoWorkoutTracker";
import type { PoseKeypoint } from "@/lib/pose/drawPose";
import {
  isPoseDetectorReady,
  loadSharedPoseDetector,
  type PoseDetectorLike,
} from "@/lib/pose/poseDetectorService";
import { REP_RULES } from "@/lib/pose/repCounter";
import type { VideoUploadAsset } from "@/lib/pose/video/videoUploadService";
import {
  disposeAnalysisVideo,
  estimateRemainingSeconds,
  loadVideoElementForAnalysis,
  seekVideoToTime,
  yieldToMainThread,
} from "@/lib/pose/video/frameExtractionService";

export type VideoAnalysisStage =
  | "loading_video"
  | "metadata_ready"
  | "loading_model"
  | "model_ready"
  | "extracting_frames"
  | "tracking_pose"
  | "analyzing_reps"
  | "complete";

export type VideoAnalysisProgress = {
  stage: VideoAnalysisStage;
  percentage: number;
  processedFrames: number;
  totalFrames: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  detectedExercise: AutoExercise;
  detectedLabel: string;
  totalReps: number;
  confidence: number;
  modelProgress: number;
  formScore?: number;
  phase?: string;
  cue?: string;
  keypoints?: PoseKeypoint[];
  trackingStable?: boolean;
  interpolated?: boolean;
  statusText: string;
  estimatedRemainingSeconds: number | null;
};

export type VideoTimelineItem = {
  id: string;
  timeSeconds: number;
  label: string;
  detail: string;
  type: "exercise" | "rep" | "cue" | "phase";
};

export type VideoRepMarker = {
  id: string;
  timeSeconds: number;
  exercise: AutoExercise;
  label: string;
  rep: number;
  confidence: number;
  formScore: number;
  squatDepthValid?: boolean;
  squatLockoutValid?: boolean;
  squatBottomTimestamp?: number;
};

export type VideoPartialRepMarker = {
  id: string;
  timeSeconds: number;
  exercise: AutoExercise;
  label: string;
  phase: string;
  reason: string;
  confidence: number;
  formScore: number;
};

export type VideoKeypointSample = {
  timeSeconds: number;
  keypoints: PoseKeypoint[];
  confidence: number;
  interpolated?: boolean;
};

export type VideoPlaybackSample = {
  timeSeconds: number;
  keypoints: PoseKeypoint[];
  detectedExercise: AutoExercise;
  detectedLabel: string;
  totalReps: number;
  confidence: number;
  formScore: number;
  phase: string;
  cue: string;
  metrics: Record<string, number>;
  trackingStable: boolean;
  repJustCompleted: boolean;
  invalidRep: boolean;
  interpolated?: boolean;
};

export type PoseVideoAnalysisResult = {
  finalState: AutoWorkoutState;
  durationSeconds: number;
  processedFrames: number;
  completedTotals: ExerciseTotal[];
  cues: string[];
  timeline: VideoTimelineItem[];
  repMarkers: VideoRepMarker[];
  partialRepMarkers: VideoPartialRepMarker[];
  keypointSamples: VideoKeypointSample[];
  playbackSamples: VideoPlaybackSample[];
  confidence: number;
  formScore: number;
  squatDepthValidated: boolean;
};

export type PoseVideoTrackingOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: VideoAnalysisProgress) => void;
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

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Video analysis was cancelled.", "AbortError");
}

function cleanCue(text: string, exercise: AutoExercise) {
  return text.replace(`${EXERCISE_LABELS[exercise]}: `, "").trim();
}

function uniquePush(values: string[], value: string, limit = 8) {
  const clean = value.trim();
  if (!clean || values.includes(clean) || values.length >= limit) return;
  values.push(clean);
}

function completedTotals(totals: Record<string, ExerciseTotal>) {
  return TRACKED_EXERCISES.map((exercise) => totals[exercise])
    .filter(Boolean)
    .filter((total) => total.reps > 0 || total.hold_seconds > 0);
}

function statusFor(state: AutoWorkoutState, percentage: number): { stage: VideoAnalysisStage; text: string } {
  if (!state.trackingStable) return { stage: "tracking_pose", text: "Finding your body in frame" };
  if (percentage < 18) return { stage: "tracking_pose", text: "Reading movement pattern" };
  if (state.totalReps > 0) return { stage: "analyzing_reps", text: "Counting reps and checking form" };
  if (state.detectedExercise === "plank") return { stage: "analyzing_reps", text: "Measuring plank hold" };
  return { stage: "tracking_pose", text: "Detecting exercise rhythm" };
}

function frameScheduleFor(asset: VideoUploadAsset, durationSeconds: number) {
  const fps = Math.max(1, asset.fpsEstimate || 30);
  const frameCount = Math.max(1, Math.ceil(durationSeconds * fps));
  return Array.from({ length: frameCount }, (_, index) => Math.min(durationSeconds, index / fps));
}

type PendingSquatRep = {
  bottomSeen: boolean;
  bottomTimestamp: number | null;
  minDepth: number | null;
  minKneeAngle: number | null;
  bestBottomScore: number;
};

function cloneKeypoints(keypoints: PoseKeypoint[]): PoseKeypoint[] {
  return keypoints.map((point) => ({
    x: point.x,
    y: point.y,
    score: point.score,
  }));
}

function interpolateKeypoints(previous: PoseKeypoint[], current: PoseKeypoint[]): PoseKeypoint[] {
  const size = Math.max(previous.length, current.length);
  const merged: PoseKeypoint[] = [];

  for (let index = 0; index < size; index += 1) {
    const before = previous[index];
    const after = current[index];
    if (before && after) {
      merged.push({
        x: (before.x + after.x) / 2,
        y: (before.y + after.y) / 2,
        score: Math.max((before.score ?? 0) * 0.9, (after.score ?? 0) * 0.9),
      });
      continue;
    }
    if (after) {
      merged.push({ x: after.x, y: after.y, score: (after.score ?? 0) * 0.9 });
      continue;
    }
    if (before) {
      merged.push({ x: before.x, y: before.y, score: (before.score ?? 0) * 0.9 });
    }
  }

  return merged;
}

function poseConfidence(keypoints: PoseKeypoint[]) {
  const visible = keypoints.filter((point) => (point.score ?? 0) >= 0.25);
  if (!visible.length) return 0;
  const total = visible.reduce((sum, point) => sum + (point.score ?? 0), 0);
  return Math.round((total / visible.length) * 100);
}

type PartialRepCandidate = {
  id: string;
  timeSeconds: number;
  exercise: AutoExercise;
  label: string;
  phase: string;
  confidence: number;
  formScore: number;
};

export async function analyzeVideoWithPoseTracking(
  asset: VideoUploadAsset,
  { signal, onProgress }: PoseVideoTrackingOptions = {},
): Promise<PoseVideoAnalysisResult> {
  assertNotAborted(signal);

  let detector: PoseDetectorLike | null = null;
  let video: HTMLVideoElement | null = null;

  try {
    onProgress?.({
      stage: "loading_model",
      percentage: 0,
      processedFrames: 0,
      totalFrames: asset.totalFramesEstimate,
      currentTimeSeconds: 0,
      durationSeconds: asset.durationSeconds,
      detectedExercise: "general",
      detectedLabel: "Loading pose model",
      totalReps: 0,
      confidence: 0,
      modelProgress: isPoseDetectorReady() ? 100 : 0,
      statusText: isPoseDetectorReady() ? "Reusing loaded pose model" : "Loading AI model",
      estimatedRemainingSeconds: null,
    });

    console.log("[video-analysis] loading model", {
      reused: isPoseDetectorReady(),
      totalFramesEstimate: asset.totalFramesEstimate,
    });
    const loadedDetector = await loadSharedPoseDetector({
      timeoutMs: 30000,
      onProgress: (modelProgress, label) => {
        onProgress?.({
          stage: "loading_model",
          percentage: 0,
          processedFrames: 0,
          totalFrames: asset.totalFramesEstimate,
          currentTimeSeconds: 0,
          durationSeconds: asset.durationSeconds,
          detectedExercise: "general",
          detectedLabel: "Loading pose model",
          totalReps: 0,
          confidence: 0,
          modelProgress,
          statusText: label,
          estimatedRemainingSeconds: null,
        });
      },
    });
    detector = loadedDetector.detector;
    console.log("[video-analysis] model ready", { reused: loadedDetector.reused });

    onProgress?.({
      stage: "model_ready",
      percentage: 0,
      processedFrames: 0,
      totalFrames: asset.totalFramesEstimate,
      currentTimeSeconds: 0,
      durationSeconds: asset.durationSeconds,
      detectedExercise: "general",
      detectedLabel: "Pose model ready",
      totalReps: 0,
      confidence: 0,
      modelProgress: 100,
      statusText: "Pose model ready",
      estimatedRemainingSeconds: null,
    });

    onProgress?.({
      stage: "extracting_frames",
      percentage: 0,
      processedFrames: 0,
      totalFrames: asset.totalFramesEstimate,
      currentTimeSeconds: 0,
      durationSeconds: asset.durationSeconds,
      detectedExercise: "general",
      detectedLabel: "Preparing frames",
      totalReps: 0,
      confidence: 0,
      modelProgress: 100,
      statusText: "Decoding video frames",
      estimatedRemainingSeconds: null,
    });

    video = await loadVideoElementForAnalysis(asset.objectUrl, signal);

    const durationSeconds = asset.durationSeconds || video.duration || 0;
    const frameTimes = frameScheduleFor(asset, durationSeconds);
    const tracker = createAutoWorkoutTracker();
    const cues: string[] = [];
    const timeline: VideoTimelineItem[] = [];
    const repMarkers: VideoRepMarker[] = [];
    const partialRepMarkers: VideoPartialRepMarker[] = [];
    const keypointSamples: VideoKeypointSample[] = [];
    const playbackSamples: VideoPlaybackSample[] = [];
    const startedAt = performance.now();
    const frame = {
      width: video.videoWidth || asset.width || 1,
      height: video.videoHeight || asset.height || 1,
    };
    let finalState: AutoWorkoutState | null = null;
    let previousExercise: AutoExercise = "general";
    let previousPhase = "";
    let previousReps = 0;
    let previousKeypoints: PoseKeypoint[] = [];
    let partialCandidate: PartialRepCandidate | null = null;
    let poseDetectedFrames = 0;
    let squatDepthValidated = false;
    let pendingSquatRep: PendingSquatRep = {
      bottomSeen: false,
      bottomTimestamp: null,
      minDepth: null,
      minKneeAngle: null,
      bestBottomScore: 0,
    };

    for (let index = 0; index < frameTimes.length; index += 1) {
      assertNotAborted(signal);
      const timeSeconds = frameTimes[index];
      await seekVideoToTime(video, timeSeconds, signal);
      const poses = await detector.estimatePoses(video, { flipHorizontal: false });
      let keypoints = cloneKeypoints((poses[0]?.keypoints || []) as PoseKeypoint[]);
      let interpolated = false;
      if ((!keypoints.length || keypoints.every((point) => (point.score ?? 0) < 0.2)) && previousKeypoints.length) {
        keypoints = interpolateKeypoints(previousKeypoints, previousKeypoints);
        interpolated = true;
      } else if (previousKeypoints.length && keypoints.length) {
        keypoints = interpolateKeypoints(previousKeypoints, keypoints);
      }
      const framePoseConfidence = poseConfidence(keypoints);
      if (framePoseConfidence >= 25) poseDetectedFrames += 1;
      const state = tracker.update(keypoints, frame, timeSeconds * 1000);
      finalState = state;
      const repCompletedThisFrame = state.totalReps > previousReps;
      const currentDepth = typeof state.metrics.depth === "number" ? state.metrics.depth : null;
      const currentKneeAngle = typeof state.metrics.knee_angle === "number" ? state.metrics.knee_angle : null;

      if (state.detectedExercise !== "squat" && pendingSquatRep.bottomSeen) {
        pendingSquatRep = {
          bottomSeen: false,
          bottomTimestamp: null,
          minDepth: null,
          minKneeAngle: null,
          bestBottomScore: 0,
        };
      }

      if (state.detectedExercise === "squat" && state.phase === "bottom") {
        pendingSquatRep.bottomSeen = true;
        pendingSquatRep.bottomTimestamp = pendingSquatRep.bottomTimestamp ?? timeSeconds;
        pendingSquatRep.minDepth =
          pendingSquatRep.minDepth === null ? currentDepth : Math.min(pendingSquatRep.minDepth, currentDepth ?? pendingSquatRep.minDepth);
        pendingSquatRep.minKneeAngle =
          pendingSquatRep.minKneeAngle === null
            ? currentKneeAngle
            : Math.min(pendingSquatRep.minKneeAngle, currentKneeAngle ?? pendingSquatRep.minKneeAngle);
        pendingSquatRep.bestBottomScore = Math.max(pendingSquatRep.bestBottomScore, state.score);
      }

      keypointSamples.push({
        timeSeconds,
        keypoints,
        confidence: framePoseConfidence || state.confidence,
        interpolated,
      });

      if (state.detectedExercise !== previousExercise && state.detectedExercise !== "general") {
        timeline.push({
          id: `exercise-${index}-${state.detectedExercise}`,
          timeSeconds,
          label: state.detectedLabel,
          detail: "Exercise detected",
          type: "exercise",
        });
        previousExercise = state.detectedExercise;
      }

      if (state.phase && state.phase !== previousPhase && state.phase !== "unknown") {
        console.log("[video-analysis] rep lifecycle transition", {
          timeSeconds,
          exercise: state.detectedExercise,
          phase: state.phase,
          totalReps: state.totalReps,
          confidence: state.confidence,
        });
        timeline.push({
          id: `phase-${index}-${state.phase}`,
          timeSeconds,
          label: state.detectedLabel,
          detail: `Phase: ${state.phase.replace(/_/g, " ")}`,
          type: "phase",
        });
        previousPhase = state.phase;
      }

      const rule = REP_RULES[state.detectedExercise as keyof typeof REP_RULES];
      if (rule && state.phase === rule.arm && !partialCandidate) {
        partialCandidate = {
          id: `partial-${index}-${state.detectedExercise}`,
          timeSeconds,
          exercise: state.detectedExercise,
          label: state.detectedLabel,
          phase: state.phase,
          confidence: state.confidence,
          formScore: state.score,
        };
      }

      if (repCompletedThisFrame) {
        const squatDepthValid =
          state.detectedExercise === "squat" &&
          pendingSquatRep.bottomSeen &&
          (
            (pendingSquatRep.minDepth !== null && pendingSquatRep.minDepth >= -0.035) ||
            (pendingSquatRep.minKneeAngle !== null && pendingSquatRep.minKneeAngle <= 124)
          );
        const squatLockoutValid =
          state.detectedExercise === "squat" &&
          state.phase === "standing" &&
          (currentKneeAngle === null || currentKneeAngle >= 148);

        repMarkers.push({
          id: `rep-${state.totalReps}-${index}`,
          timeSeconds,
          exercise: state.detectedExercise,
          label: state.detectedLabel,
          rep: state.totalReps,
          confidence: state.confidence,
          formScore: state.score,
          squatDepthValid: state.detectedExercise === "squat" ? squatDepthValid : undefined,
          squatLockoutValid: state.detectedExercise === "squat" ? squatLockoutValid : undefined,
          squatBottomTimestamp: state.detectedExercise === "squat" ? (pendingSquatRep.bottomTimestamp ?? undefined) : undefined,
        });
        console.log("[video-analysis] rep counted", {
          timeSeconds,
          exercise: state.detectedExercise,
          rep: state.totalReps,
          confidence: state.confidence,
          formScore: state.score,
        });
        timeline.push({
          id: `rep-${state.totalReps}-${index}`,
          timeSeconds,
          label: `Rep ${state.totalReps}`,
          detail: state.detectedLabel,
          type: "rep",
        });
        if (state.detectedExercise === "squat") {
          squatDepthValidated = squatDepthValidated || squatDepthValid;
          pendingSquatRep = {
            bottomSeen: false,
            bottomTimestamp: null,
            minDepth: null,
            minKneeAngle: null,
            bestBottomScore: 0,
          };
        }
        partialCandidate = null;
        previousReps = state.totalReps;
      }

      if (partialCandidate && timeSeconds - partialCandidate.timeSeconds > 7) {
        partialRepMarkers.push({
          ...partialCandidate,
          reason: "Partial range of motion",
        });
        partialCandidate = null;
      }

      playbackSamples.push({
        timeSeconds,
        keypoints,
        detectedExercise: state.detectedExercise,
        detectedLabel: state.detectedLabel,
        totalReps: state.totalReps,
        confidence: state.confidence,
        formScore: state.score,
        phase: state.phase,
        cue: state.feedback[0]?.text || state.tips[0] || "Tracking movement",
        metrics: state.metrics,
        trackingStable: state.trackingStable,
        repJustCompleted: repCompletedThisFrame,
        invalidRep: Boolean(
          state.detectedExercise === "squat" &&
          pendingSquatRep.bottomSeen &&
          state.phase === "standing" &&
          currentKneeAngle !== null &&
          currentKneeAngle < 148,
        ),
        interpolated,
      });

      previousKeypoints = keypoints;

      for (const feedback of state.feedback.slice(0, 2)) {
        const cue = cleanCue(feedback.text, feedback.exercise);
        uniquePush(cues, cue);
      }

      const percentage = Math.round(((index + 1) / frameTimes.length) * 100);
      const status = statusFor(state, percentage);
      if (index % 30 === 0 || index === frameTimes.length - 1) {
        console.log("[video-analysis] frame extraction progress", {
          processedFrames: index + 1,
          totalFrames: frameTimes.length,
          timeSeconds,
          confidence: framePoseConfidence,
        });
        console.log("[video-analysis] pose detection result", {
          timeSeconds,
          detectedExercise: state.detectedExercise,
          phase: state.phase,
          confidence: state.confidence,
          keypoints: keypoints.length,
          interpolated,
        });
      }
      onProgress?.({
        stage: status.stage,
        percentage,
        processedFrames: index + 1,
        totalFrames: frameTimes.length,
        currentTimeSeconds: timeSeconds,
        durationSeconds,
        detectedExercise: state.detectedExercise,
        detectedLabel: state.detectedLabel,
        totalReps: state.totalReps,
        confidence: state.confidence,
        modelProgress: 100,
        formScore: state.score,
        phase: state.phase,
        cue: state.feedback[0]?.text || state.tips[0] || "Tracking movement",
        keypoints,
        trackingStable: state.trackingStable,
        interpolated,
        statusText: status.text,
        estimatedRemainingSeconds: estimateRemainingSeconds(startedAt, percentage),
      });

      if (index % 3 === 0) {
        await yieldToMainThread();
      }
    }

    if (!finalState) {
      finalState = tracker.update([], frame, durationSeconds * 1000);
    }

    if (partialCandidate) {
      partialRepMarkers.push({
        ...partialCandidate,
        reason: "Partial range of motion",
      });
    }

    if (!poseDetectedFrames) {
      throw new Error("No person detected");
    }

    onProgress?.({
      stage: "complete",
      percentage: 100,
      processedFrames: frameTimes.length,
      totalFrames: frameTimes.length,
      currentTimeSeconds: durationSeconds,
      durationSeconds,
      detectedExercise: finalState.detectedExercise,
      detectedLabel: finalState.detectedLabel,
      totalReps: finalState.totalReps,
      confidence: finalState.confidence,
      modelProgress: 100,
      statusText: "Analysis complete",
      estimatedRemainingSeconds: 0,
    });

    console.log("[video-analysis] final analysis result", {
      durationSeconds,
      processedFrames: frameTimes.length,
      reps: finalState.totalReps,
      completedTotals: completedTotals(finalState.totals),
      partialRepMarkers,
      confidence: finalState.confidence,
      formScore: finalState.averageFormScore || finalState.score || 0,
    });

    return {
      finalState,
      durationSeconds,
      processedFrames: frameTimes.length,
      completedTotals: completedTotals(finalState.totals),
      cues: cues.length ? cues : finalState.tips.slice(0, 4),
      timeline: timeline.slice(0, 32),
      repMarkers,
      partialRepMarkers,
      keypointSamples,
      playbackSamples,
      confidence: finalState.confidence,
      formScore: finalState.averageFormScore || finalState.score || 0,
      squatDepthValidated,
    };
  } finally {
    if (video) disposeAnalysisVideo(video);
  }
}
