import type {
  AnalysisResult,
  CountedExercise,
  InternalExerciseTotal,
  PhaseState,
  RepRule,
  RepSummary,
} from "@/lib/pose/poseTypes";
import { COUNTED_EXERCISES } from "@/lib/pose/poseTypes";
import { clamp } from "@/lib/pose/poseMetrics";

export const REP_RULES: Record<CountedExercise, RepRule> = {
  squat: {
    start: "standing",
    arm: "bottom",
    count: "standing",
    minMotionMs: 380,
    debounceMs: 720,
    minConfidence: 0.46,
    minScore: 48,
    message: "Squat rep counted after a clear stand-bottom-stand cycle.",
  },
  pushup: {
    start: "top",
    arm: "bottom",
    count: "top",
    minMotionMs: 380,
    debounceMs: 720,
    minConfidence: 0.46,
    minScore: 48,
    message: "Push-up rep counted after a clear top-bottom-top cycle.",
  },
  lunge: {
    start: "standing",
    arm: "bottom",
    count: "standing",
    minMotionMs: 420,
    debounceMs: 760,
    minConfidence: 0.46,
    minScore: 46,
    message: "Lunge rep counted after returning from the bottom position.",
  },
  biceps_curl: {
    start: "down",
    arm: "top",
    count: "down",
    minMotionMs: 300,
    debounceMs: 620,
    minConfidence: 0.44,
    minScore: 45,
    message: "Curl rep counted after a controlled down-up-down cycle.",
  },
  shoulder_press: {
    start: "down",
    arm: "top",
    count: "down",
    minMotionMs: 360,
    debounceMs: 680,
    minConfidence: 0.44,
    minScore: 45,
    message: "Shoulder press rep counted after a full down-overhead-down cycle.",
  },
  jumping_jack: {
    start: "closed",
    arm: "open",
    count: "closed",
    minMotionMs: 220,
    debounceMs: 360,
    minConfidence: 0.42,
    minScore: 45,
    message: "Jumping jack counted after a full closed-open-closed rhythm.",
  },
  situp: {
    start: "down",
    arm: "top",
    count: "down",
    minMotionMs: 300,
    debounceMs: 620,
    minConfidence: 0.42,
    minScore: 42,
    message: "Sit-up counted after a full curl-up and controlled return.",
  },
  lateral_raise: {
    start: "down",
    arm: "top",
    count: "down",
    minMotionMs: 300,
    debounceMs: 620,
    minConfidence: 0.42,
    minScore: 42,
    message: "Lateral raise counted after reaching shoulder height and lowering with control.",
  },
  deadlift: {
    start: "standing",
    arm: "bottom",
    count: "standing",
    minMotionMs: 380,
    debounceMs: 720,
    minConfidence: 0.44,
    minScore: 44,
    message: "Deadlift counted after a clear hinge and full return to standing.",
  },
};

export function createPhaseStates(): Record<CountedExercise, PhaseState> {
  return COUNTED_EXERCISES.reduce((states, exercise) => {
    states[exercise] = {
      stage: "seek_start",
      stablePhase: "unknown",
      stableCount: 0,
      enteredAt: 0,
      armedAt: 0,
      lastRepAt: 0,
      minScore: 100,
      issues: new Set(),
    };
    return states;
  }, {} as Record<CountedExercise, PhaseState>);
}

function updatePhaseState(phaseState: PhaseState, phase: AnalysisResult["phase"], timestamp: number) {
  if (phase !== phaseState.stablePhase) {
    phaseState.stablePhase = phase;
    phaseState.stableCount = 1;
    phaseState.enteredAt = timestamp;
  } else {
    phaseState.stableCount += 1;
  }
}

export function updateRepCounter({
  exercise,
  analysis,
  confidence,
  timestamp,
  phaseStates,
  totals,
}: {
  exercise: keyof typeof REP_RULES | string;
  analysis: AnalysisResult;
  confidence: number;
  timestamp: number;
  phaseStates: Record<CountedExercise, PhaseState>;
  totals: Record<string, InternalExerciseTotal>;
}): { message: string; rep: RepSummary } | null {
  const rule = REP_RULES[exercise as CountedExercise];
  if (!rule) return null;

  const state = phaseStates[exercise as CountedExercise];
  const phase = analysis.phase;
  updatePhaseState(state, phase, timestamp);

  if (phase === "unknown" || phase === "not_detected") return null;
  if (analysis.issues?.length) {
    analysis.issues.forEach((issue) => state.issues.add(issue));
  }

  if (state.stage === "seek_start") {
    if (phase === rule.start && state.stableCount >= 2) {
      state.stage = "seek_arm";
      state.minScore = analysis.score;
      state.issues = new Set(analysis.issues || []);
    }
    return null;
  }

  if (state.stage === "seek_arm") {
    state.minScore = Math.min(state.minScore, analysis.score);
    if (phase === rule.arm && state.stableCount >= 2) {
      state.stage = "seek_count";
      state.armedAt = timestamp;
    }
    if (phase !== rule.start && phase !== rule.arm && timestamp - state.enteredAt > 2500) {
      state.stage = "seek_start";
    }
    return null;
  }

  state.minScore = Math.min(state.minScore, analysis.score);
  const motionLongEnough = timestamp - state.armedAt >= rule.minMotionMs;
  const debounced = timestamp - state.lastRepAt >= rule.debounceMs;
  const stableCountPhase = phase === rule.count && state.stableCount >= 2;
  const validQuality = analysis.score >= rule.minScore && confidence >= rule.minConfidence;

  if (stableCountPhase && motionLongEnough && debounced && validQuality) {
    state.lastRepAt = timestamp;
    state.stage = "seek_start";
    const repScore = clamp(Math.round((state.minScore + analysis.score) / 2), 0, 100);
    const rep = {
      rep_index: totals[exercise].reps + 1,
      score: repScore,
      issues: [...state.issues],
      completed_at: new Date(timestamp).toISOString(),
    };
    totals[exercise].reps += 1;
    if (!totals[exercise].bestRep || rep.score > totals[exercise].bestRep.score) totals[exercise].bestRep = rep;
    if (!totals[exercise].worstRep || rep.score < totals[exercise].worstRep.score) totals[exercise].worstRep = rep;
    state.issues = new Set();
    state.minScore = 100;
    return { message: rule.message, rep };
  }

  if (timestamp - state.armedAt > 7000) {
    state.stage = "seek_start";
    state.issues = new Set();
    state.minScore = 100;
  }

  return null;
}
