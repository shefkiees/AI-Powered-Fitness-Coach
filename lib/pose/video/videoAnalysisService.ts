import type { VideoUploadAsset } from "@/lib/pose/video/videoUploadService";
import {
  analyzeVideoWithPoseTracking,
  type VideoAnalysisStage,
  type PoseVideoAnalysisResult,
  type VideoAnalysisProgress,
} from "@/lib/pose/video/poseVideoTrackingService";

export type VideoAnalysisStatus = "idle" | VideoAnalysisStage | "error";

export type UploadedVideoAnalysisOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: VideoAnalysisProgress) => void;
};

export async function analyzeUploadedWorkoutVideo(
  asset: VideoUploadAsset,
  options: UploadedVideoAnalysisOptions = {},
): Promise<PoseVideoAnalysisResult> {
  options.onProgress?.({
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
    modelProgress: 0,
    statusText: "Loading AI model",
    estimatedRemainingSeconds: null,
  });

  return analyzeVideoWithPoseTracking(asset, options);
}

export function labelForVideoAnalysisStatus(status: VideoAnalysisStatus) {
  switch (status) {
    case "loading_video":
      return "Loading video";
    case "metadata_ready":
      return "Metadata ready";
    case "loading_model":
      return "Loading model";
    case "model_ready":
      return "Model ready";
    case "extracting_frames":
      return "Extracting frames";
    case "tracking_pose":
      return "Tracking pose";
    case "analyzing_reps":
      return "Analyzing reps";
    case "complete":
      return "Completed";
    case "error":
      return "Failed";
    default:
      return "Ready";
  }
}
