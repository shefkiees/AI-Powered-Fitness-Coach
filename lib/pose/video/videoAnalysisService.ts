import type { VideoUploadAsset } from "@/lib/pose/video/videoUploadService";
import {
  analyzeVideoWithPoseTracking,
  type PoseVideoAnalysisResult,
  type VideoAnalysisProgress,
} from "@/lib/pose/video/poseVideoTrackingService";

export type VideoAnalysisStatus = "idle" | "uploading" | "processing" | "analyzing" | "completed" | "failed";

export type UploadedVideoAnalysisOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: VideoAnalysisProgress) => void;
};

export async function analyzeUploadedWorkoutVideo(
  asset: VideoUploadAsset,
  options: UploadedVideoAnalysisOptions = {},
): Promise<PoseVideoAnalysisResult> {
  options.onProgress?.({
    stage: "processing",
    percentage: 0,
    processedFrames: 0,
    totalFrames: 0,
    currentTimeSeconds: 0,
    durationSeconds: asset.durationSeconds,
    detectedExercise: "general",
    detectedLabel: "Preparing analysis",
    totalReps: 0,
    confidence: 0,
    statusText: "Preparing video frames",
    estimatedRemainingSeconds: null,
  });

  return analyzeVideoWithPoseTracking(asset, options);
}

export function labelForVideoAnalysisStatus(status: VideoAnalysisStatus) {
  switch (status) {
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing";
    case "analyzing":
      return "AI analyzing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Ready";
  }
}
