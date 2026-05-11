const EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
  "general",
];

const COUNTED_EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
];

const EXERCISE_LABELS = {
  squat: "Squat",
  pushup: "Push-up",
  lunge: "Lunge",
  biceps_curl: "Biceps curl",
  shoulder_press: "Shoulder press",
  jumping_jack: "Jumping jack",
  plank: "Plank",
  general: "General / unknown",
};

const REP_RULES = {
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
};

const TRACKING_LOSS_GRACE_MS = 900;
const HISTORY_LIMIT = 24;
const MIN_KEYPOINT_SCORE = 0.23;
const LOW_KEYPOINT_SCORE = 0.16;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value, low, high) {
  if (!Number.isFinite(value)) return 0;
  if (high === low) return value >= high ? 1 : 0;
  return clamp((value - low) / (high - low), 0, 1);
}

function round(value, digits = 0) {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function strong(point, minScore = MIN_KEYPOINT_SCORE) {
  return Boolean(
    point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      (point.score ?? 0) >= minScore,
  );
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function angle(a, b, c) {
  if (!a || !b || !c) return null;
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLen = Math.hypot(ab.x, ab.y);
  const cbLen = Math.hypot(cb.x, cb.y);
  if (!abLen || !cbLen) return null;
  const cosine = clamp(dot / (abLen * cbLen), -1, 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

function midpoint(a, b) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score ?? 0, b.score ?? 0),
  };
}

function keypointMap(keypoints) {
  return {
    nose: keypoints[0],
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

function range(history, key) {
  const values = history
    .map((item) => item[key])
    .filter((value) => Number.isFinite(value));
  if (values.length < 2) return 0;
  return Math.max(...values) - Math.min(...values);
}

function stdDev(history, key, count = 10) {
  const values = history
    .slice(-count)
    .map((item) => item[key])
    .filter((value) => Number.isFinite(value));
  if (values.length < 2) return 0;
  const mean = average(values) ?? 0;
  const variance = average(values.map((value) => (value - mean) ** 2)) ?? 0;
  return Math.sqrt(variance);
}

function groupVisible(points) {
  return {
    head: strong(points.nose, LOW_KEYPOINT_SCORE),
    shoulders: strong(points.ls) && strong(points.rs),
    elbows: strong(points.le) && strong(points.re),
    wrists: strong(points.lw) && strong(points.rw),
    hips: strong(points.lh) && strong(points.rh),
    knees: strong(points.lk) && strong(points.rk),
    ankles: strong(points.la) && strong(points.ra),
    leftArm: strong(points.ls) && strong(points.le) && strong(points.lw),
    rightArm: strong(points.rs) && strong(points.re) && strong(points.rw),
    leftLeg: strong(points.lh) && strong(points.lk) && strong(points.la),
    rightLeg: strong(points.rh) && strong(points.rk) && strong(points.ra),
  };
}

function extractFrameFeatures(keypoints = [], frame = { width: 1, height: 1 }, timestamp = Date.now()) {
  const width = Math.max(1, Number(frame.width) || 1);
  const height = Math.max(1, Number(frame.height) || 1);
  const points = keypointMap(keypoints);
  const groups = groupVisible(points);
  const visible = keypoints.filter(
    (point) =>
      strong(point, LOW_KEYPOINT_SCORE) &&
      point.x >= 0 &&
      point.y >= 0 &&
      point.x <= width &&
      point.y <= height,
  );

  const xs = visible.map((point) => point.x);
  const ys = visible.map((point) => point.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  const avgScore = visible.length
    ? visible.reduce((sum, point) => sum + (point.score ?? 0), 0) / visible.length
    : 0;
  const widthRatio = (maxX - minX) / width;
  const heightRatio = (maxY - minY) / height;
  const touchesEdge =
    visible.length > 0 &&
    (minX < width * 0.025 ||
      maxX > width * 0.975 ||
      minY < height * 0.025 ||
      maxY > height * 0.985);

  const shoulder = groups.shoulders ? midpoint(points.ls, points.rs) : null;
  const elbow = groups.elbows ? midpoint(points.le, points.re) : null;
  const wrist = groups.wrists ? midpoint(points.lw, points.rw) : null;
  const hip = groups.hips ? midpoint(points.lh, points.rh) : null;
  const knee = groups.knees ? midpoint(points.lk, points.rk) : null;
  const ankle = groups.ankles ? midpoint(points.la, points.ra) : null;
  const fallbackAnkle = ankle || (strong(points.la) ? points.la : strong(points.ra) ? points.ra : null);

  const leftKneeAngle = groups.leftLeg ? angle(points.lh, points.lk, points.la) : null;
  const rightKneeAngle = groups.rightLeg ? angle(points.rh, points.rk, points.ra) : null;
  const leftElbowAngle = groups.leftArm ? angle(points.ls, points.le, points.lw) : null;
  const rightElbowAngle = groups.rightArm ? angle(points.rs, points.re, points.rw) : null;
  const leftShoulderAngle =
    strong(points.le) && strong(points.ls) && strong(points.lh)
      ? angle(points.le, points.ls, points.lh)
      : null;
  const rightShoulderAngle =
    strong(points.re) && strong(points.rs) && strong(points.rh)
      ? angle(points.re, points.rs, points.rh)
      : null;

  const kneeAngle = average([leftKneeAngle, rightKneeAngle]);
  const elbowAngle = average([leftElbowAngle, rightElbowAngle]);
  const shoulderAngle = average([leftShoulderAngle, rightShoulderAngle]);
  const bodyAngle = shoulder && hip && fallbackAnkle ? angle(shoulder, hip, fallbackAnkle) : null;
  const shoulderWidth = groups.shoulders ? Math.max(1, Math.abs(points.ls.x - points.rs.x)) : null;
  const ankleWidth = groups.ankles ? Math.abs(points.la.x - points.ra.x) : null;
  const kneeWidth = groups.knees ? Math.abs(points.lk.x - points.rk.x) : null;
  const ankleWidthRatio = shoulderWidth && ankleWidth !== null ? ankleWidth / shoulderWidth : null;
  const kneeAnkleRatio = ankleWidth && kneeWidth !== null ? kneeWidth / Math.max(1, ankleWidth) : null;
  const wristY = wrist ? wrist.y / height : null;
  const shoulderY = shoulder ? shoulder.y / height : null;
  const hipY = hip ? hip.y / height : null;
  const kneeY = knee ? knee.y / height : null;
  const ankleY = ankle ? ankle.y / height : null;
  const shoulderHipY = shoulder && hip ? Math.abs(shoulder.y - hip.y) / height : null;
  const shoulderHipX = shoulder && hip ? Math.abs(shoulder.x - hip.x) / width : null;
  const torsoLean = shoulder && hip ? Math.abs(shoulder.x - hip.x) / width : null;
  const hipTilt = strong(points.lh) && strong(points.rh) ? Math.abs(points.lh.y - points.rh.y) / height : null;
  const wristElbowStack = wrist && elbow ? Math.abs(wrist.x - elbow.x) / width : null;
  const wristShoulderStack = wrist && shoulder ? Math.abs(wrist.x - shoulder.x) / width : null;
  const kneeShift =
    groups.knees && groups.ankles
      ? Math.max(Math.abs(points.lk.x - points.la.x), Math.abs(points.rk.x - points.ra.x)) / width
      : null;
  const frontKneeAngle = average([leftKneeAngle, rightKneeAngle]) === null
    ? null
    : Math.min(
      Number.isFinite(leftKneeAngle) ? leftKneeAngle : 180,
      Number.isFinite(rightKneeAngle) ? rightKneeAngle : 180,
    );
  const kneeAsymmetry =
    Number.isFinite(leftKneeAngle) && Number.isFinite(rightKneeAngle)
      ? Math.abs(leftKneeAngle - rightKneeAngle)
      : null;
  const elbowAsymmetry =
    Number.isFinite(leftElbowAngle) && Number.isFinite(rightElbowAngle)
      ? Math.abs(leftElbowAngle - rightElbowAngle)
      : null;
  const hipToKnee = hip && knee ? (hip.y - knee.y) / height : null;
  const armsOverhead = wrist && shoulder ? wrist.y < shoulder.y - height * 0.08 : false;
  const bodyHorizontal =
    shoulderHipY !== null && shoulderHipX !== null
      ? shoulderHipY < 0.2 && shoulderHipX > 0.08
      : false;
  const bodyVertical =
    shoulder && hip && hip.y > shoulder.y + height * 0.12;
  const hipOffset =
    shoulder && hip && fallbackAnkle ? (hip.y - (shoulder.y + fallbackAnkle.y) / 2) / height : null;

  return {
    timestamp,
    width,
    height,
    keypoints,
    points,
    groups,
    visibleCount: visible.length,
    avgScore,
    widthRatio,
    heightRatio,
    touchesEdge,
    shoulder,
    elbow,
    wrist,
    hip,
    knee,
    ankle,
    fallbackAnkle,
    shoulderWidth,
    ankleWidth,
    kneeWidth,
    ankleWidthRatio,
    kneeAnkleRatio,
    kneeAngle,
    leftKneeAngle,
    rightKneeAngle,
    frontKneeAngle,
    kneeAsymmetry,
    elbowAngle,
    leftElbowAngle,
    rightElbowAngle,
    elbowAsymmetry,
    shoulderAngle,
    bodyAngle,
    wristY,
    shoulderY,
    hipY,
    kneeY,
    ankleY,
    shoulderHipY,
    shoulderHipX,
    torsoLean,
    hipTilt,
    wristElbowStack,
    wristShoulderStack,
    kneeShift,
    hipToKnee,
    armsOverhead,
    bodyHorizontal,
    bodyVertical,
    hipOffset,
  };
}

function setupGuidance(features) {
  const checklist = [
    { label: "Shoulders visible", ok: features.groups.shoulders },
    { label: "Hips visible", ok: features.groups.hips },
    { label: "Knees visible", ok: features.groups.knees },
    { label: "Ankles visible", ok: features.groups.ankles },
    { label: "Hands visible", ok: features.groups.wrists },
    { label: "Tracking confidence", ok: features.avgScore >= 0.28 && features.visibleCount >= 6 },
  ];
  const messages = [];

  if (!features.visibleCount || features.avgScore < 0.2) {
    messages.push("Lighting too low / low confidence");
    messages.push("Step back");
  }
  if (features.heightRatio > 0.9 || features.widthRatio > 0.82 || features.touchesEdge) {
    messages.push("Step back");
  }
  if (!features.groups.shoulders && (features.groups.hips || features.groups.knees)) {
    messages.push("Raise camera");
    messages.push("Need shoulders visible");
  } else if (!features.groups.shoulders) {
    messages.push("Need shoulders visible");
  }
  if (!features.groups.knees && (features.groups.hips || features.groups.ankles)) {
    messages.push("Need knees visible");
  }
  if (features.visibleCount >= 6 && !messages.length) {
    messages.push("Framing is good");
  }

  const partialUpper = features.groups.shoulders && features.groups.elbows && features.groups.wrists;
  const partialLower = features.groups.hips && features.groups.knees && (features.groups.ankles || features.groups.shoulders);
  const trackable =
    features.visibleCount >= 5 &&
    features.avgScore >= 0.21 &&
    (partialUpper || partialLower || (features.groups.shoulders && features.groups.hips));

  return {
    trackable,
    messages: [...new Set(messages)].slice(0, 4),
    checklist,
    visibleCount: features.visibleCount,
    averageConfidence: round(features.avgScore, 2),
    bodyHeightRatio: round(features.heightRatio, 2),
    bodyWidthRatio: round(features.widthRatio, 2),
  };
}

function phaseForExercise(exercise, features) {
  switch (exercise) {
    case "squat": {
      if (!Number.isFinite(features.kneeAngle) || !features.hip || !features.knee) return "unknown";
      if (features.kneeAngle > 148 && features.hip.y < features.knee.y - features.height * 0.035) return "standing";
      if (features.kneeAngle < 124 || features.hipToKnee > -0.015) return "bottom";
      return "unknown";
    }
    case "lunge": {
      if (!Number.isFinite(features.frontKneeAngle)) return "unknown";
      if (features.frontKneeAngle > 148 && (features.kneeAsymmetry ?? 0) < 24) return "standing";
      if (features.frontKneeAngle < 124 && (features.kneeAsymmetry ?? 0) > 16) return "bottom";
      return "unknown";
    }
    case "pushup": {
      if (!Number.isFinite(features.elbowAngle)) return "unknown";
      if (features.elbowAngle > 152) return "top";
      if (features.elbowAngle < 116) return "bottom";
      return "unknown";
    }
    case "plank": {
      if (!features.shoulder || !features.hip || !features.fallbackAnkle) return "unknown";
      return "hold";
    }
    case "biceps_curl": {
      if (!Number.isFinite(features.elbowAngle)) return "unknown";
      if (features.elbowAngle > 145) return "down";
      if (features.elbowAngle < 82) return "top";
      return "unknown";
    }
    case "shoulder_press": {
      if (!features.wrist || !features.shoulder || !Number.isFinite(features.elbowAngle)) return "unknown";
      if (features.wrist.y < features.shoulder.y - features.height * 0.09 && features.elbowAngle > 136) return "top";
      if (features.wrist.y > features.shoulder.y - features.height * 0.015 && features.elbowAngle < 142) return "down";
      return "unknown";
    }
    case "jumping_jack": {
      if (!Number.isFinite(features.ankleWidthRatio)) return "unknown";
      if (features.armsOverhead && features.ankleWidthRatio > 1.25) return "open";
      if (!features.armsOverhead && features.ankleWidthRatio < 1.14) return "closed";
      return "unknown";
    }
    default:
      return "unknown";
  }
}

function candidateScores(features, history) {
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
  const currentKneeFlex = Number.isFinite(features.kneeAngle) ? normalize(168 - features.kneeAngle, 12, 66) : 0;
  const currentElbowFlex = Number.isFinite(features.elbowAngle) ? normalize(165 - features.elbowAngle, 12, 82) : 0;
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
    general: 0.18,
  };
}

function baseMetrics(features) {
  return {
    confidence: round(features.avgScore, 2),
    visible_keypoints: features.visibleCount,
    body_width_ratio: round(features.widthRatio, 2),
    body_height_ratio: round(features.heightRatio, 2),
    knee_angle: round(features.kneeAngle ?? 0),
    left_knee_angle: round(features.leftKneeAngle ?? 0),
    right_knee_angle: round(features.rightKneeAngle ?? 0),
    elbow_angle: round(features.elbowAngle ?? 0),
    left_elbow_angle: round(features.leftElbowAngle ?? 0),
    right_elbow_angle: round(features.rightElbowAngle ?? 0),
    shoulder_angle: round(features.shoulderAngle ?? 0),
    body_angle: round(features.bodyAngle ?? 0),
    hip_offset: round(features.hipOffset ?? 0, 3),
    torso_lean: round(features.torsoLean ?? 0, 3),
    hip_tilt: round(features.hipTilt ?? 0, 3),
    ankle_width_ratio: round(features.ankleWidthRatio ?? 0, 2),
    knee_ankle_ratio: round(features.kneeAnkleRatio ?? 0, 2),
    wrist_elbow_stack: round(features.wristElbowStack ?? 0, 3),
    wrist_shoulder_stack: round(features.wristShoulderStack ?? 0, 3),
    asymmetry: round(features.elbowAsymmetry ?? features.kneeAsymmetry ?? 0),
    arms_overhead: features.armsOverhead ? 1 : 0,
  };
}

function analysisResult(exercise, features, score, phase, headline, tips, issues, metrics = {}) {
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

function analyzeSquat(features) {
  const tips = [];
  const issues = [];
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

function analyzeLunge(features) {
  const tips = [];
  const issues = [];
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
    front_knee_angle: round(features.frontKneeAngle ?? 0),
    knee_shift: round(features.kneeShift ?? 0, 3),
  });
}

function analyzePushup(features) {
  const tips = [];
  const issues = [];
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

function analyzePlank(features, history) {
  const tips = [];
  const issues = [];
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

function analyzeBicepsCurl(features, history) {
  const tips = [];
  const issues = [];
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

function analyzeShoulderPress(features, history) {
  const tips = [];
  const issues = [];
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

function analyzeJumpingJack(features, history) {
  const tips = [];
  const issues = [];
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
    width_ratio: round(features.ankleWidthRatio ?? 0, 2),
    rhythm_range: round(ankleRange, 2),
  });
}

function analyzeGeneral(features, setup) {
  const tips = setup.messages[0] === "Framing is good"
    ? ["Move naturally. I am watching for squats, push-ups, lunges, curls, presses, jacks, or plank."]
    : setup.messages;
  return analysisResult("general", features, 72, "unknown", "Detecting movement", tips, [], {
    setup_ready: setup.trackable ? 1 : 0,
  });
}

function analyzeExercise(exercise, features, history, setup) {
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

function createTotals() {
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
  }, {});
}

function serializeTotals(totals) {
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
  }, {});
}

function serializeIssues(issueCounts) {
  return Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([issue, count]) => ({ issue, count }));
}

function createPhaseStates() {
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
  }, {});
}

function updatePhaseState(phaseState, phase, timestamp) {
  if (phase !== phaseState.stablePhase) {
    phaseState.stablePhase = phase;
    phaseState.stableCount = 1;
    phaseState.enteredAt = timestamp;
  } else {
    phaseState.stableCount += 1;
  }
}

function updateRepCounter({ exercise, analysis, confidence, timestamp, phaseStates, totals }) {
  const rule = REP_RULES[exercise];
  if (!rule) return null;

  const state = phaseStates[exercise];
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

function pushFeedback(feedback, line, timestamp, exercise = "general") {
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

function chooseExercise(scores, smoothedScores, currentExercise) {
  const eligible = Object.entries(scores).filter(([exercise]) => exercise !== "general");
  for (const [exercise, score] of eligible) {
    smoothedScores[exercise] = round((smoothedScores[exercise] ?? 0) * 0.72 + score * 0.28, 3);
  }
  smoothedScores.general = 0.18;

  const sorted = Object.entries(smoothedScores)
    .filter(([exercise]) => exercise !== "general")
    .sort((a, b) => b[1] - a[1]);
  const [bestExercise, bestScore] = sorted[0] || ["general", 0];
  const currentScore = smoothedScores[currentExercise] ?? 0;

  if (!bestExercise || bestScore < 0.32) {
    return { exercise: "general", confidence: Math.max(bestScore, 0.18), scores: smoothedScores };
  }

  if (currentExercise !== "general" && currentScore >= bestScore - 0.08 && currentScore >= 0.34) {
    return { exercise: currentExercise, confidence: currentScore, scores: smoothedScores };
  }

  return { exercise: bestExercise, confidence: bestScore, scores: smoothedScores };
}

function buildOffFrameState({ setup, totals, issueCounts, feedback, currentExercise, lastGoodState }) {
  const previous = lastGoodState || {};
  const label = EXERCISE_LABELS[currentExercise] || EXERCISE_LABELS.general;
  return {
    status: "off_frame",
    headline: setup.messages[0] || "Body not detected",
    tips: setup.messages.length ? setup.messages : ["Step back and keep your body in frame."],
    phase: "not_detected",
    score: 0,
    detectedExercise: currentExercise || "general",
    detectedLabel: label,
    confidence: previous.confidence || 0,
    confidenceScore: (previous.confidence || 0) / 100,
    setup,
    totals: serializeTotals(totals),
    totalReps: Object.values(totals).reduce((sum, item) => sum + item.reps, 0),
    averageFormScore: previous.averageFormScore || 0,
    feedback: feedback.slice(),
    detectedIssues: serializeIssues(issueCounts),
    exerciseScores: previous.exerciseScores || {},
    metrics: { visible_keypoints: setup.visibleCount, confidence: setup.averageConfidence },
    bestReps: previous.bestReps || {},
    worstReps: previous.worstReps || {},
    trackingStable: false,
  };
}

function createAutoWorkoutTracker() {
  let totals = createTotals();
  let phaseStates = createPhaseStates();
  let issueCounts = {};
  let feedback = [];
  let history = [];
  let smoothedScores = {};
  let currentExercise = "general";
  let lastTimestamp = 0;
  let lastGoodState = null;
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

  function update(keypoints = [], frame = { width: 1, height: 1 }, timestamp = Date.now()) {
    const safeTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
    const deltaMs = lastTimestamp ? clamp(safeTimestamp - lastTimestamp, 0, 1000) : 0;
    lastTimestamp = safeTimestamp;

    const features = extractFrameFeatures(keypoints, frame, safeTimestamp);
    const setup = setupGuidance(features);

    if (!setup.trackable) {
      const lastGoodAge = lastGoodState ? safeTimestamp - lastGoodState.timestamp : Infinity;
      if (lastGoodAge < TRACKING_LOSS_GRACE_MS) {
        const state = {
          ...lastGoodState.state,
          status: "adjust",
          headline: "Tracking through a brief dropout",
          tips: setup.messages.length ? setup.messages : ["Hold position while tracking stabilizes."],
          setup,
          trackingStable: false,
        };
        return state;
      }
      const offState = buildOffFrameState({
        setup,
        totals,
        issueCounts,
        feedback,
        currentExercise,
        lastGoodState: lastGoodState?.state,
      });
      return offState;
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
    const bestReps = {};
    const worstReps = {};
    for (const exercise of COUNTED_EXERCISES) {
      if (serializedTotals[exercise].best_rep) bestReps[exercise] = serializedTotals[exercise].best_rep;
      if (serializedTotals[exercise].worst_rep) worstReps[exercise] = serializedTotals[exercise].worst_rep;
    }

    const state = {
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

module.exports = {
  COUNTED_EXERCISES,
  EXERCISES,
  EXERCISE_LABELS,
  REP_RULES,
  candidateScores,
  createAutoWorkoutTracker,
  extractFrameFeatures,
  phaseForExercise,
  setupGuidance,
};
