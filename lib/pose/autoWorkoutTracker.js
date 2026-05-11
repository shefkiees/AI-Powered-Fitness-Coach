const TRACKING_LOSS_GRACE_MS = 900;
const HISTORY_LIMIT = 48;
const FEEDBACK_LIMIT = 14;
const MOVEMENT_BUFFER_MS = 4000;
const MIN_AUTO_DETECT_FRAMES = 6;
const LOW_CONFIDENCE_FALLBACK_MS = 6500;
const DEBUG_THROTTLE_MS = 900;
const MIN_KEYPOINT_SCORE = 0.23;
const LOW_KEYPOINT_SCORE = 0.16;

const EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
  "situp",
  "lateral_raise",
  "deadlift",
  "general",
];

const COUNTED_EXERCISES = [
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "situp",
  "lateral_raise",
  "deadlift",
];

const EXERCISE_LABELS = {
  squat: "Squat",
  pushup: "Push-up",
  lunge: "Lunge",
  biceps_curl: "Bicep curl",
  shoulder_press: "Shoulder press",
  jumping_jack: "Jumping jack",
  plank: "Plank",
  situp: "Sit-up",
  lateral_raise: "Lateral raise",
  deadlift: "Deadlift",
  general: "Move into frame or select an exercise",
};

const EXERCISE_ORDER = EXERCISES.filter((exercise) => exercise !== "general");

const JOINT_LABELS = {
  shoulders: "Shoulders visible",
  elbows: "Elbows visible",
  wrists: "Wrists visible",
  hips: "Hips visible",
  knees: "Knees visible",
  ankles: "Ankles visible",
  head: "Head visible",
  torso: "Torso visible",
};

const EXERCISE_CONFIG = {
  squat: {
    label: EXERCISE_LABELS.squat,
    required: ["hips", "knees", "ankles"],
    confidenceThreshold: 0.46,
    peakThreshold: 0.42,
    startThreshold: 0.12,
    partialThreshold: 0.42,
    cooldownMs: 720,
    repTimeoutMs: 5600,
    mode: "reps",
    direction: "down-up",
    timestampMetric: "knee_angle",
  },
  pushup: {
    label: EXERCISE_LABELS.pushup,
    required: ["shoulders", "elbows", "hips"],
    confidenceThreshold: 0.45,
    peakThreshold: 0.74,
    startThreshold: 0.14,
    partialThreshold: 0.4,
    cooldownMs: 720,
    repTimeoutMs: 5400,
    mode: "reps",
    direction: "down-up",
    timestampMetric: "elbow_angle",
  },
  lunge: {
    label: EXERCISE_LABELS.lunge,
    required: ["hips", "knees", "ankles"],
    confidenceThreshold: 0.45,
    peakThreshold: 0.7,
    startThreshold: 0.12,
    partialThreshold: 0.38,
    cooldownMs: 760,
    repTimeoutMs: 5800,
    mode: "reps",
    direction: "down-up",
    timestampMetric: "front_knee_angle",
  },
  biceps_curl: {
    label: EXERCISE_LABELS.biceps_curl,
    required: ["shoulders", "elbows", "wrists"],
    confidenceThreshold: 0.44,
    peakThreshold: 0.72,
    startThreshold: 0.16,
    partialThreshold: 0.4,
    cooldownMs: 640,
    repTimeoutMs: 4600,
    mode: "reps",
    direction: "up-down",
    timestampMetric: "elbow_angle",
  },
  shoulder_press: {
    label: EXERCISE_LABELS.shoulder_press,
    required: ["shoulders", "elbows", "wrists"],
    confidenceThreshold: 0.44,
    peakThreshold: 0.72,
    startThreshold: 0.16,
    partialThreshold: 0.42,
    cooldownMs: 680,
    repTimeoutMs: 4800,
    mode: "reps",
    direction: "up-down",
    timestampMetric: "shoulder_angle",
  },
  jumping_jack: {
    label: EXERCISE_LABELS.jumping_jack,
    required: ["shoulders", "wrists", "hips", "ankles"],
    confidenceThreshold: 0.42,
    peakThreshold: 0.58,
    startThreshold: 0.18,
    partialThreshold: 0.36,
    cooldownMs: 380,
    repTimeoutMs: 3200,
    mode: "reps",
    direction: "open-close",
    timestampMetric: "ankle_width_ratio",
  },
  plank: {
    label: EXERCISE_LABELS.plank,
    required: ["shoulders", "hips", "ankles"],
    confidenceThreshold: 0.43,
    peakThreshold: 0,
    startThreshold: 0,
    partialThreshold: 0,
    cooldownMs: 0,
    repTimeoutMs: 0,
    mode: "hold",
    direction: "hold",
    timestampMetric: "body_angle",
  },
  situp: {
    label: EXERCISE_LABELS.situp,
    required: ["shoulders", "hips", "knees"],
    confidenceThreshold: 0.42,
    peakThreshold: 0.72,
    startThreshold: 0.16,
    partialThreshold: 0.4,
    cooldownMs: 620,
    repTimeoutMs: 4200,
    mode: "reps",
    direction: "up-down",
    timestampMetric: "body_angle",
  },
  lateral_raise: {
    label: EXERCISE_LABELS.lateral_raise,
    required: ["shoulders", "elbows", "wrists"],
    confidenceThreshold: 0.42,
    peakThreshold: 0.72,
    startThreshold: 0.16,
    partialThreshold: 0.4,
    cooldownMs: 620,
    repTimeoutMs: 4200,
    mode: "reps",
    direction: "up-down",
    timestampMetric: "shoulder_angle",
  },
  deadlift: {
    label: EXERCISE_LABELS.deadlift,
    required: ["shoulders", "hips", "knees", "ankles"],
    confidenceThreshold: 0.44,
    peakThreshold: 0.68,
    startThreshold: 0.14,
    partialThreshold: 0.38,
    cooldownMs: 720,
    repTimeoutMs: 5200,
    mode: "reps",
    direction: "down-up",
    timestampMetric: "hip_hinge",
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 0) {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function normalize(value, low, high) {
  if (!Number.isFinite(value)) return 0;
  if (high === low) return value >= high ? 1 : 0;
  return clamp((value - low) / (high - low), 0, 1);
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function strong(point, minScore = MIN_KEYPOINT_SCORE) {
  return Boolean(
    point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      (point.score ?? 0) >= minScore,
  );
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

function groupVisible(points) {
  return {
    head: strong(points.nose, LOW_KEYPOINT_SCORE),
    shoulders: strong(points.ls) && strong(points.rs),
    elbows: strong(points.le) && strong(points.re),
    wrists: strong(points.lw) && strong(points.rw),
    hips: strong(points.lh) && strong(points.rh),
    knees: strong(points.lk) && strong(points.rk),
    ankles: strong(points.la) && strong(points.ra),
    torso: (strong(points.ls) || strong(points.rs)) && (strong(points.lh) || strong(points.rh)),
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
    (minX < width * 0.025 || maxX > width * 0.975 || minY < height * 0.025 || maxY > height * 0.985);

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
  const leftHipAngle =
    strong(points.ls) && strong(points.lh) && strong(points.lk)
      ? angle(points.ls, points.lh, points.lk)
      : null;
  const rightHipAngle =
    strong(points.rs) && strong(points.rh) && strong(points.rk)
      ? angle(points.rs, points.rh, points.rk)
      : null;

  const kneeAngle = average([leftKneeAngle, rightKneeAngle]);
  const elbowAngle = average([leftElbowAngle, rightElbowAngle]);
  const shoulderAngle = average([leftShoulderAngle, rightShoulderAngle]);
  const hipAngle = average([leftHipAngle, rightHipAngle]);
  const bodyAngle = shoulder && hip && fallbackAnkle ? angle(shoulder, hip, fallbackAnkle) : null;
  const shoulderWidth = groups.shoulders ? Math.max(1, Math.abs(points.ls.x - points.rs.x)) : null;
  const ankleWidth = groups.ankles ? Math.abs(points.la.x - points.ra.x) : null;
  const wristWidth = groups.wrists ? Math.abs(points.lw.x - points.rw.x) : null;
  const kneeWidth = groups.knees ? Math.abs(points.lk.x - points.rk.x) : null;
  const ankleWidthRatio = shoulderWidth && ankleWidth !== null ? ankleWidth / shoulderWidth : null;
  const wristWidthRatio = shoulderWidth && wristWidth !== null ? wristWidth / shoulderWidth : null;
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
  const frontKneeAngle =
    average([leftKneeAngle, rightKneeAngle]) === null
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
  const bodyVertical = Boolean(shoulder && hip && hip.y > shoulder.y + height * 0.12);
  const hipOffset =
    shoulder && hip && fallbackAnkle ? (hip.y - (shoulder.y + fallbackAnkle.y) / 2) / height : null;
  const trunkCurl = shoulder && hip ? clamp((hip.y - shoulder.y) / Math.max(1, height * 0.45), 0, 1) : 0;
  const situpReach = shoulder && hip ? clamp((hip.y - shoulder.y) / Math.max(1, height * 0.28), 0, 1) : 0;
  const hipHinge = hipAngle !== null ? normalize(185 - hipAngle, 8, 92) : 0;

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
    wristWidth,
    kneeWidth,
    ankleWidthRatio,
    wristWidthRatio,
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
    hipAngle,
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
    trunkCurl,
    situpReach,
    hipHinge,
  };
}

function smoothKeypoints(keypoints, previous = []) {
  if (!Array.isArray(keypoints) || !keypoints.length) return [];
  return keypoints.map((point, index) => {
    const prev = previous[index];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return prev || point;
    if (!prev || !Number.isFinite(prev.x) || !Number.isFinite(prev.y)) {
      return { ...point };
    }
    const alpha = (point.score ?? 0) > 0.45 ? 0.42 : 0.6;
    return {
      x: prev.x * (1 - alpha) + point.x * alpha,
      y: prev.y * (1 - alpha) + point.y * alpha,
      score: Math.max(point.score ?? 0, (prev.score ?? 0) * 0.78),
    };
  });
}

function hasVisibility(features, required = []) {
  return required.every((joint) => Boolean(features.groups[joint]));
}

function setupGuidance(features, selectedExercise = "general") {
  const config = EXERCISE_CONFIG[selectedExercise];
  const required = config?.required || [];
  const checklist = [
    { label: JOINT_LABELS.shoulders, ok: features.groups.shoulders },
    { label: JOINT_LABELS.hips, ok: features.groups.hips },
    { label: JOINT_LABELS.knees, ok: features.groups.knees },
    { label: JOINT_LABELS.ankles, ok: features.groups.ankles },
    { label: JOINT_LABELS.wrists, ok: features.groups.wrists },
    { label: "Tracking confidence", ok: features.avgScore >= 0.3 && features.visibleCount >= 6 },
  ];

  const messages = [];
  if (!features.visibleCount || features.avgScore < 0.2) {
    messages.push("Improve lighting or step back to lock tracking.");
  }
  if (features.visibleCount < 6 || features.heightRatio < 0.25) {
    messages.push("Move into frame or select an exercise.");
  }
  if (features.heightRatio > 0.9 || features.widthRatio > 0.84 || features.touchesEdge) {
    messages.push("Step back so your full body stays inside the frame.");
  }
  const missing = required.filter((joint) => !features.groups[joint]);
  if (missing.length) {
    messages.push(`Need ${missing.map((joint) => JOINT_LABELS[joint].replace(" visible", "").toLowerCase()).join(", ")} visible.`);
  }

  const upperBodyTrackable = features.groups.shoulders && features.groups.elbows && features.groups.wrists;
  const lowerBodyTrackable = features.groups.hips && features.groups.knees && features.groups.ankles;
  const coreTrackable = features.groups.shoulders && features.groups.hips && features.fallbackAnkle;
  const trackable =
    features.visibleCount >= 6 &&
    features.avgScore >= 0.24 &&
    (upperBodyTrackable || lowerBodyTrackable || coreTrackable);

  if (!messages.length) {
    messages.push(selectedExercise === "general" ? "Keep moving for detection." : "Tracking is ready.");
  }

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

function baseMetrics(features) {
  return {
    confidence: round(features.avgScore, 2),
    visible_keypoints: features.visibleCount,
    body_width_ratio: round(features.widthRatio, 2),
    body_height_ratio: round(features.heightRatio, 2),
    knee_angle: round(features.kneeAngle),
    elbow_angle: round(features.elbowAngle),
    shoulder_angle: round(features.shoulderAngle),
    hip_angle: round(features.hipAngle),
    body_angle: round(features.bodyAngle),
    front_knee_angle: round(features.frontKneeAngle),
    hip_offset: round(features.hipOffset, 3),
    torso_lean: round(features.torsoLean, 3),
    hip_tilt: round(features.hipTilt, 3),
    ankle_width_ratio: round(features.ankleWidthRatio, 2),
    wrist_width_ratio: round(features.wristWidthRatio, 2),
    knee_ankle_ratio: round(features.kneeAnkleRatio, 2),
    wrist_elbow_stack: round(features.wristElbowStack, 3),
    wrist_shoulder_stack: round(features.wristShoulderStack, 3),
    trunk_curl: round(features.trunkCurl, 2),
    situp_reach: round(features.situpReach, 2),
    hip_hinge: round(features.hipHinge, 2),
    arms_overhead: features.armsOverhead ? 1 : 0,
  };
}

function progressForExercise(exercise, features) {
  switch (exercise) {
    case "squat":
      return Math.max(
        normalize(170 - (features.kneeAngle ?? 170), 8, 62),
        normalize((features.hipToKnee ?? -0.2) + 0.12, 0, 0.16),
      );
    case "pushup":
      return normalize(168 - (features.elbowAngle ?? 168), 12, 78);
    case "lunge":
      return normalize(168 - (features.frontKneeAngle ?? 168), 14, 72);
    case "biceps_curl":
      return normalize(165 - (features.elbowAngle ?? 165), 14, 96);
    case "shoulder_press":
      return Math.max(
        normalize((features.shoulderY ?? 0.5) - (features.wristY ?? 0.5), 0.03, 0.26),
        normalize(features.shoulderAngle ?? 90, 70, 150),
      );
    case "jumping_jack":
      return Math.max(
        normalize(features.ankleWidthRatio ?? 1, 1.02, 1.72),
        features.armsOverhead ? 0.92 : 0,
      );
    case "situp":
      return normalize((features.situpReach ?? 0) + normalize(180 - (features.hipAngle ?? 180), 0, 80) * 0.4, 0.35, 1.1);
    case "lateral_raise":
      return Math.max(
        normalize(features.shoulderAngle ?? 50, 45, 120),
        normalize((features.shoulderY ?? 0.4) - (features.wristY ?? 0.6), -0.02, 0.18),
      );
    case "deadlift":
      return normalize((features.hipHinge ?? 0) + normalize(features.torsoLean ?? 0, 0.02, 0.18) * 0.4, 0.08, 1);
    default:
      return 0;
  }
}

function phaseForExercise(exercise, features, progress = 0) {
  switch (exercise) {
    case "plank":
      return "hold";
    case "jumping_jack":
      if (progress >= 0.75) return "open";
      if (progress <= 0.18) return "closed";
      return progress > 0.45 ? "peak" : "returning";
    case "squat":
    case "lunge":
      if (progress >= 0.75) return "bottom";
      if (progress <= 0.18) return "standing";
      return progress > 0.5 ? "lowering" : "returning";
    case "pushup":
      if (progress >= 0.75) return "bottom";
      if (progress <= 0.18) return "top";
      return progress > 0.5 ? "lowering" : "returning";
    case "biceps_curl":
      if (progress >= 0.75) return "top";
      if (progress <= 0.18) return "down";
      return progress > 0.5 ? "lifting" : "returning";
    case "shoulder_press":
      if (progress >= 0.75) return "top";
      if (progress <= 0.2) return "down";
      return progress > 0.5 ? "pressing" : "returning";
    case "situp":
      if (progress >= 0.75) return "top";
      if (progress <= 0.18) return "down";
      return progress > 0.5 ? "curling" : "returning";
    case "lateral_raise":
      if (progress >= 0.75) return "top";
      if (progress <= 0.18) return "down";
      return progress > 0.5 ? "raising" : "returning";
    case "deadlift":
      if (progress >= 0.75) return "bottom";
      if (progress <= 0.18) return "standing";
      return progress > 0.5 ? "hinging" : "returning";
    default:
      return "unknown";
  }
}

function recentMovementFrames(history, timestamp = Date.now(), maxMs = MOVEMENT_BUFFER_MS) {
  const windowed = history.filter((frame) => timestamp - frame.timestamp <= maxMs);
  return windowed.length ? windowed : history.slice(-MIN_AUTO_DETECT_FRAMES);
}

function movementRange(frames, key) {
  return range(frames, key);
}

function movementStats(features, history) {
  const frames = recentMovementFrames(history, features.timestamp);
  const first = frames[0];
  const last = frames[frames.length - 1];
  const durationMs = first && last ? Math.max(0, last.timestamp - first.timestamp) : 0;
  const enoughFrames = frames.length >= MIN_AUTO_DETECT_FRAMES && durationMs >= 650;
  const stats = {
    frames,
    durationMs,
    enoughFrames,
    kneeRange: movementRange(frames, "kneeAngle"),
    elbowRange: movementRange(frames, "elbowAngle"),
    shoulderRange: movementRange(frames, "shoulderAngle"),
    hipRange: movementRange(frames, "hipAngle"),
    bodyAngleRange: movementRange(frames, "bodyAngle"),
    hipYRange: movementRange(frames, "hipY"),
    wristYRange: movementRange(frames, "wristY"),
    shoulderYRange: movementRange(frames, "shoulderY"),
    ankleWidthRange: movementRange(frames, "ankleWidthRatio"),
    wristWidthRange: movementRange(frames, "wristWidthRatio"),
    hipHingeRange: movementRange(frames, "hipHinge"),
    trunkCurlRange: movementRange(frames, "trunkCurl"),
    kneeAsymmetryMax: Math.max(...frames.map((item) => item.kneeAsymmetry || 0), 0),
    hipOffsetStd: stdDev(frames, "hipOffset", frames.length),
    shoulderYStd: stdDev(frames, "shoulderY", frames.length),
    hipOffsetRange: movementRange(frames, "hipOffset"),
  };
  const motionParts = [
    normalize(stats.kneeRange, 10, 72),
    normalize(stats.elbowRange, 12, 96),
    normalize(stats.shoulderRange, 10, 92),
    normalize(stats.hipRange, 8, 80),
    normalize(stats.ankleWidthRange, 0.12, 0.72),
    normalize(stats.wristYRange, 0.06, 0.34),
    normalize(stats.trunkCurlRange, 0.08, 0.52),
    normalize(stats.hipHingeRange, 0.08, 0.72),
  ];
  stats.motionIntensity = average(motionParts) || 0;
  return stats;
}

function movementPatternScores(features, history) {
  const stats = movementStats(features, history);
  const lowerQuality = features.groups.hips && features.groups.knees && features.groups.ankles ? normalize(features.avgScore, 0.2, 0.62) : 0;
  const upperQuality = features.groups.shoulders && features.groups.elbows && features.groups.wrists ? normalize(features.avgScore, 0.2, 0.62) : 0;
  const coreQuality = features.groups.shoulders && features.groups.hips && features.fallbackAnkle ? normalize(features.avgScore, 0.2, 0.62) : 0;
  const torsoQuality = features.groups.shoulders && features.groups.hips ? normalize(features.avgScore, 0.2, 0.62) : 0;
  const elbowMotion = normalize(stats.elbowRange, 18, 98);
  const kneeMotion = normalize(stats.kneeRange, 14, 76);
  const shoulderMotion = normalize(stats.shoulderRange, 12, 92);
  const hipMotion = normalize(stats.hipRange, 10, 82);
  const wristTravel = normalize(stats.wristYRange, 0.06, 0.34);
  const jackWidth = Math.max(normalize(stats.ankleWidthRange, 0.14, 0.78), normalize(stats.wristWidthRange, 0.14, 0.72));
  const shoulderStable = normalize(0.045 - stats.shoulderYStd, 0, 0.045);
  const plankStable = normalize(0.055 - stats.hipOffsetStd, 0, 0.055);
  const bodyLine = normalize(features.bodyAngle ?? 145, 145, 178);
  const verticalBody = features.bodyVertical ? 1 : 0;
  const horizontalBody = features.bodyHorizontal ? 1 : 0;
  const enough = stats.enoughFrames ? 1 : 0.35;

  const scores = {
    biceps_curl:
      upperQuality *
      enough *
      clamp(0.12 + elbowMotion * 0.52 + shoulderStable * 0.2 + normalize(0.18 - (features.wristShoulderStack ?? 0.18), 0, 0.18) * 0.12 - shoulderMotion * 0.12, 0, 1),
    squat:
      lowerQuality *
      enough *
      clamp(0.12 + kneeMotion * 0.42 + normalize(stats.hipYRange, 0.04, 0.22) * 0.2 + verticalBody * 0.16 + normalize(30 - (features.kneeAsymmetry ?? 30), 0, 30) * 0.1, 0, 1),
    pushup:
      (upperQuality * 0.55 + coreQuality * 0.45) *
      enough *
      clamp(0.1 + elbowMotion * 0.38 + horizontalBody * 0.26 + bodyLine * 0.18 + plankStable * 0.12, 0, 1),
    lunge:
      lowerQuality *
      enough *
      clamp(0.1 + kneeMotion * 0.28 + normalize(stats.kneeAsymmetryMax, 18, 82) * 0.34 + verticalBody * 0.12 + normalize(features.frontKneeAngle ? 170 - features.frontKneeAngle : 0, 8, 74) * 0.12, 0, 1),
    shoulder_press:
      upperQuality *
      enough *
      clamp(0.1 + wristTravel * 0.34 + shoulderMotion * 0.28 + (features.armsOverhead ? 0.2 : 0) + normalize((features.shoulderY ?? 0.45) - (features.wristY ?? 0.5), 0.02, 0.25) * 0.12, 0, 1),
    jumping_jack:
      ((upperQuality + lowerQuality) / 2) *
      enough *
      clamp(0.12 + jackWidth * 0.5 + (features.armsOverhead ? 0.18 : 0) + normalize(features.ankleWidthRatio ?? 1, 1.04, 1.76) * 0.14, 0, 1),
    plank:
      coreQuality *
      clamp((stats.durationMs >= 900 ? 1 : 0.4) * (horizontalBody * 0.34 + bodyLine * 0.36 + plankStable * 0.24 + normalize(0.16 - stats.motionIntensity, 0, 0.16) * 0.14), 0, 1),
    situp:
      torsoQuality *
      enough *
      clamp((horizontalBody ? 1 : 0.18) * (0.1 + hipMotion * 0.26 + normalize(stats.trunkCurlRange, 0.08, 0.5) * 0.34 + normalize(stats.bodyAngleRange, 10, 72) * 0.18), 0, 1),
    lateral_raise:
      upperQuality *
      enough *
      clamp(0.1 + shoulderMotion * 0.42 + normalize(stats.wristWidthRange, 0.08, 0.48) * 0.22 + normalize(30 - stats.elbowRange, 0, 30) * 0.12 - elbowMotion * 0.08, 0, 1),
    deadlift:
      (lowerQuality * 0.48 + torsoQuality * 0.52) *
      enough *
      clamp(0.1 + normalize(stats.hipHingeRange, 0.08, 0.7) * 0.36 + hipMotion * 0.24 + normalize(features.hipHinge ?? 0, 0.08, 1) * 0.14 + verticalBody * 0.1 - kneeMotion * 0.08, 0, 1),
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    stats,
    scores: Object.fromEntries(Object.entries(scores).map(([exercise, score]) => [exercise, round(score, 3)])),
    bestPattern: sorted[0]?.[0] || "general",
    bestScore: round(sorted[0]?.[1] || 0, 3),
  };
}

function candidateScores(features, history, movementPattern = movementPatternScores(features, history)) {
  const recent = recentMovementFrames(history, features.timestamp);
  const lowerQuality = features.groups.hips && features.groups.knees && features.groups.ankles ? normalize(features.avgScore, 0.2, 0.6) : 0;
  const upperQuality = features.groups.shoulders && features.groups.elbows && features.groups.wrists ? normalize(features.avgScore, 0.2, 0.6) : 0;
  const coreQuality = features.groups.shoulders && features.groups.hips ? normalize(features.avgScore, 0.2, 0.6) : 0;
  const kneeMotion = normalize(range(recent, "kneeAngle"), 14, 64);
  const elbowMotion = normalize(range(recent, "elbowAngle"), 18, 96);
  const shoulderMotion = normalize(range(recent, "shoulderAngle"), 12, 88);
  const hipMotion = normalize(range(recent, "hipAngle"), 10, 74);
  const widthMotion = Math.max(normalize(range(recent, "ankleWidthRatio"), 0.14, 0.72), normalize(range(recent, "wristWidthRatio"), 0.14, 0.68));
  const pushLine = normalize(features.bodyAngle ?? 150, 146, 178);
  const plankStability = normalize(0.06 - stdDev(recent, "hipOffset", 12), 0, 0.06);

  const squat =
    lowerQuality *
    clamp(0.16 + kneeMotion * 0.34 + normalize(170 - (features.kneeAngle ?? 170), 6, 74) * 0.24 + normalize(0.2 - (features.torsoLean ?? 0.2), 0, 0.2) * 0.12, 0, 1);
  const lunge =
    lowerQuality *
    clamp(0.14 + normalize(features.kneeAsymmetry ?? 0, 12, 80) * 0.32 + normalize(170 - (features.frontKneeAngle ?? 170), 6, 72) * 0.22 + kneeMotion * 0.18, 0, 1);
  const pushup =
    coreQuality *
    clamp(0.12 + elbowMotion * 0.28 + pushLine * 0.24 + (features.bodyHorizontal ? 0.18 : 0), 0, 1);
  const plank =
    coreQuality *
    clamp((features.bodyHorizontal ? 1 : 0.05) * (0.1 + pushLine * 0.42 + plankStability * 0.24 + (features.bodyHorizontal ? 0.16 : 0)), 0, 1);
  const bicepsCurl =
    upperQuality *
    clamp(0.12 + elbowMotion * 0.34 + normalize(165 - (features.elbowAngle ?? 165), 12, 94) * 0.2 + normalize(0.18 - (features.wristShoulderStack ?? 0.18), 0, 0.18) * 0.12, 0, 1);
  const shoulderPress =
    upperQuality *
    clamp(0.12 + shoulderMotion * 0.28 + normalize((features.shoulderY ?? 0.4) - (features.wristY ?? 0.5), 0.03, 0.24) * 0.26 + (features.armsOverhead ? 0.18 : 0), 0, 1);
  const jumpingJack =
    (upperQuality + lowerQuality) / 2 *
    clamp(0.14 + widthMotion * 0.42 + (features.armsOverhead ? 0.2 : 0) + normalize(features.ankleWidthRatio ?? 1, 1.02, 1.75) * 0.18, 0, 1);
  const situp =
    coreQuality *
    clamp(
      (features.bodyHorizontal ? 1 : 0.08) *
        (0.12 +
          hipMotion * 0.28 +
          normalize(features.situpReach ?? 0, 0.35, 1.05) * 0.32 +
          normalize(150 - (features.bodyAngle ?? 180), 0, 92) * 0.18),
      0,
      1,
    );
  const lateralRaise =
    upperQuality *
    clamp(0.12 + shoulderMotion * 0.3 + normalize(features.shoulderAngle ?? 50, 45, 128) * 0.3 + normalize(0.12 - (features.wristElbowStack ?? 0.12), 0, 0.12) * 0.1, 0, 1);
  const deadlift =
    (lowerQuality * 0.55 + coreQuality * 0.45) *
    clamp(0.12 + hipMotion * 0.28 + normalize(features.hipHinge ?? 0, 0.08, 1) * 0.26 + normalize(features.torsoLean ?? 0, 0.02, 0.22) * 0.14, 0, 1);

  const singleFrameScores = {
    squat,
    pushup,
    lunge,
    biceps_curl: bicepsCurl,
    shoulder_press: shoulderPress,
    jumping_jack: jumpingJack,
    plank,
    situp,
    lateral_raise: lateralRaise,
    deadlift,
  };

  const combined = Object.fromEntries(
    Object.entries(singleFrameScores).map(([exercise, score]) => {
      const movementScore = movementPattern.scores[exercise] || 0;
      return [exercise, round(clamp(Math.max(score * 0.82, movementScore, score * 0.42 + movementScore * 0.72), 0, 1), 3)];
    }),
  );

  return {
    ...combined,
    general: 0.18,
  };
}

function chooseExercise(scores, smoothedScores, currentExercise, manualExercise = "general", movementPattern = null) {
  if (manualExercise && manualExercise !== "general") {
    return {
      exercise: manualExercise,
      confidence: Math.max(scores[manualExercise] ?? 0, 0.5),
      scores: { ...smoothedScores, ...scores, [manualExercise]: Math.max(scores[manualExercise] ?? 0, 0.5) },
      detectionStable: true,
      lowConfidence: false,
    };
  }

  if (movementPattern && !movementPattern.stats.enoughFrames) {
    return {
      exercise: "general",
      confidence: Math.max(movementPattern.bestScore, 0.18),
      scores: { ...smoothedScores, ...scores, general: 0.18 },
      detectionStable: false,
      lowConfidence: false,
      scanning: true,
    };
  }

  const nextScores = { ...smoothedScores };
  EXERCISE_ORDER.forEach((exercise) => {
    nextScores[exercise] = round((nextScores[exercise] ?? 0) * 0.58 + (scores[exercise] ?? 0) * 0.42, 3);
  });
  nextScores.general = 0.18;

  const sorted = Object.entries(nextScores).filter(([exercise]) => exercise !== "general").sort((a, b) => b[1] - a[1]);
  const [bestExercise, bestScore] = sorted[0] || ["general", 0];
  const currentScore = nextScores[currentExercise] ?? 0;

  if (!bestExercise || bestScore < 0.27) {
    return {
      exercise: "general",
      confidence: Math.max(bestScore, 0.18),
      scores: nextScores,
      detectionStable: false,
      lowConfidence: true,
      scanning: false,
    };
  }

  if (currentExercise !== "general" && currentScore >= bestScore - 0.1 && currentScore >= 0.3) {
    return {
      exercise: currentExercise,
      confidence: currentScore,
      scores: nextScores,
      detectionStable: true,
      lowConfidence: false,
      scanning: false,
    };
  }

  return {
    exercise: bestExercise,
    confidence: bestScore,
    scores: nextScores,
    detectionStable: bestScore >= 0.32,
    lowConfidence: bestScore < 0.38,
    scanning: false,
  };
}

function analysisResult(exercise, headline, tips, score, phase, metrics, issues, warnings = []) {
  const finalScore = clamp(Math.round(score), 0, 100);
  return {
    status: finalScore >= 82 ? "good" : "adjust",
    headline,
    tips: tips.slice(0, 4),
    score: finalScore,
    phase,
    exercise,
    metrics,
    issues,
    warnings,
  };
}

function evaluateExercise(exercise, features, history, confidenceScore) {
  const config = EXERCISE_CONFIG[exercise];
  if (!config) {
    return analysisResult(
      "general",
      "Move into frame or select an exercise",
      ["Move into frame or select an exercise."],
      0,
      "unknown",
      { ...baseMetrics(features) },
      [],
      ["exercise_unknown"],
    );
  }

  if (!hasVisibility(features, config.required)) {
    const missing = config.required.filter((joint) => !features.groups[joint]);
    return analysisResult(
      exercise,
      `Need ${missing.map((joint) => JOINT_LABELS[joint].replace(" visible", "").toLowerCase()).join(", ")} visible`,
      [missing.length ? `Keep ${missing.join(", ")} in frame for ${config.label.toLowerCase()} tracking.` : "Move into frame."],
      0,
      "not_detected",
      { ...baseMetrics(features) },
      missing.map((joint) => `visibility_${joint}`),
      missing.map((joint) => `Missing ${JOINT_LABELS[joint].replace(" visible", "").toLowerCase()}`),
    );
  }

  const progress = progressForExercise(exercise, features);
  const phase = phaseForExercise(exercise, features, progress);
  const motionHistory = history.slice(-10);
  const tempoSpread = stdDev(motionHistory, "timestamp", 6);
  const stability = normalize(0.06 - stdDev(motionHistory, "hipOffset", 10), 0, 0.06);
  const visibilityScore = normalize(confidenceScore, config.confidenceThreshold - 0.1, 0.92);
  const romScore = clamp(progress, 0, 1);
  const alignmentPool = [];
  const issues = [];
  const tips = [];
  const warnings = [];

  if (exercise === "squat") {
    alignmentPool.push(normalize(0.22 - (features.torsoLean ?? 0.22), 0, 0.22));
    alignmentPool.push(normalize(features.kneeAnkleRatio ?? 0.6, 0.64, 1.08));
    if ((features.kneeAnkleRatio ?? 1) < 0.74) {
      issues.push("squat_knee_cave");
      tips.push("Drive knees out over your toes.");
    }
    if ((features.torsoLean ?? 0) > 0.18) {
      issues.push("squat_torso_lean");
      tips.push("Brace your core and keep the chest taller.");
    }
    if (progress < 0.46 && phase !== "standing") {
      issues.push("squat_partial_depth");
      tips.push("Sit lower before driving back up.");
    }
  } else if (exercise === "pushup") {
    alignmentPool.push(normalize(features.bodyAngle ?? 150, 148, 178));
    alignmentPool.push(normalize(0.2 - (features.wristShoulderStack ?? 0.2), 0, 0.2));
    if ((features.bodyAngle ?? 180) < 158 || (features.hipOffset ?? 0) > 0.07) {
      issues.push("pushup_hips_sagging");
      tips.push("Keep shoulders, hips, and ankles in one line.");
    }
    if ((features.hipOffset ?? 0) < -0.08) {
      issues.push("pushup_hips_high");
      tips.push("Lower the hips slightly to a straight plank line.");
    }
  } else if (exercise === "lunge") {
    alignmentPool.push(normalize(0.2 - (features.torsoLean ?? 0.2), 0, 0.2));
    alignmentPool.push(normalize(0.18 - (features.kneeShift ?? 0.18), 0, 0.18));
    if ((features.kneeShift ?? 0) > 0.16) {
      issues.push("lunge_front_knee_shift");
      tips.push("Track the front knee over the mid-foot.");
    }
    if ((features.hipTilt ?? 0) > 0.08) {
      issues.push("lunge_balance");
      tips.push("Keep the hips level and step more slowly.");
    }
  } else if (exercise === "biceps_curl") {
    alignmentPool.push(normalize(0.2 - (features.wristShoulderStack ?? 0.2), 0, 0.2));
    alignmentPool.push(normalize(34 - (features.elbowAsymmetry ?? 34), 0, 34));
    if ((features.wristShoulderStack ?? 0) > 0.2) {
      issues.push("curl_elbow_drift");
      tips.push("Pin elbows near your sides.");
    }
    if (stdDev(motionHistory, "shoulderY", 8) > 0.04) {
      issues.push("curl_swinging");
      tips.push("Avoid swinging the shoulders to finish the rep.");
    }
  } else if (exercise === "shoulder_press") {
    alignmentPool.push(normalize(0.16 - (features.wristElbowStack ?? 0.16), 0, 0.16));
    alignmentPool.push(normalize(0.18 - (features.torsoLean ?? 0.18), 0, 0.18));
    if ((features.wristElbowStack ?? 0) > 0.16) {
      issues.push("press_stack");
      tips.push("Press wrists directly over elbows.");
    }
    if ((features.torsoLean ?? 0) > 0.16) {
      issues.push("press_rib_flare");
      tips.push("Keep ribs down and avoid leaning back.");
    }
  } else if (exercise === "jumping_jack") {
    alignmentPool.push(features.armsOverhead ? 1 : 0.4);
    alignmentPool.push(normalize(features.ankleWidthRatio ?? 1, 1.04, 1.72));
    if (!features.armsOverhead && progress > 0.55) {
      issues.push("jack_arms_short");
      tips.push("Reach arms higher overhead on the open phase.");
    }
    if ((features.ankleWidthRatio ?? 1) < 1.22 && progress > 0.55) {
      issues.push("jack_legs_short");
      tips.push("Open the feet wider at the top.");
    }
  } else if (exercise === "plank") {
    alignmentPool.push(normalize(features.bodyAngle ?? 150, 150, 178));
    alignmentPool.push(stability);
    if ((features.hipOffset ?? 0) > 0.075) {
      issues.push("plank_hips_low");
      tips.push("Lift the hips slightly and brace your core.");
    } else if ((features.hipOffset ?? 0) < -0.075) {
      issues.push("plank_hips_high");
      tips.push("Lower the hips slightly into one straight line.");
    }
  } else if (exercise === "situp") {
    alignmentPool.push(normalize(features.situpReach ?? 0, 0.34, 1.02));
    alignmentPool.push(normalize(0.14 - (features.hipTilt ?? 0.14), 0, 0.14));
    if (progress < 0.46 && phase !== "down") {
      issues.push("situp_short_range");
      tips.push("Curl higher before returning down.");
    }
  } else if (exercise === "lateral_raise") {
    alignmentPool.push(normalize(features.shoulderAngle ?? 45, 45, 125));
    alignmentPool.push(normalize(0.18 - (features.wristElbowStack ?? 0.18), 0, 0.18));
    if (progress < 0.45 && phase !== "down") {
      issues.push("lateral_raise_short_range");
      tips.push("Raise arms closer to shoulder height.");
    }
    if ((features.torsoLean ?? 0) > 0.15) {
      issues.push("lateral_raise_swinging");
      tips.push("Keep the torso still and lift with control.");
    }
  } else if (exercise === "deadlift") {
    alignmentPool.push(normalize(features.hipHinge ?? 0, 0.08, 1));
    alignmentPool.push(normalize(0.18 - (features.kneeShift ?? 0.18), 0, 0.18));
    if ((features.hipHinge ?? 0) < 0.36 && phase !== "standing") {
      issues.push("deadlift_short_hinge");
      tips.push("Push the hips back further before standing tall.");
    }
    if ((features.kneeShift ?? 0) > 0.16) {
      issues.push("deadlift_knees_forward");
      tips.push("Keep the shins more vertical as you hinge.");
    }
  }

  if (confidenceScore < config.confidenceThreshold) {
    warnings.push("tracking_low_confidence");
  }
  if (!tips.length) {
    tips.push(exercise === "plank" ? "Hold steady and keep breathing." : `${config.label} tracking looks controlled. Keep the tempo smooth.`);
  }

  const alignmentScore = average(alignmentPool) ?? 0;
  const tempoConsistency = normalize(1800 - tempoSpread, 0, 1800);
  const scoreComponents = {
    rom: round(romScore * 100),
    alignment: round(alignmentScore * 100),
    tempo: round(tempoConsistency * 100),
    stability: round(stability * 100),
    visibility: round(visibilityScore * 100),
  };
  const score =
    romScore * 30 +
    alignmentScore * 28 +
    tempoConsistency * 12 +
    stability * 10 +
    visibilityScore * 20;

  return analysisResult(
    exercise,
    score >= 82 ? `${config.label} tracking looks solid` : `Adjust your ${config.label.toLowerCase()}`,
    tips,
    score,
    phase,
    {
      ...baseMetrics(features),
      rom_progress: round(progress * 100),
      tracking_confidence: round(confidenceScore * 100),
      stability_score: round(stability * 100),
      score_rom: scoreComponents.rom,
      score_alignment: scoreComponents.alignment,
      score_tempo: scoreComponents.tempo,
      score_stability: scoreComponents.stability,
      score_visibility: scoreComponents.visibility,
    },
    issues,
    warnings,
  );
}

function createTotals() {
  return EXERCISES.reduce((totals, exercise) => {
    totals[exercise] = {
      exercise,
      label: EXERCISE_LABELS[exercise],
      reps: 0,
      validReps: 0,
      invalidReps: 0,
      partialReps: 0,
      durationMs: 0,
      holdMs: 0,
      scoreSum: 0,
      scoreFrames: 0,
      confidenceSum: 0,
      confidenceFrames: 0,
      issueCounts: {},
      bestRep: null,
      worstRep: null,
      repEvents: [],
      tempoMs: [],
      lastRepAt: null,
    };
    return totals;
  }, {});
}

function serializeIssues(issueCounts) {
  return Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([issue, count]) => ({ issue, count }));
}

function serializeTotals(totals) {
  return EXERCISES.reduce((payload, exercise) => {
    const total = totals[exercise];
    const averageScore = total.scoreFrames ? Math.round(total.scoreSum / total.scoreFrames) : 0;
    const averageConfidence = total.confidenceFrames ? round(total.confidenceSum / total.confidenceFrames, 2) : 0;
    const issues = Object.entries(total.issueCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([issue, count]) => ({ issue, count }));
    payload[exercise] = {
      exercise,
      label: total.label,
      reps: total.reps,
      valid_reps: total.validReps,
      invalid_reps: total.invalidReps,
      partial_reps: total.partialReps,
      duration_seconds: Math.round(total.durationMs / 1000),
      hold_seconds: Math.round(total.holdMs / 1000),
      average_form_score: averageScore,
      average_confidence: averageConfidence,
      issues,
      best_rep: total.bestRep,
      worst_rep: total.worstRep,
      rep_events: total.repEvents.slice(-40),
      average_tempo_ms: total.tempoMs.length ? Math.round(average(total.tempoMs) || 0) : 0,
      last_rep_at: total.lastRepAt,
    };
    return payload;
  }, {});
}

function createRepState() {
  return {
    currentRepPhase: "ready",
    phase: "unknown",
    startedAt: 0,
    bottomAt: 0,
    lastRepAt: 0,
    peakProgress: 0,
    minScore: 100,
    issues: new Set(),
    warnings: new Set(),
    visibilityDrops: 0,
  };
}

function createRepStates() {
  return COUNTED_EXERCISES.reduce((states, exercise) => {
    states[exercise] = createRepState();
    return states;
  }, {});
}

function resetRepState(state) {
  state.currentRepPhase = "ready";
  state.phase = "unknown";
  state.startedAt = 0;
  state.bottomAt = 0;
  state.peakProgress = 0;
  state.minScore = 100;
  state.issues = new Set();
  state.warnings = new Set();
  state.visibilityDrops = 0;
}

function createRepEvent(total, exercise, kind, timestamp, score, confidence, phase, issues = [], partial = false) {
  return {
    id: `${exercise}-${kind}-${timestamp}`,
    exercise,
    exercise_label: EXERCISE_LABELS[exercise],
    kind,
    partial,
    rep_index: total.reps + (kind === "valid" ? 1 : 0),
    score: clamp(Math.round(score), 0, 100),
    confidence: round(confidence, 2),
    phase,
    issues: [...issues],
    timestamp,
    completed_at: new Date(timestamp).toISOString(),
  };
}

function pushFeedback(feedback, line, timestamp, exercise = "general") {
  const clean = String(line || "").trim();
  if (!clean) return;
  const duplicate = feedback.find((item) => item.text === clean && timestamp - item.timestamp < 2400);
  if (duplicate) return;
  feedback.unshift({
    id: `${timestamp}-${clean.slice(0, 18)}`,
    text: clean,
    exercise,
    timestamp,
  });
  feedback.splice(FEEDBACK_LIMIT);
}

function recordIssue(total, issueCounts, issue) {
  total.issueCounts[issue] = (total.issueCounts[issue] || 0) + 1;
  issueCounts[issue] = (issueCounts[issue] || 0) + 1;
}

function updateRepCounter({ exercise, config, analysis, confidenceScore, progress, timestamp, repStates, totals, features }) {
  if (!config || config.mode !== "reps") return null;
  const state = repStates[exercise];
  const total = totals[exercise];
  const previousRepPhase = state.currentRepPhase;
  const transitionResult = () =>
    state.currentRepPhase !== previousRepPhase
      ? { transition: `${previousRepPhase}->${state.currentRepPhase}`, counted: false, invalid: false }
      : null;

  state.phase = analysis.phase;
  state.minScore = Math.min(state.minScore, analysis.score || 100);
  analysis.issues.forEach((issue) => state.issues.add(issue));
  analysis.warnings.forEach((warning) => state.warnings.add(warning));

  const visibilityOk = hasVisibility(features, config.required);
  if (!visibilityOk || confidenceScore < config.confidenceThreshold - 0.08) {
    state.visibilityDrops += 1;
  }

  if (state.currentRepPhase === "ready") {
    if (progress >= config.startThreshold) {
      state.currentRepPhase = "eccentric";
      state.startedAt = timestamp;
      state.peakProgress = progress;
      state.minScore = analysis.score || 100;
    }
    return transitionResult();
  }

  state.peakProgress = Math.max(state.peakProgress, progress);

  if (state.currentRepPhase === "eccentric" && progress >= config.peakThreshold) {
    state.currentRepPhase = "bottom";
    state.bottomAt = timestamp;
  } else if (state.currentRepPhase === "bottom" && progress < config.peakThreshold - 0.12) {
    state.currentRepPhase = "concentric";
  }

  if (
    (timestamp - state.startedAt > config.repTimeoutMs || state.visibilityDrops > 2) &&
    state.currentRepPhase !== "ready"
  ) {
    const partial = state.peakProgress >= config.partialThreshold;
    if (partial) {
      total.partialReps += 1;
    }
    total.invalidReps += 1;
    const invalidEvent = createRepEvent(
      total,
      exercise,
      "invalid",
      timestamp,
      state.minScore,
      confidenceScore,
      state.phase,
      [...state.issues, ...(state.peakProgress < config.partialThreshold ? ["insufficient_range"] : [])],
      partial,
    );
    total.repEvents.push(invalidEvent);
    resetRepState(state);
    state.currentRepPhase = "invalid";
    return { repEvent: invalidEvent, counted: false, invalid: true, transition: `${previousRepPhase}->invalid` };
  }

  const cooldownOk = timestamp - state.lastRepAt >= config.cooldownMs;
  const validCycle =
    state.currentRepPhase === "concentric" &&
    progress <= config.startThreshold &&
    state.peakProgress >= config.peakThreshold &&
    cooldownOk &&
    confidenceScore >= config.confidenceThreshold &&
    analysis.score >= 35;

  if (validCycle) {
    const repScore = Math.round((state.minScore + analysis.score) / 2);
    const validEvent = createRepEvent(total, exercise, "valid", timestamp, repScore, confidenceScore, analysis.phase, state.issues);
    total.reps += 1;
    total.validReps += 1;
    total.lastRepAt = validEvent.completed_at;
    total.repEvents.push(validEvent);
    if (state.startedAt) {
      total.tempoMs.push(timestamp - state.startedAt);
      total.tempoMs = total.tempoMs.slice(-20);
    }
    if (!total.bestRep || validEvent.score > total.bestRep.score) total.bestRep = validEvent;
    if (!total.worstRep || validEvent.score < total.worstRep.score) total.worstRep = validEvent;
    state.lastRepAt = timestamp;
    resetRepState(state);
    state.currentRepPhase = "completed";
    return { repEvent: validEvent, counted: true, invalid: false, transition: `${previousRepPhase}->completed` };
  }

  return transitionResult();
}

function completedExerciseTotals(serializedTotals) {
  return EXERCISE_ORDER.map((exercise) => serializedTotals[exercise]).filter(
    (total) =>
      total &&
      (total.reps > 0 || total.hold_seconds > 0 || total.invalid_reps > 0 || total.partial_reps > 0),
  );
}

function buildOffFrameState({ setup, totals, issueCounts, feedback, currentExercise, lastGoodState, selectedExercise }) {
  const previous = lastGoodState || {};
  const label = EXERCISE_LABELS[currentExercise] || EXERCISE_LABELS.general;
  const serializedTotals = serializeTotals(totals);
  const activeExercise = currentExercise !== "general" ? currentExercise : selectedExercise;
  return {
    status: "off_frame",
    headline: setup.messages[0] || "Move into frame or select an exercise",
    tips: setup.messages.length ? setup.messages : ["Move into frame or select an exercise."],
    phase: "not_detected",
    score: 0,
    detectedExercise: currentExercise || "general",
    selectedExercise: selectedExercise || "general",
    detectedLabel: label,
    confidence: previous.confidence || 0,
    confidenceScore: (previous.confidence || 0) / 100,
    setup,
    totals: serializedTotals,
    totalReps: Object.values(serializedTotals).reduce((sum, item) => sum + item.reps, 0),
    averageFormScore: previous.averageFormScore || 0,
    averageConfidence: previous.averageConfidence || 0,
    feedback: feedback.slice(),
    detectedIssues: serializeIssues(issueCounts),
    exerciseScores: previous.exerciseScores || {},
    metrics: {
      visible_keypoints: setup.visibleCount,
      confidence: setup.averageConfidence,
      rom_progress: 0,
      tracking_confidence: round(setup.averageConfidence * 100),
    },
    bestReps: previous.bestReps || {},
    worstReps: previous.worstReps || {},
    repTimeline: previous.repTimeline || [],
    repEvents: previous.repEvents || [],
    validReps: previous.validReps || 0,
    invalidReps: previous.invalidReps || 0,
    partialReps: previous.partialReps || 0,
    plankDuration: previous.plankDuration || 0,
    coachCues: feedback.map((item) => item.text).slice(0, 8),
    improvementTips: previous.improvementTips || [],
    warnings: setup.messages,
    trackingStable: false,
    manualSelectionRecommended: false,
    currentRepPhase: "ready",
    activeExercise,
    visibleJoints: setup.checklist.filter((item) => item.ok).map((item) => item.label),
    missingJoints: setup.checklist.filter((item) => !item.ok).map((item) => item.label),
    sessionReady: false,
  };
}

function debugEnabled(options = {}) {
  if (options.debug) return true;
  try {
    return typeof globalThis !== "undefined" && globalThis.localStorage?.getItem("poseDebug") === "1";
  } catch {
    return false;
  }
}

function createAutoWorkoutTracker() {
  let totals = createTotals();
  let repStates = createRepStates();
  let issueCounts = {};
  let feedback = [];
  let history = [];
  let smoothedScores = {};
  let currentExercise = "general";
  let selectedExercise = "general";
  let lastTimestamp = 0;
  let lastGoodState = null;
  let scoreSum = 0;
  let scoreFrames = 0;
  let confidenceSum = 0;
  let confidenceFrames = 0;
  let smoothedKeypoints = [];
  let firstTrackableAt = 0;
  let lowConfidenceSince = 0;
  let lastDebugAt = 0;

  function reset() {
    totals = createTotals();
    repStates = createRepStates();
    issueCounts = {};
    feedback = [];
    history = [];
    smoothedScores = {};
    currentExercise = "general";
    selectedExercise = "general";
    lastTimestamp = 0;
    lastGoodState = null;
    scoreSum = 0;
    scoreFrames = 0;
    confidenceSum = 0;
    confidenceFrames = 0;
    smoothedKeypoints = [];
    firstTrackableAt = 0;
    lowConfidenceSince = 0;
    lastDebugAt = 0;
  }

  function update(keypoints = [], frame = { width: 1, height: 1 }, timestamp = Date.now(), options = {}) {
    const safeTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
    const deltaMs = lastTimestamp ? clamp(safeTimestamp - lastTimestamp, 0, 1000) : 0;
    lastTimestamp = safeTimestamp;
    selectedExercise = options.selectedExercise || "general";
    const useAutoDetect = options.autoDetect !== false;

    smoothedKeypoints = smoothKeypoints(keypoints, smoothedKeypoints);
    const features = extractFrameFeatures(smoothedKeypoints, frame, safeTimestamp);
    const setup = setupGuidance(features, selectedExercise);

    if (!setup.trackable) {
      firstTrackableAt = 0;
      lowConfidenceSince = 0;
      const lastGoodAge = lastGoodState ? safeTimestamp - lastGoodState.timestamp : Infinity;
      if (lastGoodAge < TRACKING_LOSS_GRACE_MS) {
        return {
          ...lastGoodState.state,
          status: "adjust",
          headline: "Tracking through a brief dropout",
          tips: setup.messages.length ? setup.messages : ["Hold position while tracking stabilizes."],
          setup,
          warnings: setup.messages,
          trackingStable: false,
        };
      }
      return buildOffFrameState({
        setup,
        totals,
        issueCounts,
        feedback,
        currentExercise,
        lastGoodState: lastGoodState?.state,
        selectedExercise,
      });
    }

    if (!firstTrackableAt) firstTrackableAt = safeTimestamp;

    history.push(features);
    if (history.length > HISTORY_LIMIT) history = history.slice(-HISTORY_LIMIT);

    const movementPattern = movementPatternScores(features, history);
    const rawScores = candidateScores(features, history, movementPattern);
    const detection = chooseExercise(rawScores, smoothedScores, currentExercise, useAutoDetect ? "general" : selectedExercise, movementPattern);
    currentExercise = detection.exercise;
    smoothedScores = detection.scores;
    const confidenceScore = detection.confidence;
    const activeExercise = detection.exercise === "general" ? selectedExercise : detection.exercise;
    const exerciseForAnalysis = activeExercise === "general" ? "general" : activeExercise;
    const lowConfidenceActive = useAutoDetect && exerciseForAnalysis === "general" && movementPattern.stats.enoughFrames && detection.lowConfidence;
    if (lowConfidenceActive) {
      lowConfidenceSince = lowConfidenceSince || safeTimestamp;
    } else {
      lowConfidenceSince = 0;
    }
    const manualSelectionRecommended = Boolean(lowConfidenceSince && safeTimestamp - lowConfidenceSince >= LOW_CONFIDENCE_FALLBACK_MS);
    const scanningScore = clamp(
      Math.round(normalize(features.avgScore, 0.24, 0.62) * 52 + movementPattern.stats.motionIntensity * 28),
      features.visibleCount >= 6 ? 32 : 0,
      78,
    );

    const analysis =
      exerciseForAnalysis === "general"
        ? analysisResult(
            "general",
            manualSelectionRecommended
              ? "Auto-detect confidence is low"
              : detection.scanning || !movementPattern.stats.enoughFrames
                ? "Scanning movement"
                : "Keep moving for detection",
            [
              manualSelectionRecommended
                ? "Select exercise manually for better accuracy."
                : movementPattern.stats.enoughFrames
                  ? "Keep moving through a full rep."
                  : "Keep moving for detection.",
            ],
            scanningScore,
            "unknown",
            {
              ...baseMetrics(features),
              rom_progress: 0,
              tracking_confidence: round(confidenceScore * 100),
              movement_intensity: round(movementPattern.stats.motionIntensity * 100),
              movement_window_ms: movementPattern.stats.durationMs,
              score_visibility: round(normalize(features.avgScore, 0.24, 0.62) * 100),
            },
            [],
            manualSelectionRecommended ? ["manual_selection_recommended"] : [],
          )
        : evaluateExercise(exerciseForAnalysis, features, history, confidenceScore);

    const config = EXERCISE_CONFIG[exerciseForAnalysis];
    const progress = exerciseForAnalysis === "general" ? 0 : progressForExercise(exerciseForAnalysis, features);
    const confidence = Math.round(clamp(confidenceScore, 0, 1) * 100);

    if (exerciseForAnalysis !== "general") {
      totals[exerciseForAnalysis].durationMs += deltaMs;
      totals[exerciseForAnalysis].scoreSum += analysis.score;
      totals[exerciseForAnalysis].scoreFrames += 1;
      totals[exerciseForAnalysis].confidenceSum += confidenceScore;
      totals[exerciseForAnalysis].confidenceFrames += 1;
      analysis.issues.forEach((issue) => recordIssue(totals[exerciseForAnalysis], issueCounts, issue));
    }

    if (exerciseForAnalysis === "plank" && analysis.score >= 45 && confidenceScore >= (config?.confidenceThreshold || 0.42)) {
      totals.plank.holdMs += deltaMs;
    }

    if (analysis.score > 0) {
      scoreSum += analysis.score;
      scoreFrames += 1;
    }
    confidenceSum += confidenceScore;
    confidenceFrames += 1;

    const counterResult =
      exerciseForAnalysis !== "general"
        ? updateRepCounter({
            exercise: exerciseForAnalysis,
            config,
            analysis: { ...analysis, groups: features.groups },
            confidenceScore,
            progress,
            timestamp: safeTimestamp,
            repStates,
            totals,
            features,
          })
        : null;

    if (counterResult?.counted) {
      pushFeedback(
        feedback,
        `${EXERCISE_LABELS[exerciseForAnalysis]} rep counted with ${counterResult.repEvent.score}/100 form.`,
        safeTimestamp,
        exerciseForAnalysis,
      );
    } else if (counterResult?.invalid) {
      pushFeedback(
        feedback,
        `${EXERCISE_LABELS[exerciseForAnalysis]} rep was not counted. Finish the full range of motion.`,
        safeTimestamp,
        exerciseForAnalysis,
      );
    }

    analysis.tips.slice(0, 2).forEach((tip) => {
      pushFeedback(feedback, `${EXERCISE_LABELS[exerciseForAnalysis]}: ${tip}`, safeTimestamp, exerciseForAnalysis);
    });

    const serializedTotals = serializeTotals(totals);
    const totalReps = EXERCISE_ORDER.reduce((sum, exercise) => sum + (serializedTotals[exercise]?.reps || 0), 0);
    const validReps = EXERCISE_ORDER.reduce((sum, exercise) => sum + (serializedTotals[exercise]?.valid_reps || 0), 0);
    const invalidReps = EXERCISE_ORDER.reduce((sum, exercise) => sum + (serializedTotals[exercise]?.invalid_reps || 0), 0);
    const partialReps = EXERCISE_ORDER.reduce((sum, exercise) => sum + (serializedTotals[exercise]?.partial_reps || 0), 0);
    const repEvents = EXERCISE_ORDER.flatMap((exercise) => serializedTotals[exercise]?.rep_events || []).sort((a, b) => b.timestamp - a.timestamp).slice(0, 40);
    const bestReps = {};
    const worstReps = {};
    EXERCISE_ORDER.forEach((exercise) => {
      if (serializedTotals[exercise].best_rep) bestReps[exercise] = serializedTotals[exercise].best_rep;
      if (serializedTotals[exercise].worst_rep) worstReps[exercise] = serializedTotals[exercise].worst_rep;
    });

    const currentRepState = repStates[exerciseForAnalysis] || createRepState();
    const visibleJoints = Object.entries(features.groups)
      .filter(([, visible]) => visible)
      .map(([joint]) => JOINT_LABELS[joint] || joint);
    const missingJoints = config?.required?.filter((joint) => !features.groups[joint]).map((joint) => JOINT_LABELS[joint] || joint) || [];

    const state = {
      status: analysis.status,
      headline: analysis.headline,
      tips: analysis.tips,
      phase: analysis.phase,
      score: analysis.score,
      detectedExercise: currentExercise,
      selectedExercise,
      detectedLabel: currentExercise === "general" ? "Scanning movement" : EXERCISE_LABELS[currentExercise],
      confidence,
      confidenceScore: round(confidenceScore, 3),
      averageConfidence: confidenceFrames ? Math.round((confidenceSum / confidenceFrames) * 100) : confidence,
      setup,
      totals: serializedTotals,
      totalReps,
      averageFormScore: scoreFrames ? Math.round(scoreSum / scoreFrames) : analysis.score,
      feedback: feedback.slice(),
      detectedIssues: serializeIssues(issueCounts),
      exerciseScores: Object.fromEntries(Object.entries(smoothedScores).map(([exercise, value]) => [exercise, round(value, 3)])),
      metrics: {
        ...analysis.metrics,
        detected_movement_pattern: movementPattern.bestPattern,
        detected_movement_score: round(movementPattern.bestScore * 100),
        movement_window_ms: movementPattern.stats.durationMs,
        movement_frames: movementPattern.stats.frames.length,
        movement_intensity: round(movementPattern.stats.motionIntensity * 100),
        current_phase: currentRepState.phase || analysis.phase,
        rep_phase:
          exerciseForAnalysis === "general" || exerciseForAnalysis === "plank"
            ? exerciseForAnalysis === "plank"
              ? "hold"
              : "ready"
            : currentRepState.currentRepPhase,
        valid_reps: validReps,
        invalid_reps: invalidReps,
        partial_reps: partialReps,
        plank_duration: serializedTotals.plank.hold_seconds,
        average_tempo_ms:
          exerciseForAnalysis !== "general" && serializedTotals[exerciseForAnalysis]
            ? serializedTotals[exerciseForAnalysis].average_tempo_ms
            : 0,
        last_rep_timestamp:
          exerciseForAnalysis !== "general" && serializedTotals[exerciseForAnalysis]
            ? serializedTotals[exerciseForAnalysis].last_rep_at
              ? new Date(serializedTotals[exerciseForAnalysis].last_rep_at).getTime()
              : 0
            : 0,
      },
      bestReps,
      worstReps,
      repTimeline: repEvents.slice(0, 12),
      repEvents,
      validReps,
      invalidReps,
      partialReps,
      plankDuration: serializedTotals.plank.hold_seconds,
      coachCues: feedback.map((item) => item.text).slice(0, 8),
      improvementTips: [...new Set(analysis.tips.concat(serializeIssues(issueCounts).slice(0, 3).map((item) => item.issue.replace(/_/g, " "))))].slice(0, 6),
      warnings: analysis.warnings,
      trackingStable: true,
      manualSelectionRecommended,
      currentRepPhase:
        exerciseForAnalysis === "general" || exerciseForAnalysis === "plank"
          ? exerciseForAnalysis === "plank"
            ? "hold"
            : "ready"
          : currentRepState.currentRepPhase,
      activeExercise: exerciseForAnalysis,
      visibleJoints,
      missingJoints,
      sessionReady: exerciseForAnalysis !== "general",
      detectedExercises: completedExerciseTotals(serializedTotals).map((total) => total.exercise),
      detection: {
        mode: useAutoDetect ? "auto" : "manual",
        movementPattern: movementPattern.bestPattern,
        movementScore: movementPattern.bestScore,
        scanning: Boolean(detection.scanning),
        enoughFrames: movementPattern.stats.enoughFrames,
        lowConfidenceSeconds: lowConfidenceSince ? round((safeTimestamp - lowConfidenceSince) / 1000, 1) : 0,
      },
    };

    if (debugEnabled(options) && safeTimestamp - lastDebugAt >= DEBUG_THROTTLE_MS) {
      lastDebugAt = safeTimestamp;
      console.debug("[pose-tracker]", {
        visibleJoints,
        detectedMovementPattern: movementPattern.bestPattern,
        exerciseScores: state.exerciseScores,
        selectedDetectedExercise: exerciseForAnalysis,
        repStateTransition: counterResult?.transition || null,
        formScoreComponents: {
          rom: state.metrics.score_rom ?? 0,
          alignment: state.metrics.score_alignment ?? 0,
          tempo: state.metrics.score_tempo ?? 0,
          stability: state.metrics.score_stability ?? 0,
          visibility: state.metrics.score_visibility ?? 0,
        },
      });
    }

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
  EXERCISE_CONFIG,
  EXERCISE_LABELS,
  candidateScores,
  createAutoWorkoutTracker,
  extractFrameFeatures,
  phaseForExercise,
  setupGuidance,
};
