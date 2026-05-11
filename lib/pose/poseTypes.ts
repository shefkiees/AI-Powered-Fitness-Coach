import type { PoseKeypoint } from "@/lib/pose/drawPose";
import type { FormPhase, FormStatus } from "@/lib/pose/formHeuristics";

export const EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
  "general",
] as const;

export type AutoExercise = (typeof EXERCISES)[number];

export const COUNTED_EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
] as const;

export type CountedExercise = (typeof COUNTED_EXERCISES)[number];

export const TRACKED_EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
] as const satisfies readonly AutoExercise[];

export const EXERCISE_LABELS: Record<AutoExercise, string> = {
  squat: "Squat",
  pushup: "Push-up",
  lunge: "Lunge",
  biceps_curl: "Biceps curl",
  shoulder_press: "Shoulder press",
  jumping_jack: "Jumping jack",
  plank: "Plank",
  general: "General / unknown",
};

export const SETUP_DEFAULTS: SetupChecklistItem[] = [
  { label: "Shoulders visible", ok: false },
  { label: "Hips visible", ok: false },
  { label: "Knees visible", ok: false },
  { label: "Ankles visible", ok: false },
  { label: "Hands visible", ok: false },
  { label: "Tracking confidence", ok: false },
];

export type PoseFrame = {
  width: number;
  height: number;
};

export type PosePoint = PoseKeypoint;

export type PosePointMap = {
  nose?: PosePoint;
  ls?: PosePoint;
  rs?: PosePoint;
  le?: PosePoint;
  re?: PosePoint;
  lw?: PosePoint;
  rw?: PosePoint;
  lh?: PosePoint;
  rh?: PosePoint;
  lk?: PosePoint;
  rk?: PosePoint;
  la?: PosePoint;
  ra?: PosePoint;
};

export type VisibilityGroups = {
  head: boolean;
  shoulders: boolean;
  elbows: boolean;
  wrists: boolean;
  hips: boolean;
  knees: boolean;
  ankles: boolean;
  leftArm: boolean;
  rightArm: boolean;
  leftLeg: boolean;
  rightLeg: boolean;
};

export type FrameFeatures = {
  timestamp: number;
  width: number;
  height: number;
  keypoints: PoseKeypoint[];
  points: PosePointMap;
  groups: VisibilityGroups;
  visibleCount: number;
  avgScore: number;
  widthRatio: number;
  heightRatio: number;
  touchesEdge: boolean;
  shoulder: PosePoint | null;
  elbow: PosePoint | null;
  wrist: PosePoint | null;
  hip: PosePoint | null;
  knee: PosePoint | null;
  ankle: PosePoint | null;
  fallbackAnkle: PosePoint | null;
  shoulderWidth: number | null;
  ankleWidth: number | null;
  kneeWidth: number | null;
  ankleWidthRatio: number | null;
  kneeAnkleRatio: number | null;
  kneeAngle: number | null;
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
  frontKneeAngle: number | null;
  kneeAsymmetry: number | null;
  elbowAngle: number | null;
  leftElbowAngle: number | null;
  rightElbowAngle: number | null;
  elbowAsymmetry: number | null;
  shoulderAngle: number | null;
  bodyAngle: number | null;
  wristY: number | null;
  shoulderY: number | null;
  hipY: number | null;
  kneeY: number | null;
  ankleY: number | null;
  shoulderHipY: number | null;
  shoulderHipX: number | null;
  torsoLean: number | null;
  hipTilt: number | null;
  wristElbowStack: number | null;
  wristShoulderStack: number | null;
  kneeShift: number | null;
  hipToKnee: number | null;
  armsOverhead: boolean;
  bodyHorizontal: boolean;
  bodyVertical: boolean;
  hipOffset: number | null;
};

export type SetupChecklistItem = {
  label: string;
  ok: boolean;
};

export type SetupGuidance = {
  trackable: boolean;
  messages: string[];
  checklist: SetupChecklistItem[];
  visibleCount: number;
  averageConfidence: number;
  bodyHeightRatio: number;
  bodyWidthRatio: number;
};

export type AnalysisResult = {
  status: FormStatus;
  headline: string;
  tips: string[];
  phase: FormPhase;
  score: number;
  exercise: AutoExercise;
  issues: string[];
  metrics: Record<string, number>;
};

export type RepRule = {
  start: FormPhase;
  arm: FormPhase;
  count: FormPhase;
  minMotionMs: number;
  debounceMs: number;
  minConfidence: number;
  minScore: number;
  message: string;
};

export type PhaseState = {
  stage: "seek_start" | "seek_arm" | "seek_count";
  stablePhase: FormPhase;
  stableCount: number;
  enteredAt: number;
  armedAt: number;
  lastRepAt: number;
  minScore: number;
  issues: Set<string>;
};

export type RepSummary = {
  rep_index: number;
  score: number;
  issues: string[];
  completed_at: string;
};

export type InternalExerciseTotal = {
  exercise: AutoExercise;
  label: string;
  reps: number;
  durationMs: number;
  holdMs: number;
  scoreSum: number;
  scoreFrames: number;
  issueCounts: Record<string, number>;
  bestRep: RepSummary | null;
  worstRep: RepSummary | null;
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
  setup: SetupGuidance;
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
    frame: PoseFrame,
    timestamp?: number,
  ) => AutoWorkoutState;
  reset: () => void;
};

export type AiSummary = {
  headline: string;
  summary: string;
  focus_next: string;
  cues: string[];
};

export type PoseHistoryRow = {
  id: string;
  exercise_name: string;
  exercise_type?: string | null;
  reps: number;
  score: number;
  form_score?: number | null;
  summary?: string | null;
  feedback_summary?: string | null;
  ai_coach_summary?: string | null;
  exercise_totals?: Partial<Record<AutoExercise, ExerciseTotal>> | null;
  duration_seconds?: number | null;
  completed_at?: string | null;
  created_at: string;
};
