import type { FormPhase } from "@/lib/pose/formHeuristics";
import type {
  AnalysisResult,
  AutoExercise,
  FrameFeatures,
  SetupGuidance,
} from "@/lib/pose/poseTypes";
import { baseMetrics, clamp, normalize, range, round, stdDev } from "@/lib/pose/poseMetrics";

export function phaseForExercise(exercise: AutoExercise, features: FrameFeatures): FormPhase {
  switch (exercise) {
    case "squat": {
      const kneeAngle = features.kneeAngle;
      if (kneeAngle === null || !Number.isFinite(kneeAngle) || !features.hip || !features.knee) return "unknown";
      if (kneeAngle > 148 && features.hip.y < features.knee.y - features.height * 0.035) return "standing";
      if (kneeAngle < 124 || (features.hipToKnee ?? -1) > -0.015) return "bottom";
      return "unknown";
    }
    case "lunge": {
      const frontKneeAngle = features.frontKneeAngle;
      if (frontKneeAngle === null || !Number.isFinite(frontKneeAngle)) return "unknown";
      if (frontKneeAngle > 148 && (features.kneeAsymmetry ?? 0) < 24) return "standing";
      if (frontKneeAngle < 124 && (features.kneeAsymmetry ?? 0) > 16) return "bottom";
      return "unknown";
    }
    case "pushup": {
      const elbowAngle = features.elbowAngle;
      if (elbowAngle === null || !Number.isFinite(elbowAngle)) return "unknown";
      if (elbowAngle > 152) return "top";
      if (elbowAngle < 116) return "bottom";
      return "unknown";
    }
    case "plank": {
      if (!features.shoulder || !features.hip || !features.fallbackAnkle) return "unknown";
      return "hold";
    }
    case "biceps_curl": {
      const elbowAngle = features.elbowAngle;
      if (elbowAngle === null || !Number.isFinite(elbowAngle)) return "unknown";
      if (elbowAngle > 145) return "down";
      if (elbowAngle < 82) return "top";
      return "unknown";
    }
    case "shoulder_press": {
      const elbowAngle = features.elbowAngle;
      if (!features.wrist || !features.shoulder || elbowAngle === null || !Number.isFinite(elbowAngle)) return "unknown";
      if (features.wrist.y < features.shoulder.y - features.height * 0.09 && elbowAngle > 136) return "top";
      if (features.wrist.y > features.shoulder.y - features.height * 0.015 && elbowAngle < 142) return "down";
      return "unknown";
    }
    case "jumping_jack": {
      const ankleWidthRatio = features.ankleWidthRatio;
      if (ankleWidthRatio === null || !Number.isFinite(ankleWidthRatio)) return "unknown";
      if (features.armsOverhead && ankleWidthRatio > 1.25) return "open";
      if (!features.armsOverhead && ankleWidthRatio < 1.14) return "closed";
      return "unknown";
    }
    default:
      return "unknown";
  }
}

export function candidateScores(features: FrameFeatures, history: FrameFeatures[]): Record<AutoExercise, number> {
  const recent = history.slice(-12);
  const kneeRange = range(recent, "kneeAngle");
  const elbowRange = range(recent, "elbowAngle");
  const ankleRange = range(recent, "ankleWidthRatio");
  const wristRange = range(recent, "wristY");
  const shoulderAngleRange = range(recent, "shoulderAngle");
  const shoulderMotion = stdDev(recent, "shoulderY", 10);
  const hasLower = features.groups.hips && features.groups.knees && features.groups.ankles;
  const hasUpper = features.groups.shoulders && features.groups.elbows && features.groups.wrists;
  const hasCore = features.groups.shoulders && features.groups.hips;
  const lowerQuality = hasLower ? normalize(features.avgScore, 0.18, 0.58) : 0;
  const upperQuality = hasUpper ? normalize(features.avgScore, 0.18, 0.58) : 0;
  const currentKneeFlex = Number.isFinite(features.kneeAngle) ? normalize(168 - Number(features.kneeAngle), 12, 66) : 0;
  const currentElbowFlex = Number.isFinite(features.elbowAngle) ? normalize(165 - Number(features.elbowAngle), 12, 82) : 0;
  const kneeMotion = normalize(kneeRange, 14, 58);
  const elbowMotion = normalize(elbowRange, 16, 92);
  const verticalBonus = features.bodyVertical ? 0.12 : 0;
  const horizontalBonus = features.bodyHorizontal ? 0.24 : 0;
  const twoKneeSymmetry = normalize(34 - (features.kneeAsymmetry ?? 34), 0, 34);
  const lungeSplit = normalize(features.kneeAsymmetry ?? 0, 18, 70);
  const jackMotion = Math.max(normalize(ankleRange, 0.18, 0.72), normalize(wristRange, 0.1, 0.34));
  const pressMotion = Math.max(normalize(wristRange, 0.08, 0.28), normalize(shoulderAngleRange, 12, 58));
  const wristsOverhead = features.armsOverhead ? 0.18 : 0;
  const wristsBelowShoulders =
    features.wristY !== null && features.shoulderY !== null && features.wristY > features.shoulderY - 0.02
      ? 0.16
      : 0;
  const bodyLine = Number.isFinite(features.bodyAngle) ? normalize(features.bodyAngle, 145, 178) : 0;
  const stablePlank = normalize(0.04 - stdDev(recent, "hipOffset", 10), 0, 0.04);

  const squat =
    lowerQuality *
    clamp(0.18 + kneeMotion * 0.3 + currentKneeFlex * 0.22 + twoKneeSymmetry * 0.12 + verticalBonus - lungeSplit * 0.18, 0, 1);
  const lunge =
    lowerQuality *
    clamp(0.12 + lungeSplit * 0.35 + currentKneeFlex * 0.22 + kneeMotion * 0.2 + verticalBonus - twoKneeSymmetry * 0.08, 0, 1);
  const pushup =
    (hasUpper && hasCore ? normalize(features.avgScore, 0.18, 0.58) : 0) *
    clamp(0.08 + horizontalBonus + elbowMotion * 0.28 + currentElbowFlex * 0.22 + bodyLine * 0.12, 0, 1);
  const plank =
    (hasCore && features.fallbackAnkle ? normalize(features.avgScore, 0.18, 0.58) : 0) *
    clamp(0.08 + horizontalBonus * 1.2 + bodyLine * 0.35 + stablePlank * 0.18 - elbowMotion * 0.22, 0, 1);
  const bicepsCurl =
    upperQuality *
    clamp(
      0.1 +
        elbowMotion * 0.35 +
        currentElbowFlex * 0.18 +
        verticalBonus +
        wristsBelowShoulders -
        pressMotion * 0.12 -
        normalize(shoulderMotion, 0.025, 0.08) * 0.12,
      0,
      1,
    );
  const shoulderPress =
    upperQuality *
    clamp(
      0.1 +
        pressMotion * 0.34 +
        wristsOverhead +
        verticalBonus +
        normalize(features.elbowAngle ?? 90, 110, 170) * 0.12 -
        (hasLower ? jackMotion * 0.22 : 0),
      0,
      1,
    );
  const jumpingJack =
    (hasLower && features.groups.wrists && features.groups.shoulders ? normalize(features.avgScore, 0.18, 0.58) : 0) *
    clamp(0.12 + jackMotion * 0.5 + (features.armsOverhead ? 0.14 : 0) + normalize(features.ankleWidthRatio ?? 1, 1.1, 1.7) * 0.2, 0, 1);

  return {
    squat: round(squat, 3),
    lunge: round(lunge, 3),
    pushup: round(pushup, 3),
    plank: round(plank, 3),
    biceps_curl: round(bicepsCurl, 3),
    shoulder_press: round(shoulderPress, 3),
    jumping_jack: round(jumpingJack, 3),
    situp: 0,
    lateral_raise: 0,
    deadlift: 0,
    general: 0.18,
  };
}

export function chooseExercise(
  scores: Record<AutoExercise, number>,
  smoothedScores: Partial<Record<AutoExercise, number>>,
  currentExercise: AutoExercise,
) {
  const nextScores = { ...smoothedScores };
  const eligible = Object.entries(scores).filter(([exercise]) => exercise !== "general") as Array<[AutoExercise, number]>;
  for (const [exercise, score] of eligible) {
    nextScores[exercise] = round((nextScores[exercise] ?? 0) * 0.72 + score * 0.28, 3);
  }
  nextScores.general = 0.18;

  const sorted = Object.entries(nextScores)
    .filter(([exercise]) => exercise !== "general")
    .sort((a, b) => Number(b[1]) - Number(a[1])) as Array<[AutoExercise, number]>;
  const [bestExercise, bestScore] = sorted[0] || ["general", 0];
  const currentScore = nextScores[currentExercise] ?? 0;

  if (!bestExercise || bestScore < 0.32) {
    return { exercise: "general" as AutoExercise, confidence: Math.max(bestScore, 0.18), scores: nextScores };
  }

  if (currentExercise !== "general" && currentScore >= bestScore - 0.08 && currentScore >= 0.34) {
    return { exercise: currentExercise, confidence: currentScore, scores: nextScores };
  }

  return { exercise: bestExercise, confidence: bestScore, scores: nextScores };
}

function analysisResult(
  exercise: AutoExercise,
  features: FrameFeatures,
  score: number,
  phase: FormPhase,
  headline: string,
  tips: string[],
  issues: string[],
  metrics: Record<string, number> = {},
): AnalysisResult {
  const finalScore = clamp(Math.round(score), 0, 100);
  return {
    status: finalScore >= 82 ? "good" : "adjust",
    headline,
    tips: tips.slice(0, 4),
    phase,
    score: finalScore,
    exercise,
    issues,
    metrics: { ...baseMetrics(features), ...metrics },
  };
}

function analyzeSquat(features: FrameFeatures) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 92;
  const phase = phaseForExercise("squat", features);
  const depth = features.hipToKnee ?? -0.1;

  if (phase === "bottom" && depth < -0.035) {
    tips.push("Squat depth is shallow. Sit lower until hips approach knee height.");
    issues.push("shallow_squat_depth");
    score -= 15;
  } else if (phase === "bottom") {
    tips.push("Good squat depth. Drive up while keeping knees tracking out.");
  }
  if ((features.kneeAnkleRatio ?? 1) < 0.74) {
    tips.push("Knees are caving inward. Push knees outward over your toes.");
    issues.push("knee_cave");
    score -= 17;
  }
  if ((features.kneeShift ?? 0) > 0.16) {
    tips.push("Knees are drifting too far forward. Keep weight through mid-foot.");
    issues.push("knees_forward");
    score -= 10;
  }
  if ((features.torsoLean ?? 0) > 0.17) {
    tips.push("Torso is leaning. Brace your core and keep chest proud.");
    issues.push("torso_lean");
    score -= 10;
  }
  if ((features.ankleWidthRatio ?? 1.2) < 0.95) {
    tips.push("Stance looks narrow. Set feet about shoulder-width before the next rep.");
    issues.push("narrow_stance");
    score -= 6;
  }
  if (!tips.length) tips.push("Squat alignment looks solid. Keep the descent smooth.");

  return analysisResult("squat", features, score, phase, score >= 82 ? "Squat form is tracking well" : "Adjust your squat", tips, issues, {
    depth: round(depth, 3),
  });
}

function analyzeLunge(features: FrameFeatures) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 91;
  const phase = phaseForExercise("lunge", features);

  if (phase === "bottom" && (features.frontKneeAngle ?? 180) > 112) {
    tips.push("Back knee depth is shallow. Lower with control before standing.");
    issues.push("shallow_lunge_depth");
    score -= 12;
  }
  if ((features.kneeShift ?? 0) > 0.16) {
    tips.push("Front knee is not stacked over the foot. Track knee over toes.");
    issues.push("front_knee_tracking");
    score -= 14;
  }
  if ((features.torsoLean ?? 0) > 0.16) {
    tips.push("Torso is leaning. Stay tall through ribs and hips.");
    issues.push("lunge_torso_lean");
    score -= 10;
  }
  if ((features.hipTilt ?? 0) > 0.07) {
    tips.push("Balance is shifting. Level your hips and slow the step.");
    issues.push("lunge_balance");
    score -= 10;
  }
  if (!tips.length) tips.push("Lunge looks controlled. Keep the front foot grounded.");

  return analysisResult("lunge", features, score, phase, score >= 82 ? "Lunge form is controlled" : "Adjust your lunge", tips, issues, {
    front_knee_angle: round(features.frontKneeAngle),
    knee_shift: round(features.kneeShift, 3),
  });
}

function analyzePushup(features: FrameFeatures) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 91;
  const phase = phaseForExercise("pushup", features);

  if (phase === "bottom" && (features.elbowAngle ?? 180) > 108) {
    tips.push("Elbow depth is short. Lower a little more before pressing up.");
    issues.push("pushup_shallow_depth");
    score -= 12;
  }
  if ((features.bodyAngle ?? 180) < 158 || (features.hipOffset ?? 0) > 0.065) {
    tips.push("Hips are sagging. Brace glutes and keep shoulder-hip-ankle in one line.");
    issues.push("hips_sagging");
    score -= 16;
  }
  if ((features.hipOffset ?? 0) < -0.075) {
    tips.push("Hips are too high. Lower hips into a straight body line.");
    issues.push("hips_too_high");
    score -= 12;
  }
  if (phase === "top" && (features.elbowAngle ?? 0) < 158) {
    tips.push("Lockout is incomplete. Finish with elbows long before the next rep.");
    issues.push("incomplete_lockout");
    score -= 8;
  }
  if ((features.wristShoulderStack ?? 0) > 0.2) {
    tips.push("Hands are drifting. Keep wrists closer under shoulders.");
    issues.push("hands_not_stacked");
    score -= 8;
  }
  if (!tips.length) tips.push("Push-up line looks strong. Keep the tempo controlled.");

  return analysisResult("pushup", features, score, phase, score >= 82 ? "Push-up line is strong" : "Adjust your push-up", tips, issues);
}

function analyzePlank(features: FrameFeatures, history: FrameFeatures[]) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 93;
  const stability = stdDev(history, "hipOffset", 10);

  if ((features.hipOffset ?? 0) < -0.075) {
    tips.push("Hips are too high. Lower hips until your body forms one line.");
    issues.push("plank_hips_high");
    score -= 14;
  } else if ((features.hipOffset ?? 0) > 0.075 || (features.bodyAngle ?? 180) < 160) {
    tips.push("Hips are dropping. Lift slightly and brace your core.");
    issues.push("plank_hips_low");
    score -= 16;
  }
  if (stability > 0.038) {
    tips.push("Hold is wobbling. Slow your breathing and press evenly through forearms or hands.");
    issues.push("plank_stability");
    score -= 8;
  }
  if (!tips.length) tips.push("Strong plank line. Keep breathing steady and hold the position.");

  return analysisResult("plank", features, score, "hold", score >= 82 ? "Plank line is steady" : "Adjust your plank", tips, issues, {
    stability: round(stability, 3),
  });
}

function analyzeBicepsCurl(features: FrameFeatures, history: FrameFeatures[]) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 91;
  const phase = phaseForExercise("biceps_curl", features);
  const elbowRange = range(history.slice(-12), "elbowAngle");
  const shoulderMotion = stdDev(history, "shoulderY", 10);

  if (elbowRange < 42) {
    tips.push("Range of motion is short. Lower fully, then curl to a clear top.");
    issues.push("curl_short_range");
    score -= 12;
  }
  if ((features.wristShoulderStack ?? 0) > 0.2) {
    tips.push("Elbows are drifting. Pin elbows near your sides.");
    issues.push("curl_elbow_drift");
    score -= 12;
  }
  if ((features.elbowAsymmetry ?? 0) > 28) {
    tips.push("Left and right arms are uneven. Curl both sides at the same speed.");
    issues.push("curl_asymmetry");
    score -= 10;
  }
  if (shoulderMotion > 0.045) {
    tips.push("Shoulders are swinging. Slow down and keep upper arms quiet.");
    issues.push("curl_swinging");
    score -= 12;
  }
  if (!tips.length) tips.push(phase === "top" ? "Good squeeze at the top. Lower slowly." : "Curl control looks good.");

  return analysisResult("biceps_curl", features, score, phase, score >= 82 ? "Curl control is clean" : "Adjust your curl", tips, issues, {
    range_of_motion: round(elbowRange),
    shoulder_motion: round(shoulderMotion, 3),
  });
}

function analyzeShoulderPress(features: FrameFeatures, history: FrameFeatures[]) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 91;
  const phase = phaseForExercise("shoulder_press", features);
  const pressRange = range(history.slice(-12), "wristY");

  if ((features.wristElbowStack ?? 0) > 0.16) {
    tips.push("Wrists and elbows are not stacked. Press straight up over elbows.");
    issues.push("press_stack");
    score -= 12;
  }
  if (phase === "top" && (features.elbowAngle ?? 0) < 150) {
    tips.push("Lockout is incomplete. Finish tall overhead before lowering.");
    issues.push("press_incomplete_lockout");
    score -= 10;
  }
  if (pressRange < 0.1) {
    tips.push("Press range is short. Move from shoulder height to overhead.");
    issues.push("press_short_range");
    score -= 10;
  }
  if ((features.elbowAsymmetry ?? 0) > 26) {
    tips.push("Left and right arms are uneven. Press both sides together.");
    issues.push("press_asymmetry");
    score -= 10;
  }
  if ((features.torsoLean ?? 0) > 0.15) {
    tips.push("Torso is leaning back. Keep ribs down as you press.");
    issues.push("press_torso_lean");
    score -= 10;
  }
  if (!tips.length) tips.push(phase === "top" ? "Strong overhead finish. Lower with control." : "Good press setup.");

  return analysisResult("shoulder_press", features, score, phase, score >= 82 ? "Shoulder press is controlled" : "Adjust your shoulder press", tips, issues, {
    press_range: round(pressRange, 3),
  });
}

function analyzeJumpingJack(features: FrameFeatures, history: FrameFeatures[]) {
  const tips: string[] = [];
  const issues: string[] = [];
  let score = 91;
  const phase = phaseForExercise("jumping_jack", features);
  const ankleRange = range(history.slice(-12), "ankleWidthRatio");
  const recentPhases = history.slice(-10).map((item) => phaseForExercise("jumping_jack", item));
  const openSeen = recentPhases.includes("open");
  const closedSeen = recentPhases.includes("closed");

  if (phase === "open" && !features.armsOverhead) {
    tips.push("Arms missed the top. Reach hands overhead on the open phase.");
    issues.push("jack_arms_short");
    score -= 12;
  }
  if ((features.ankleWidthRatio ?? 0) < 1.25 && phase !== "closed") {
    tips.push("Legs are not opening enough. Step feet wider on each jack.");
    issues.push("jack_legs_short");
    score -= 10;
  }
  if (ankleRange < 0.22 && openSeen) {
    tips.push("Open-close rhythm is small. Make the open and closed positions distinct.");
    issues.push("jack_missed_reps");
    score -= 10;
  }
  if (openSeen && !closedSeen) {
    tips.push("Return feet under hips to complete the rep.");
    issues.push("jack_missing_closed");
    score -= 8;
  }
  if (!tips.length) tips.push("Jumping jack rhythm looks clean. Keep landings soft.");

  return analysisResult("jumping_jack", features, score, phase, score >= 82 ? "Jumping jack rhythm is clean" : "Adjust your jumping jack", tips, issues, {
    width_ratio: round(features.ankleWidthRatio, 2),
    rhythm_range: round(ankleRange, 2),
  });
}

function analyzeGeneral(features: FrameFeatures, setup: SetupGuidance) {
  const tips =
    setup.messages[0] === "Framing is good"
      ? ["Move naturally. I am watching for squats, push-ups, lunges, curls, presses, jacks, or plank."]
      : setup.messages;
  return analysisResult("general", features, 72, "unknown", "Detecting movement", tips, [], {
    setup_ready: setup.trackable ? 1 : 0,
  });
}

export function analyzeExercise(
  exercise: AutoExercise,
  features: FrameFeatures,
  history: FrameFeatures[],
  setup: SetupGuidance,
): AnalysisResult {
  switch (exercise) {
    case "squat":
      return analyzeSquat(features);
    case "lunge":
      return analyzeLunge(features);
    case "pushup":
      return analyzePushup(features);
    case "plank":
      return analyzePlank(features, history);
    case "biceps_curl":
      return analyzeBicepsCurl(features, history);
    case "shoulder_press":
      return analyzeShoulderPress(features, history);
    case "jumping_jack":
      return analyzeJumpingJack(features, history);
    case "general":
    default:
      return analyzeGeneral(features, setup);
  }
}
