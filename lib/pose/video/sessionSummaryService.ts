import type { ExerciseTotal } from "@/lib/pose/autoWorkoutTracker";
import type { PoseVideoAnalysisResult } from "@/lib/pose/video/poseVideoTrackingService";
import type { VideoUploadAsset } from "@/lib/pose/video/videoUploadService";
import { savePoseSession } from "@/src/services/workoutService";

export type PoseAiSummary = {
  headline: string;
  summary: string;
  focus_next: string;
  cues: string[];
};

function allTotals(totals: Record<string, ExerciseTotal>) {
  return Object.values(totals).filter(Boolean);
}

function movementDurations(totals: Record<string, ExerciseTotal>) {
  return Object.fromEntries(
    allTotals(totals)
      .filter((total) => total.reps > 0 || total.hold_seconds > 0 || total.duration_seconds > 0)
      .map((total) => [
        total.exercise,
        total.exercise === "plank" ? total.hold_seconds : total.duration_seconds,
      ]),
  );
}

function localVideoSummary(result: PoseVideoAnalysisResult): PoseAiSummary {
  const score = Math.round(result.formScore || 0);
  const reps = result.finalState.totalReps || 0;
  const exerciseText = result.completedTotals.map((total) => total.label).join(", ") || result.finalState.detectedLabel;

  return {
    headline: reps > 0 ? `Video analysis found ${reps} reps.` : "Video analysis complete.",
    summary: `Detected ${exerciseText} with a ${score || "--"}/100 form score. Use the coaching cues to keep the next set controlled.`,
    focus_next: result.finalState.detectedIssues?.[0]?.issue?.replace(/_/g, " ") || "Tempo and full range of motion",
    cues: result.cues.slice(0, 4),
  };
}

export async function generateVideoSessionSummary(
  asset: VideoUploadAsset,
  result: PoseVideoAnalysisResult,
) {
  const state = result.finalState;
  const response = await fetch("/api/coach/pose-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      exercise_name: "Uploaded workout video",
      exercise_type: "video_upload",
      source: "video",
      video_name: asset.file.name,
      detected_exercises: result.completedTotals.map((total) => total.exercise),
      exercise_totals: state.totals,
      reps: state.totalReps,
      score: result.formScore,
      average_form_score: result.formScore,
      duration_seconds: result.durationSeconds,
      movement_durations: movementDurations(state.totals),
      detected_issues: state.detectedIssues || [],
      best_reps: state.bestReps || {},
      worst_reps: state.worstReps || {},
      cues: result.cues.slice(0, 8),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { summary?: PoseAiSummary };
  return response.ok && data.summary ? data.summary : localVideoSummary(result);
}

export async function saveVideoAnalysisSession(
  asset: VideoUploadAsset,
  result: PoseVideoAnalysisResult,
  summary: PoseAiSummary,
) {
  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - Math.round(result.durationSeconds * 1000));

  return savePoseSession({
    exercise_name: "Uploaded workout video",
    exercise_type: "video_upload",
    movement: "video_upload",
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    ended_at: completedAt.toISOString(),
    duration_seconds: Math.round(result.durationSeconds),
    reps: result.finalState.totalReps,
    score: result.formScore,
    form_score: result.formScore,
    exercise_totals: result.finalState.totals,
    detected_issues: result.finalState.detectedIssues || [],
    ai_coach_summary: summary.summary,
    feedback_summary: summary.summary,
    summary: summary.summary,
    cues: summary.cues.length ? summary.cues : result.cues,
    video_name: asset.file.name,
  });
}

export async function summarizeAndSaveVideoAnalysis(
  asset: VideoUploadAsset,
  result: PoseVideoAnalysisResult,
) {
  const summary = await generateVideoSessionSummary(asset, result);
  const session = await saveVideoAnalysisSession(asset, result, summary);
  return { summary, session };
}
