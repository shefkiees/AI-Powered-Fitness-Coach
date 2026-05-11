import {
  createAutoWorkoutTracker,
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type ExerciseTotal,
} from "@/lib/pose/autoWorkoutTracker";
import type { PoseKeypoint } from "@/lib/pose/drawPose";
import type { VideoUploadAsset } from "@/lib/pose/video/videoUploadService";
import {
  createFrameSchedule,
  disposeAnalysisVideo,
  estimateRemainingSeconds,
  loadVideoElementForAnalysis,
  seekVideoToTime,
  yieldToMainThread,
} from "@/lib/pose/video/frameExtractionService";

type PoseDetectorLike = {
  estimatePoses: (
    video: HTMLVideoElement,
    config?: object,
  ) => Promise<{ keypoints?: { x: number; y: number; score?: number }[] }[]>;
  dispose: () => void | Promise<void>;
};

export type VideoAnalysisStage = "processing" | "analyzing" | "completed";

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
};

export type VideoKeypointSample = {
  timeSeconds: number;
  keypoints: PoseKeypoint[];
};

export type PoseVideoAnalysisResult = {
  finalState: AutoWorkoutState;
  durationSeconds: number;
  processedFrames: number;
  completedTotals: ExerciseTotal[];
  cues: string[];
  timeline: VideoTimelineItem[];
  repMarkers: VideoRepMarker[];
  keypointSamples: VideoKeypointSample[];
  confidence: number;
  formScore: number;
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

async function createMoveNetDetector() {
  const tf = await import("@tensorflow/tfjs");
  await import("@tensorflow/tfjs-backend-webgl");

  try {
    await tf.setBackend("webgl");
  } catch {
    await tf.setBackend("cpu");
  }
  await tf.ready();

  const poseDetection = await import("@tensorflow-models/pose-detection");
  return (await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    },
  )) as PoseDetectorLike;
}

async function createMoveNetDetectorWithTimeout(timeoutMs = 20000) {
  let timeoutId = 0;

  try {
    return await Promise.race([
      createMoveNetDetector(),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(
            new Error(
              "AI model did not finish loading. Refresh the page and make sure your internet connection allows TensorFlow model downloads.",
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

function statusFor(state: AutoWorkoutState, percentage: number) {
  if (!state.trackingStable) return "Finding your body in frame";
  if (percentage < 18) return "Reading movement pattern";
  if (state.totalReps > 0) return "Counting reps and checking form";
  if (state.detectedExercise === "plank") return "Measuring plank hold";
  return "Detecting exercise rhythm";
}

export async function analyzeVideoWithPoseTracking(
  asset: VideoUploadAsset,
  { signal, onProgress }: PoseVideoTrackingOptions = {},
): Promise<PoseVideoAnalysisResult> {
  assertNotAborted(signal);

  let detector: PoseDetectorLike | null = null;
  let video: HTMLVideoElement | null = null;

  try {
    onProgress?.({
      stage: "processing",
      percentage: 0,
      processedFrames: 0,
      totalFrames: 0,
      currentTimeSeconds: 0,
      durationSeconds: asset.durationSeconds,
      detectedExercise: "general",
      detectedLabel: "Preparing video",
      totalReps: 0,
      confidence: 0,
      statusText: "Loading AI model",
      estimatedRemainingSeconds: null,
    });

    const [loadedVideo, loadedDetector] = await Promise.all([
      loadVideoElementForAnalysis(asset.objectUrl, signal),
      createMoveNetDetectorWithTimeout(),
    ]);
    video = loadedVideo;
    detector = loadedDetector;

    const durationSeconds = asset.durationSeconds || video.duration || 0;
    const frameTimes = createFrameSchedule(durationSeconds, { targetFps: 8, maxFrames: 720 });
    const tracker = createAutoWorkoutTracker();
    const cues: string[] = [];
    const timeline: VideoTimelineItem[] = [];
    const repMarkers: VideoRepMarker[] = [];
    const keypointSamples: VideoKeypointSample[] = [];
    const startedAt = performance.now();
    const frame = {
      width: video.videoWidth || asset.width || 1,
      height: video.videoHeight || asset.height || 1,
    };
    let finalState: AutoWorkoutState | null = null;
    let previousExercise: AutoExercise = "general";
    let previousPhase = "";
    let previousReps = 0;

    for (let index = 0; index < frameTimes.length; index += 1) {
      assertNotAborted(signal);
      const timeSeconds = frameTimes[index];
      await seekVideoToTime(video, timeSeconds, signal);
      const poses = await detector.estimatePoses(video, { flipHorizontal: false });
      const keypoints = (poses[0]?.keypoints || []) as PoseKeypoint[];
      const state = tracker.update(keypoints, frame, timeSeconds * 1000);
      finalState = state;

      if (index % 4 === 0 || index === frameTimes.length - 1) {
        keypointSamples.push({ timeSeconds, keypoints });
      }

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
        timeline.push({
          id: `phase-${index}-${state.phase}`,
          timeSeconds,
          label: state.detectedLabel,
          detail: `Phase: ${state.phase.replace(/_/g, " ")}`,
          type: "phase",
        });
        previousPhase = state.phase;
      }

      if (state.totalReps > previousReps) {
        repMarkers.push({
          id: `rep-${state.totalReps}-${index}`,
          timeSeconds,
          exercise: state.detectedExercise,
          label: state.detectedLabel,
          rep: state.totalReps,
        });
        timeline.push({
          id: `rep-${state.totalReps}-${index}`,
          timeSeconds,
          label: `Rep ${state.totalReps}`,
          detail: state.detectedLabel,
          type: "rep",
        });
        previousReps = state.totalReps;
      }

      for (const feedback of state.feedback.slice(0, 2)) {
        const cue = cleanCue(feedback.text, feedback.exercise);
        uniquePush(cues, cue);
      }

      const percentage = Math.round(((index + 1) / frameTimes.length) * 100);
      onProgress?.({
        stage: "analyzing",
        percentage,
        processedFrames: index + 1,
        totalFrames: frameTimes.length,
        currentTimeSeconds: timeSeconds,
        durationSeconds,
        detectedExercise: state.detectedExercise,
        detectedLabel: state.detectedLabel,
        totalReps: state.totalReps,
        confidence: state.confidence,
        statusText: statusFor(state, percentage),
        estimatedRemainingSeconds: estimateRemainingSeconds(startedAt, percentage),
      });

      if (index % 3 === 0) {
        await yieldToMainThread();
      }
    }

    if (!finalState) {
      finalState = tracker.update([], frame, durationSeconds * 1000);
    }

    onProgress?.({
      stage: "completed",
      percentage: 100,
      processedFrames: frameTimes.length,
      totalFrames: frameTimes.length,
      currentTimeSeconds: durationSeconds,
      durationSeconds,
      detectedExercise: finalState.detectedExercise,
      detectedLabel: finalState.detectedLabel,
      totalReps: finalState.totalReps,
      confidence: finalState.confidence,
      statusText: "Analysis complete",
      estimatedRemainingSeconds: 0,
    });

    return {
      finalState,
      durationSeconds,
      processedFrames: frameTimes.length,
      completedTotals: completedTotals(finalState.totals),
      cues: cues.length ? cues : finalState.tips.slice(0, 4),
      timeline: timeline.slice(0, 32),
      repMarkers,
      keypointSamples,
      confidence: finalState.confidence,
      formScore: finalState.averageFormScore || finalState.score || 0,
    };
  } finally {
    if (detector) await detector.dispose();
    if (video) disposeAnalysisVideo(video);
  }
}
