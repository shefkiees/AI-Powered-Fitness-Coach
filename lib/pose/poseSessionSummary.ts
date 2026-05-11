import type { PoseKeypoint } from "@/lib/pose/drawPose";
import type {
  AutoExercise,
  AutoWorkoutState,
  AutoWorkoutTracker,
  ExerciseTotal,
  InternalExerciseTotal,
  LiveFeedbackItem,
  PoseFrame,
  PoseHistoryRow,
} from "@/lib/pose/poseTypes";
import {
  COUNTED_EXERCISES,
  EXERCISE_LABELS,
  EXERCISES,
  TRACKED_EXERCISES,
} from "@/lib/pose/poseTypes";
import { analyzeExercise, candidateScores, chooseExercise } from "@/lib/pose/exerciseDetection";
import { clamp, extractFrameFeatures, round } from "@/lib/pose/poseMetrics";
import { setupGuidance } from "@/lib/pose/poseVisibility";
import { createPhaseStates, updateRepCounter } from "@/lib/pose/repCounter";

const TRACKING_LOSS_GRACE_MS = 900;
const HISTORY_LIMIT = 24;

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function phaseLabel(phase?: string) {
  switch (phase) {
    case "standing":
      return "Standing";
    case "bottom":
      return "Bottom";
    case "top":
      return "Top";
    case "down":
      return "Down";
    case "hold":
      return "Hold";
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "not_detected":
      return "Not detected";
    default:
      return "Tracking";
  }
}

export function compactPhaseLabel(phase?: string) {
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

export function formatMetricValue(key: string, value: number) {
  if (key === "arms_overhead" || key === "setup_ready") return value >= 1 ? "Yes" : "No";
  if (key === "visible_keypoints") return `${Math.round(value)}/17`;
  if (key === "confidence") return `${Math.round(value * 100)}%`;
  if (key.includes("ratio")) return `${value.toFixed(2)}x`;
  if (key.includes("angle") || key === "asymmetry" || key === "range_of_motion") return `${Math.round(value)} deg`;
  if (
    key.includes("shift") ||
    key.includes("lean") ||
    key.includes("offset") ||
    key.includes("drift") ||
    key.includes("depth") ||
    key.includes("motion") ||
    key.includes("stability")
  ) {
    return `${Math.round(Math.abs(value) * 100)}%`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function issueLabel(issue: string) {
  return issue
    .replace(/^jack_/, "jumping jack ")
    .replace(/^curl_/, "curl ")
    .replace(/^press_/, "press ")
    .replace(/^plank_/, "plank ")
    .replace(/_/g, " ");
}

export function createTotals(): Record<AutoExercise, InternalExerciseTotal> {
  return EXERCISES.reduce((totals, exercise) => {
    totals[exercise] = {
      exercise,
      label: EXERCISE_LABELS[exercise],
      reps: 0,
      durationMs: 0,
      holdMs: 0,
      scoreSum: 0,
      scoreFrames: 0,
      issueCounts: {},
      bestRep: null,
      worstRep: null,
    };
    return totals;
  }, {} as Record<AutoExercise, InternalExerciseTotal>);
}

export function emptyTotals(): Record<AutoExercise, ExerciseTotal> {
  return EXERCISES.reduce((totals, exercise) => {
    totals[exercise] = {
      exercise,
      label: EXERCISE_LABELS[exercise],
      reps: 0,
      duration_seconds: 0,
      hold_seconds: 0,
      average_form_score: 0,
      issues: [],
      best_rep: null,
      worst_rep: null,
    };
    return totals;
  }, {} as Record<AutoExercise, ExerciseTotal>);
}

export function serializeTotals(totals: Record<AutoExercise, InternalExerciseTotal>): Record<AutoExercise, ExerciseTotal> {
  return EXERCISES.reduce((payload, exercise) => {
    const total = totals[exercise];
    const averageScore = total.scoreFrames ? Math.round(total.scoreSum / total.scoreFrames) : 0;
    const issues = Object.entries(total.issueCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([issue, count]) => ({ issue, count }));
    payload[exercise] = {
      exercise,
      label: total.label,
      reps: total.reps,
      duration_seconds: Math.round(total.durationMs / 1000),
      hold_seconds: Math.round(total.holdMs / 1000),
      average_form_score: averageScore,
      issues,
      best_rep: total.bestRep,
      worst_rep: total.worstRep,
    };
    return payload;
  }, {} as Record<AutoExercise, ExerciseTotal>);
}

export function serializeIssues(issueCounts: Record<string, number>) {
  return Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([issue, count]) => ({ issue, count }));
}

export function activeTotals(totals: Partial<Record<AutoExercise, ExerciseTotal>>) {
  return TRACKED_EXERCISES.map((exercise) => totals[exercise]).filter((total): total is ExerciseTotal => Boolean(total));
}

export function summarizeHistoryTotals(item: PoseHistoryRow) {
  const totals = item.exercise_totals;
  if (!totals || typeof totals !== "object") {
    return `${item.reps || 0} reps`;
  }
  const pieces = TRACKED_EXERCISES.flatMap((exercise) => {
    const total = totals[exercise];
    if (!total) return [];
    if (exercise === "plank" && total.hold_seconds > 0) {
      return [`Plank ${formatDuration(total.hold_seconds)}`];
    }
    if (total.reps > 0) return [`${total.label} ${total.reps}`];
    return [];
  });
  return pieces.length ? pieces.join(" - ") : `${item.reps || 0} reps`;
}

function pushFeedback(feedback: LiveFeedbackItem[], line: string, timestamp: number, exercise: AutoExercise = "general") {
  const clean = String(line || "").trim();
  if (!clean) return;
  const duplicate = feedback.find(
    (item) => item.text === clean && timestamp - item.timestamp < 2200,
  );
  if (duplicate) return;
  feedback.unshift({
    id: `${timestamp}-${clean.slice(0, 18)}`,
    text: clean,
    exercise,
    timestamp,
  });
  feedback.splice(10);
}

function buildOffFrameState({
  setup,
  totals,
  issueCounts,
  feedback,
  currentExercise,
  lastGoodState,
}: {
  setup: AutoWorkoutState["setup"];
  totals: Record<AutoExercise, InternalExerciseTotal>;
  issueCounts: Record<string, number>;
  feedback: LiveFeedbackItem[];
  currentExercise: AutoExercise;
  lastGoodState?: AutoWorkoutState;
}): AutoWorkoutState {
  const previous = lastGoodState;
  const label = EXERCISE_LABELS[currentExercise] || EXERCISE_LABELS.general;
  return {
    status: "off_frame",
    headline: setup.messages[0] || "Body not detected",
    tips: setup.messages.length ? setup.messages : ["Step back and keep your body in frame."],
    phase: "not_detected",
    score: 0,
    detectedExercise: currentExercise || "general",
    detectedLabel: label,
    confidence: previous?.confidence || 0,
    confidenceScore: (previous?.confidence || 0) / 100,
    setup,
    totals: serializeTotals(totals),
    totalReps: Object.values(totals).reduce((sum, item) => sum + item.reps, 0),
    averageFormScore: previous?.averageFormScore || 0,
    feedback: feedback.slice(),
    detectedIssues: serializeIssues(issueCounts),
    exerciseScores: previous?.exerciseScores || {},
    metrics: { visible_keypoints: setup.visibleCount, confidence: setup.averageConfidence },
    bestReps: previous?.bestReps || {},
    worstReps: previous?.worstReps || {},
    trackingStable: false,
  };
}

export function createAutoWorkoutTracker(): AutoWorkoutTracker {
  let totals = createTotals();
  let phaseStates = createPhaseStates();
  let issueCounts: Record<string, number> = {};
  let feedback: LiveFeedbackItem[] = [];
  let history: ReturnType<typeof extractFrameFeatures>[] = [];
  let smoothedScores: Partial<Record<AutoExercise, number>> = {};
  let currentExercise: AutoExercise = "general";
  let lastTimestamp = 0;
  let lastGoodState: { timestamp: number; state: AutoWorkoutState } | null = null;
  let scoreSum = 0;
  let scoreFrames = 0;

  function reset() {
    totals = createTotals();
    phaseStates = createPhaseStates();
    issueCounts = {};
    feedback = [];
    history = [];
    smoothedScores = {};
    currentExercise = "general";
    lastTimestamp = 0;
    lastGoodState = null;
    scoreSum = 0;
    scoreFrames = 0;
  }

  function update(keypoints: PoseKeypoint[] = [], frame: PoseFrame = { width: 1, height: 1 }, timestamp = Date.now()) {
    const safeTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
    const deltaMs = lastTimestamp ? clamp(safeTimestamp - lastTimestamp, 0, 1000) : 0;
    lastTimestamp = safeTimestamp;

    const features = extractFrameFeatures(keypoints, frame, safeTimestamp);
    const setup = setupGuidance(features);

    if (!setup.trackable) {
      const lastGoodAge = lastGoodState ? safeTimestamp - lastGoodState.timestamp : Infinity;
      if (lastGoodAge < TRACKING_LOSS_GRACE_MS) {
        const recoveringState: AutoWorkoutState = {
          ...lastGoodState!.state,
          status: "adjust",
          headline: "Tracking through a brief dropout",
          tips: setup.messages.length ? setup.messages : ["Hold position while tracking stabilizes."],
          setup,
          trackingStable: false,
        };
        return recoveringState;
      }
      return buildOffFrameState({
        setup,
        totals,
        issueCounts,
        feedback,
        currentExercise,
        lastGoodState: lastGoodState?.state,
      });
    }

    history.push(features);
    if (history.length > HISTORY_LIMIT) history = history.slice(-HISTORY_LIMIT);

    const rawScores = candidateScores(features, history);
    const detection = chooseExercise(rawScores, smoothedScores, currentExercise);
    currentExercise = detection.exercise;
    smoothedScores = detection.scores;
    const confidenceScore = detection.confidence;
    const analysis = analyzeExercise(currentExercise, features, history, setup);
    const confidence = Math.round(clamp(confidenceScore, 0, 1) * 100);

    if (currentExercise !== "general") {
      totals[currentExercise].durationMs += deltaMs;
      totals[currentExercise].scoreSum += analysis.score;
      totals[currentExercise].scoreFrames += 1;
      for (const issue of analysis.issues) {
        totals[currentExercise].issueCounts[issue] = (totals[currentExercise].issueCounts[issue] || 0) + 1;
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      }
    }

    if (currentExercise === "plank" && analysis.phase === "hold" && analysis.score >= 42) {
      totals.plank.holdMs += deltaMs;
    }

    if (analysis.score > 0) {
      scoreSum += analysis.score;
      scoreFrames += 1;
    }

    const counted = updateRepCounter({
      exercise: currentExercise,
      analysis,
      confidence: confidenceScore,
      timestamp: safeTimestamp,
      phaseStates,
      totals,
    });

    if (counted) pushFeedback(feedback, counted.message, safeTimestamp, currentExercise);
    for (const tip of analysis.tips.slice(0, 2)) {
      pushFeedback(feedback, `${EXERCISE_LABELS[currentExercise]}: ${tip}`, safeTimestamp, currentExercise);
    }

    const serializedTotals = serializeTotals(totals);
    const totalReps = Object.values(serializedTotals).reduce((sum, item) => sum + item.reps, 0);
    const bestReps: AutoWorkoutState["bestReps"] = {};
    const worstReps: AutoWorkoutState["worstReps"] = {};
    for (const exercise of COUNTED_EXERCISES) {
      if (serializedTotals[exercise].best_rep) bestReps[exercise] = serializedTotals[exercise].best_rep;
      if (serializedTotals[exercise].worst_rep) worstReps[exercise] = serializedTotals[exercise].worst_rep;
    }

    const state: AutoWorkoutState = {
      status: analysis.status,
      headline: analysis.headline,
      tips: analysis.tips,
      phase: analysis.phase,
      score: analysis.score,
      detectedExercise: currentExercise,
      detectedLabel: EXERCISE_LABELS[currentExercise],
      confidence,
      confidenceScore: round(confidenceScore, 3),
      setup,
      totals: serializedTotals,
      totalReps,
      averageFormScore: scoreFrames ? Math.round(scoreSum / scoreFrames) : analysis.score,
      feedback: feedback.slice(),
      detectedIssues: serializeIssues(issueCounts),
      exerciseScores: Object.fromEntries(
        Object.entries(smoothedScores).map(([exercise, value]) => [exercise, round(value, 3)]),
      ),
      metrics: analysis.metrics,
      bestReps,
      worstReps,
      trackingStable: true,
    };

    lastGoodState = {
      timestamp: safeTimestamp,
      state,
    };

    return state;
  }

  return {
    update,
    reset,
  };
}
