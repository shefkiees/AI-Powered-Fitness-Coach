import type { PoseKeypoint } from "@/lib/pose/drawPose";
import type { FormPhase, FormStatus } from "@/lib/pose/formHeuristics";

export type AutoExercise =
  | "general"
  | "squat"
  | "lunge"
  | "pushup"
  | "plank"
  | "shoulder_press"
  | "biceps_curl"
  | "jumping_jack";

export type SetupChecklistItem = {
  label: string;
  ok: boolean;
};

export type ExerciseTotal = {
  exercise: AutoExercise;
  label: string;
  reps: number;
  duration_seconds: number;
  hold_seconds: number;
  average_form_score: number;
  issues: Array<{ issue: string; count: number }>;
  best_rep: RepSummary | null;
  worst_rep: RepSummary | null;
};

export type RepSummary = {
  rep_index: number;
  score: number;
  issues: string[];
  completed_at: string;
};

export type LiveFeedbackItem = {
  id: string;
  text: string;
  exercise: AutoExercise;
  timestamp: number;
};

export type AutoWorkoutState = {
  status: FormStatus;
  headline: string;
  tips: string[];
  phase: FormPhase;
  score: number;
  detectedExercise: AutoExercise;
  detectedLabel: string;
  confidence: number;
  confidenceScore: number;
  setup: {
    trackable: boolean;
    messages: string[];
    checklist: SetupChecklistItem[];
    visibleCount: number;
    averageConfidence: number;
    bodyHeightRatio: number;
    bodyWidthRatio: number;
  };
  totals: Record<AutoExercise, ExerciseTotal>;
  totalReps: number;
  averageFormScore: number;
  feedback: LiveFeedbackItem[];
  detectedIssues: Array<{ issue: string; count: number }>;
  exerciseScores: Record<string, number>;
  metrics: Record<string, number>;
  bestReps: Partial<Record<AutoExercise, RepSummary>>;
  worstReps: Partial<Record<AutoExercise, RepSummary>>;
  trackingStable: boolean;
};

export type AutoWorkoutTracker = {
  update: (
    keypoints: PoseKeypoint[],
    frame: { width: number; height: number },
    timestamp?: number,
  ) => AutoWorkoutState;
  reset: () => void;
};

export const EXERCISE_LABELS: Record<AutoExercise, string>;
export const EXERCISES: AutoExercise[];
export const COUNTED_EXERCISES: Exclude<AutoExercise, "general" | "plank">[];

export function createAutoWorkoutTracker(): AutoWorkoutTracker;
export function extractFrameFeatures(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
  timestamp?: number,
): Record<string, unknown>;
export function phaseForExercise(exercise: AutoExercise, features: Record<string, unknown>): FormPhase;
export function setupGuidance(features: Record<string, unknown>): AutoWorkoutState["setup"];
