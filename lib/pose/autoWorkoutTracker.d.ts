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
  | "jumping_jack"
  | "situp"
  | "lateral_raise"
  | "deadlift"
  | "burpee"
  | "mountain_climber"
  | "tricep_dip"
  | "high_knees"
  | "jumping_squat"
  | "calf_raise"
  | "side_lunge"
  | "russian_twist"
  | "bicycle_crunch"
  | "leg_raise"
  | "wall_sit"
  | "superman_hold"
  | "glute_bridge"
  | "donkey_kick"
  | "fire_hydrant"
  | "front_raise"
  | "bent_over_row"
  | "pullup"
  | "chinup"
  | "toe_touch"
  | "side_plank"
  | "reverse_crunch"
  | "step_up"
  | "kettlebell_swing"
  | "box_jump"
  | "seated_shoulder_press"
  | "hammer_curl"
  | "arnold_press"
  | "flutter_kicks"
  | "bear_crawl"
  | "skater_jump"
  | "inchworm"
  | "hip_thrust"
  | "sumo_squat"
  | "goblet_squat"
  | "overhead_tricep_extension"
  | "resistance_band_row"
  | "lateral_walk"
  | "sprint_in_place";

export type SetupChecklistItem = {
  label: string;
  ok: boolean;
};

export type RepSummary = {
  id: string;
  rep_index: number;
  score: number;
  confidence: number;
  phase: string;
  issues: string[];
  timestamp: number;
  completed_at: string;
  kind?: "valid" | "invalid";
  partial?: boolean;
  exercise?: AutoExercise;
  exercise_label?: string;
};

export type ExerciseTotal = {
  exercise: AutoExercise;
  label: string;
  reps: number;
  valid_reps: number;
  invalid_reps: number;
  partial_reps: number;
  duration_seconds: number;
  hold_seconds: number;
  average_form_score: number;
  average_confidence: number;
  issues: Array<{ issue: string; count: number }>;
  best_rep: RepSummary | null;
  worst_rep: RepSummary | null;
  rep_events: RepSummary[];
  average_tempo_ms: number;
  last_rep_at: string | null;
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
  phase: FormPhase | string;
  score: number;
  detectedExercise: AutoExercise;
  selectedExercise: AutoExercise;
  detectedLabel: string;
  confidence: number;
  confidenceScore: number;
  averageConfidence: number;
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
  metrics: Record<string, number | string>;
  bestReps: Partial<Record<AutoExercise, RepSummary>>;
  worstReps: Partial<Record<AutoExercise, RepSummary>>;
  trackingStable: boolean;
  repTimeline: RepSummary[];
  repEvents: RepSummary[];
  validReps: number;
  invalidReps: number;
  partialReps: number;
  plankDuration: number;
  coachCues: string[];
  improvementTips: string[];
  warnings: string[];
  manualSelectionRecommended: boolean;
  currentRepPhase: string;
  activeExercise: AutoExercise;
  visibleJoints: string[];
  missingJoints: string[];
  sessionReady: boolean;
  detectedExercises: AutoExercise[];
  detection?: {
    mode: "auto";
    movementPattern: string;
    movementScore: number;
    scanning: boolean;
    enoughFrames: boolean;
    lowConfidenceSeconds: number;
  };
};

export type AutoWorkoutTracker = {
  update: (
    keypoints: PoseKeypoint[],
    frame: { width: number; height: number },
    timestamp?: number,
    options?: { selectedExercise?: AutoExercise; autoDetect?: boolean },
  ) => AutoWorkoutState;
  reset: () => void;
};

export const EXERCISE_LABELS: Record<AutoExercise, string>;
export const EXERCISES: AutoExercise[];
export const COUNTED_EXERCISES: Exclude<AutoExercise, "general" | "plank" | "wall_sit" | "superman_hold" | "side_plank">[];
export const EXERCISE_CONFIG: Record<string, unknown>;

export function createAutoWorkoutTracker(): AutoWorkoutTracker;
export function extractFrameFeatures(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
  timestamp?: number,
): Record<string, unknown>;
export function phaseForExercise(exercise: AutoExercise, features: Record<string, unknown>, progress?: number): FormPhase | string;
export function setupGuidance(features: Record<string, unknown>, selectedExercise?: AutoExercise): AutoWorkoutState["setup"];
