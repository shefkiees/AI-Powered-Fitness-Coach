import type { PoseKeypoint } from "@/lib/pose/drawPose";

const MIN_SCORE = 0.28;

function strong(kp: PoseKeypoint | undefined): kp is PoseKeypoint {
  return (kp?.score ?? 0) >= MIN_SCORE;
}

export type FormStatus = "good" | "adjust" | "off_frame";
export type FormExercise =
  | "general"
  | "squat"
  | "lunge"
  | "pushup"
  | "plank"
  | "shoulder_press"
  | "biceps_curl"
  | "jumping_jack";
export type FormPhase =
  | "unknown"
  | "not_detected"
  | "standing"
  | "bottom"
  | "top"
  | "down"
  | "hold"
  | "open"
  | "closed";

type AnalysisResult = {
  status: FormStatus;
  headline: string;
  tips: string[];
  phase: FormPhase;
  score: number;
  metrics?: Record<string, number>;
};

export type JointAngles = {
  left_shoulder: number | null;
  right_shoulder: number | null;
  shoulder: number | null;
  left_elbow: number | null;
  right_elbow: number | null;
  elbow: number | null;
  left_hip: number | null;
  right_hip: number | null;
  hip: number | null;
  left_knee: number | null;
  right_knee: number | null;
  knee: number | null;
  left_ankle: number | null;
  right_ankle: number | null;
  ankle: number | null;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function angle(a: PoseKeypoint, b: PoseKeypoint, c: PoseKeypoint) {
  // Joint angle at point b. MoveNet gives pixel coordinates, so vector math is
  // enough here; no calibration or camera intrinsics are needed for simple cues.
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLen = Math.hypot(ab.x, ab.y);
  const cbLen = Math.hypot(cb.x, cb.y);
  if (!abLen || !cbLen) return 180;
  const cosine = Math.min(1, Math.max(-1, dot / (abLen * cbLen)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function midpoint(a: PoseKeypoint, b: PoseKeypoint) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score ?? 0, b.score ?? 0),
  };
}

function average(values: Array<number | null>) {
  const clean = values.filter((value): value is number => Number.isFinite(value));
  if (!clean.length) return null;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function safeAngle(a?: PoseKeypoint, b?: PoseKeypoint, c?: PoseKeypoint) {
  if (!strong(a) || !strong(b) || !strong(c)) return null;
  return Math.round(angle(a, b, c));
}

function ankleAlignment(knee?: PoseKeypoint, anklePoint?: PoseKeypoint) {
  if (!strong(knee) || !strong(anklePoint)) return null;
  const verticalReference = {
    x: anklePoint.x,
    y: anklePoint.y - 100,
    score: 1,
  };
  return Math.round(angle(knee, anklePoint, verticalReference));
}

function points(keypoints: PoseKeypoint[]) {
  return {
    ls: keypoints[5],
    rs: keypoints[6],
    le: keypoints[7],
    re: keypoints[8],
    lw: keypoints[9],
    rw: keypoints[10],
    lh: keypoints[11],
    rh: keypoints[12],
    lk: keypoints[13],
    rk: keypoints[14],
    la: keypoints[15],
    ra: keypoints[16],
  };
}

export function calculateJointAngles(keypoints: PoseKeypoint[]): JointAngles {
  const { ls, rs, le, re, lw, rw, lh, rh, lk, rk, la, ra } = points(keypoints);
  const leftShoulder = safeAngle(le, ls, lh);
  const rightShoulder = safeAngle(re, rs, rh);
  const leftElbow = safeAngle(ls, le, lw);
  const rightElbow = safeAngle(rs, re, rw);
  const leftHip = safeAngle(ls, lh, lk);
  const rightHip = safeAngle(rs, rh, rk);
  const leftKnee = safeAngle(lh, lk, la);
  const rightKnee = safeAngle(rh, rk, ra);
  const leftAnkle = ankleAlignment(lk, la);
  const rightAnkle = ankleAlignment(rk, ra);

  return {
    left_shoulder: leftShoulder,
    right_shoulder: rightShoulder,
    shoulder: average([leftShoulder, rightShoulder]),
    left_elbow: leftElbow,
    right_elbow: rightElbow,
    elbow: average([leftElbow, rightElbow]),
    left_hip: leftHip,
    right_hip: rightHip,
    hip: average([leftHip, rightHip]),
    left_knee: leftKnee,
    right_knee: rightKnee,
    knee: average([leftKnee, rightKnee]),
    left_ankle: leftAnkle,
    right_ankle: rightAnkle,
    ankle: average([leftAnkle, rightAnkle]),
  };
}

function jointAnglesToMetrics(angles: JointAngles): Record<string, number> {
  return Object.entries(angles).reduce<Record<string, number>>((acc, [key, value]) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      acc[`${key}_angle`] = value;
    }
    return acc;
  }, {});
}

function poseQuality(keypoints: PoseKeypoint[], frame: { width: number; height: number }) {
  // Before judging form, confirm that enough confident keypoints are inside the
  // frame. This prevents bad reps caused by half-visible bodies or low light.
  const w = Math.max(frame.width, 1);
  const h = Math.max(frame.height, 1);
  const visible = keypoints.filter(
    (kp) =>
      strong(kp) &&
      Number.isFinite(kp.x) &&
      Number.isFinite(kp.y) &&
      kp.x >= 0 &&
      kp.y >= 0,
  );

  if (!visible.length) {
    return {
      avgScore: 0,
      visibleCount: 0,
      widthRatio: 0,
      heightRatio: 0,
      touchesEdge: false,
      metrics: {
        confidence: 0,
        visible_keypoints: 0,
        body_width_ratio: 0,
        body_height_ratio: 0,
      },
    };
  }

  const xs = visible.map((kp) => kp.x);
  const ys = visible.map((kp) => kp.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const avgScore = visible.reduce((sum, kp) => sum + (kp.score ?? 0), 0) / visible.length;
  const widthRatio = (maxX - minX) / w;
  const heightRatio = (maxY - minY) / h;
  const touchesEdge = minX < w * 0.025 || maxX > w * 0.975 || minY < h * 0.025 || maxY > h * 0.985;

  return {
    avgScore,
    visibleCount: visible.length,
    widthRatio,
    heightRatio,
    touchesEdge,
    metrics: {
      confidence: Number(avgScore.toFixed(2)),
      visible_keypoints: visible.length,
      body_width_ratio: Number(widthRatio.toFixed(2)),
      body_height_ratio: Number(heightRatio.toFixed(2)),
    },
  };
}

function offFrame(headline: string, tips: string[], metrics?: Record<string, number>): AnalysisResult {
  return {
    status: "off_frame",
    headline,
    tips,
    phase: "not_detected",
    score: 25,
    metrics,
  };
}

function result(
  score: number,
  phase: FormPhase,
  goodHeadline: string,
  adjustHeadline: string,
  tips: string[],
  metrics?: Record<string, number>,
): AnalysisResult {
  const finalScore = clampScore(score);
  return {
    status: finalScore >= 82 ? "good" : "adjust",
    headline: finalScore >= 82 ? goodHeadline : adjustHeadline,
    tips: tips.slice(0, 2),
    phase,
    score: finalScore,
    metrics,
  };
}

function analyzeSquatForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const w = Math.max(frame.width, 1);
  const { ls, rs, lh, rh, lk, rk, la, ra } = points(keypoints);

  if (![ls, rs, lh, rh, lk, rk, la, ra].every(strong)) {
    return offFrame("Step back for squat tracking", [
      "Keep shoulders, hips, knees, and ankles visible.",
      "Face the camera and keep both feet in frame.",
    ]);
  }

  const hip = midpoint(lh!, rh!);
  const knee = midpoint(lk!, rk!);
  const ankle = midpoint(la!, ra!);
  const shoulder = midpoint(ls!, rs!);
  const kneeAngle = (angle(lh!, lk!, la!) + angle(rh!, rk!, ra!)) / 2;
  // Squat depth is estimated from hip height relative to knee height. Lower
  // hips move this value toward zero/positive because browser y grows downward.
  const hipToKnee = Math.max(1, knee.y - hip.y);
  const shoulderToHip = Math.max(1, hip.y - shoulder.y);
  const depth = (hip.y - knee.y) / h;
  const kneeWidth = Math.abs(lk!.x - rk!.x);
  const ankleWidth = Math.max(1, Math.abs(la!.x - ra!.x));
  const kneeAnkleRatio = kneeWidth / ankleWidth;
  const centerShift = Math.abs(knee.x - ankle.x) / w;
  const torsoLean = Math.abs(shoulder.x - hip.x) / w;
  const hipTilt = Math.abs(lh!.y - rh!.y) / h;
  const phase: FormPhase =
    kneeAngle > 145 ? "standing" : kneeAngle < 122 || depth > -0.01 ? "bottom" : "unknown";
  const tips: string[] = [];
  let score = 92;

  if (phase === "bottom" && depth < -0.04) {
    tips.push("Go a little lower before standing.");
    score -= 14;
  }
  if (kneeAnkleRatio < 0.72) {
    tips.push("Push knees out so they track over your toes.");
    score -= 18;
  }
  if (centerShift > 0.1) {
    tips.push("Keep weight balanced through mid-foot.");
    score -= 10;
  }
  if (torsoLean > 0.18 && shoulderToHip > hipToKnee * 0.55) {
    tips.push("Keep chest proud and brace your core.");
    score -= 10;
  }
  if (hipTilt > 0.06) {
    tips.push("Level your hips and keep both sides even.");
    score -= 8;
  }
  if (!tips.length) {
    tips.push(
      phase === "bottom"
        ? "Good depth. Drive up with control."
        : phase === "standing"
          ? "Strong top position. Start the next rep smoothly."
          : "Good alignment. Keep the tempo controlled.",
    );
  }

  return result(score, phase, phase === "bottom" ? "Good squat depth" : "Squat form looks solid", "Adjust your squat", tips, {
    knee_angle: Math.round(kneeAngle),
    depth: Number(depth.toFixed(3)),
    knee_ankle_ratio: Number(kneeAnkleRatio.toFixed(2)),
    center_shift: Number(centerShift.toFixed(3)),
    torso_lean: Number(torsoLean.toFixed(3)),
  });
}

function analyzeLungeForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const w = Math.max(frame.width, 1);
  const { ls, rs, lh, rh, lk, rk, la, ra } = points(keypoints);

  if (![ls, rs, lh, rh, lk, rk, la, ra].every(strong)) {
    return offFrame("Step back for lunge tracking", [
      "Keep the full lower body visible.",
      "Use a side or slight diagonal angle for best feedback.",
    ]);
  }

  const hip = midpoint(lh!, rh!);
  const shoulder = midpoint(ls!, rs!);
  const leftKneeAngle = angle(lh!, lk!, la!);
  const rightKneeAngle = angle(rh!, rk!, ra!);
  const frontKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
  const phase: FormPhase = frontKneeAngle > 150 ? "standing" : frontKneeAngle < 120 ? "bottom" : "unknown";
  const kneeShift = Math.max(Math.abs(lk!.x - la!.x), Math.abs(rk!.x - ra!.x)) / w;
  const torsoLean = Math.abs(shoulder.x - hip.x) / w;
  const hipTilt = Math.abs(lh!.y - rh!.y) / h;
  const tips: string[] = [];
  let score = 90;

  if (phase === "bottom" && frontKneeAngle > 105) {
    tips.push("Lower with control until the front leg bends clearly.");
    score -= 10;
  }
  if (kneeShift > 0.14) {
    tips.push("Keep the front knee stacked over the foot.");
    score -= 14;
  }
  if (torsoLean > 0.16) {
    tips.push("Stay tall through your chest and ribs.");
    score -= 10;
  }
  if (hipTilt > 0.07) {
    tips.push("Keep hips level as you step.");
    score -= 8;
  }
  if (!tips.length) tips.push(phase === "bottom" ? "Good lunge depth. Push through the front foot." : "Smooth lunge alignment.");

  return result(score, phase, "Lunge form looks controlled", "Adjust your lunge", tips, {
    front_knee_angle: Math.round(frontKneeAngle),
    knee_shift: Number(kneeShift.toFixed(3)),
    torso_lean: Number(torsoLean.toFixed(3)),
  });
}

function analyzePushupForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const w = Math.max(frame.width, 1);
  const { ls, rs, le, re, lw, rw, lh, rh, la, ra } = points(keypoints);

  if (![ls, rs, le, re, lw, rw, lh, rh].every(strong)) {
    return offFrame("Need upper body in frame", [
      "Use a side angle if possible.",
      "Keep shoulders, elbows, wrists, and hips visible.",
    ]);
  }

  const shoulder = midpoint(ls!, rs!);
  const hip = midpoint(lh!, rh!);
  const ankle = strong(la) && strong(ra) ? midpoint(la!, ra!) : null;
  const elbowAngle = (angle(ls!, le!, lw!) + angle(rs!, re!, rw!)) / 2;
  // Push-ups are counted from a bent-elbow bottom back to an extended top.
  // Body line uses shoulder-hip-ankle angle so sagging hips reduce the score.
  const phase: FormPhase = elbowAngle > 150 ? "top" : elbowAngle < 112 ? "bottom" : "unknown";
  const wristUnderShoulder = Math.abs(shoulder.x - midpoint(lw!, rw!).x) / w;
  const bodyAngle = ankle ? angle(shoulder, hip, ankle) : 175;
  const hipDrop = ankle ? Math.abs(180 - bodyAngle) : 0;
  const shoulderHeight = Math.abs(ls!.y - rs!.y) / h;
  const tips: string[] = [];
  let score = 90;

  if (phase === "bottom" && elbowAngle > 105) {
    tips.push("Lower a little more while keeping control.");
    score -= 9;
  }
  if (wristUnderShoulder > 0.18) {
    tips.push("Keep hands closer under the shoulders.");
    score -= 10;
  }
  if (hipDrop > 20) {
    tips.push("Keep shoulders, hips, and ankles in one strong line.");
    score -= 16;
  }
  if (shoulderHeight > 0.06) {
    tips.push("Press evenly through both arms.");
    score -= 8;
  }
  if (!tips.length) tips.push(phase === "bottom" ? "Good depth. Press up without losing body line." : "Strong push-up line.");

  return result(score, phase, "Push-up form looks strong", "Adjust your push-up", tips, {
    elbow_angle: Math.round(elbowAngle),
    body_angle: Math.round(bodyAngle),
    wrist_shift: Number(wristUnderShoulder.toFixed(3)),
  });
}

function analyzePlankForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const { ls, rs, lh, rh, la, ra } = points(keypoints);

  if (![ls, rs, lh, rh].every(strong) || !(strong(la) || strong(ra))) {
    return offFrame("Need side body for plank", [
      "Use a side angle for best plank feedback.",
      "Keep shoulders, hips, and ankles visible.",
    ]);
  }

  const shoulder = midpoint(ls!, rs!);
  const hip = midpoint(lh!, rh!);
  const ankle = strong(la) && strong(ra) ? midpoint(la!, ra!) : strong(la) ? la! : ra!;
  const bodyAngle = angle(shoulder, hip, ankle);
  // Plank does not count reps. The score is mostly body-line angle plus whether
  // the hips sit above or below the shoulder-ankle line.
  const hipOffset = (hip.y - (shoulder.y + ankle.y) / 2) / h;
  const tips: string[] = [];
  let score = 92;

  if (bodyAngle < 160 || hipOffset > 0.08) {
    tips.push("Lift hips slightly and brace your core.");
    score -= 16;
  } else if (hipOffset < -0.08) {
    tips.push("Lower hips slightly so your body forms one line.");
    score -= 12;
  }
  if (!tips.length) tips.push("Strong plank line. Keep breathing slow and steady.");

  return result(score, "hold", "Plank line looks solid", "Adjust your plank", tips, {
    body_angle: Math.round(bodyAngle),
    hip_offset: Number(hipOffset.toFixed(3)),
  });
}

function analyzeShoulderPressForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const w = Math.max(frame.width, 1);
  const { ls, rs, le, re, lw, rw, lh, rh } = points(keypoints);

  if (![ls, rs, le, re, lw, rw].every(strong)) {
    return offFrame("Need arms in frame", [
      "Keep wrists, elbows, and shoulders visible.",
      "Face the camera with both arms in view.",
    ]);
  }

  const shoulder = midpoint(ls!, rs!);
  const wrist = midpoint(lw!, rw!);
  const elbow = midpoint(le!, re!);
  const elbowAngle = (angle(ls!, le!, lw!) + angle(rs!, re!, rw!)) / 2;
  const overhead = wrist.y < shoulder.y - h * 0.1;
  const phase: FormPhase = overhead && elbowAngle > 140 ? "top" : wrist.y > shoulder.y - h * 0.02 ? "down" : "unknown";
  const wristElbowStack = Math.abs(wrist.x - elbow.x) / w;
  const ribLean = strong(lh) && strong(rh) ? Math.abs(shoulder.x - midpoint(lh!, rh!).x) / w : 0;
  const tips: string[] = [];
  let score = 90;

  if (wristElbowStack > 0.14) {
    tips.push("Stack wrists over elbows as you press.");
    score -= 12;
  }
  if (phase === "top" && elbowAngle < 150) {
    tips.push("Finish the press tall without shrugging.");
    score -= 8;
  }
  if (ribLean > 0.14) {
    tips.push("Keep ribs down and avoid leaning back.");
    score -= 12;
  }
  if (!tips.length) tips.push(phase === "top" ? "Strong lockout. Lower with control." : "Good setup. Press smoothly overhead.");

  return result(score, phase, "Shoulder press looks controlled", "Adjust your shoulder press", tips, {
    elbow_angle: Math.round(elbowAngle),
    wrist_elbow_stack: Number(wristElbowStack.toFixed(3)),
    rib_lean: Number(ribLean.toFixed(3)),
  });
}

function analyzeBicepsCurlForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const w = Math.max(frame.width, 1);
  const { ls, rs, le, re, lw, rw } = points(keypoints);

  if (![ls, rs, le, re, lw, rw].every(strong)) {
    return offFrame("Need arms in frame", [
      "Keep shoulders, elbows, and wrists visible.",
      "Face the camera and curl with control.",
    ]);
  }

  const leftAngle = angle(ls!, le!, lw!);
  const rightAngle = angle(rs!, re!, rw!);
  const elbowAngle = (leftAngle + rightAngle) / 2;
  const phase: FormPhase = elbowAngle < 75 ? "top" : elbowAngle > 145 ? "down" : "unknown";
  const elbowDrift = Math.max(Math.abs(le!.x - ls!.x), Math.abs(re!.x - rs!.x)) / w;
  const asymmetry = Math.abs(leftAngle - rightAngle);
  const tips: string[] = [];
  let score = 90;

  if (elbowDrift > 0.16) {
    tips.push("Keep elbows close to your sides.");
    score -= 12;
  }
  if (asymmetry > 28) {
    tips.push("Curl both arms at the same speed.");
    score -= 10;
  }
  if (!tips.length) tips.push(phase === "top" ? "Good squeeze at the top. Lower slowly." : "Good control. Avoid swinging.");

  return result(score, phase, "Curl form looks controlled", "Adjust your curl", tips, {
    elbow_angle: Math.round(elbowAngle),
    elbow_drift: Number(elbowDrift.toFixed(3)),
    asymmetry: Math.round(asymmetry),
  });
}

function analyzeJumpingJackForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const { ls, rs, lw, rw, la, ra } = points(keypoints);

  if (![ls, rs, lw, rw, la, ra].every(strong)) {
    return offFrame("Need full body for jumping jacks", [
      "Step back so hands and feet are visible.",
      "Keep the camera steady while moving.",
    ]);
  }

  const shoulder = midpoint(ls!, rs!);
  const wrist = midpoint(lw!, rw!);
  const ankleWidth = Math.abs(la!.x - ra!.x);
  const shoulderWidth = Math.max(1, Math.abs(ls!.x - rs!.x));
  const widthRatio = ankleWidth / shoulderWidth;
  const armsOverhead = wrist.y < shoulder.y - h * 0.08;
  const phase: FormPhase = armsOverhead && widthRatio > 1.25 ? "open" : !armsOverhead && widthRatio < 1.1 ? "closed" : "unknown";
  const tips: string[] = [];
  let score = 90;

  if (phase === "open" && widthRatio < 1.35) {
    tips.push("Open feet a little wider at the top.");
    score -= 8;
  }
  if (phase === "open" && !armsOverhead) {
    tips.push("Reach arms fully overhead.");
    score -= 10;
  }
  if (!tips.length) tips.push(phase === "open" ? "Good open position. Land softly." : "Good rhythm. Stay light on your feet.");

  return result(score, phase, "Jumping jack rhythm looks good", "Adjust your jumping jack", tips, {
    width_ratio: Number(widthRatio.toFixed(2)),
    arms_overhead: armsOverhead ? 1 : 0,
  });
}

function analyzeGeneralForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): AnalysisResult {
  const h = Math.max(frame.height, 1);
  const w = Math.max(frame.width, 1);

  if (!keypoints.length) {
    return offFrame("No pose detected", ["Allow camera access and step back so your full body is visible."]);
  }

  const { ls, rs, lh, rh, lk, rk, la, ra } = points(keypoints);
  if (!(strong(ls) && strong(rs) && strong(lh) && strong(rh) && strong(lk) && strong(rk))) {
    return offFrame("Need better framing", ["Keep hips, knees, and shoulders in frame for form feedback."]);
  }

  const tips: string[] = [];
  const hipTilt = Math.abs(lh!.y - rh!.y) / h;
  if (hipTilt > 0.07) tips.push("Level your hips - square up to the camera.");

  if (strong(la) && strong(ra)) {
    const kneeOverToeL = (lk!.x - la!.x) / w;
    const kneeOverToeR = (rk!.x - ra!.x) / w;
    if (Math.abs(kneeOverToeL) > 0.12 || Math.abs(kneeOverToeR) > 0.12) {
      tips.push("Keep knees tracking over toes - not caving in or drifting far forward.");
    }
  }

  const shoulderMidY = (ls!.y + rs!.y) / 2;
  const hipMidY = (lh!.y + rh!.y) / 2;
  const drop = (hipMidY - shoulderMidY) / h;
  if (drop > 0.14) tips.push("Lift hips slightly - brace your core like a plank.");

  if (!tips.length) {
    return {
      status: "good",
      headline: "Good form",
      tips: ["Solid alignment. Keep smooth breathing and controlled tempo."],
      phase: "unknown",
      score: 90,
    };
  }

  return {
    status: "adjust",
    headline: "Adjust posture",
    tips: tips.slice(0, 2),
    phase: "unknown",
    score: 72,
  };
}

export function analyzePoseForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
  exercise: FormExercise = "general",
): AnalysisResult {
  const angleMetrics = jointAnglesToMetrics(calculateJointAngles(keypoints));
  const quality = poseQuality(keypoints, frame);
  const baseMetrics = { ...angleMetrics, ...quality.metrics };

  if (quality.visibleCount < 6) {
    return offFrame("Body not detected", [
      "Step back until your full body is visible.",
      "Keep the camera steady and face the movement area.",
    ], baseMetrics);
  }

  if (quality.avgScore < 0.36) {
    return offFrame("Low light or unclear pose", [
      "Move to better lighting so the skeleton can lock on.",
      "Avoid dark clothing against a dark background if possible.",
    ], baseMetrics);
  }

  if ((quality.heightRatio > 0.94 || quality.widthRatio > 0.82) && quality.touchesEdge) {
    return offFrame("Too close to camera", [
      "Step back so hands, feet, and head stay inside the frame.",
      "Leave some space around your body before starting reps.",
    ], baseMetrics);
  }

  const analysis = (() => {
    switch (exercise) {
    case "squat":
      return analyzeSquatForm(keypoints, frame);
    case "lunge":
      return analyzeLungeForm(keypoints, frame);
    case "pushup":
      return analyzePushupForm(keypoints, frame);
    case "plank":
      return analyzePlankForm(keypoints, frame);
    case "shoulder_press":
      return analyzeShoulderPressForm(keypoints, frame);
    case "biceps_curl":
      return analyzeBicepsCurlForm(keypoints, frame);
    case "jumping_jack":
      return analyzeJumpingJackForm(keypoints, frame);
    case "general":
    default:
      return analyzeGeneralForm(keypoints, frame);
    }
  })();

  return {
    ...analysis,
    metrics: { ...baseMetrics, ...(analysis.metrics || {}) },
  };
}
