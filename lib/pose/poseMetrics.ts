import type { PoseKeypoint } from "@/lib/pose/drawPose";
import type {
  FrameFeatures,
  PoseFrame,
  PosePoint,
  PosePointMap,
  VisibilityGroups,
} from "@/lib/pose/poseTypes";

const MIN_KEYPOINT_SCORE = 0.23;
const LOW_KEYPOINT_SCORE = 0.16;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalize(value: number | null | undefined, low: number, high: number) {
  if (!Number.isFinite(value)) return 0;
  const numeric = Number(value);
  if (high === low) return numeric >= high ? 1 : 0;
  return clamp((numeric - low) / (high - low), 0, 1);
}

export function round(value: number | null | undefined, digits = 0) {
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** digits;
  return Math.round(Number(value) * multiplier) / multiplier;
}

export function strong(point: PosePoint | undefined | null, minScore = MIN_KEYPOINT_SCORE): point is PosePoint {
  return Boolean(
    point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      (point.score ?? 0) >= minScore,
  );
}

export function average(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function angle(a?: PosePoint | null, b?: PosePoint | null, c?: PosePoint | null) {
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

export function midpoint(a?: PosePoint | null, b?: PosePoint | null) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score ?? 0, b.score ?? 0),
  };
}

export function keypointMap(keypoints: PoseKeypoint[]): PosePointMap {
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

export function range(history: FrameFeatures[], key: keyof FrameFeatures) {
  const values = history
    .map((item) => item[key])
    .filter((value): value is number => Number.isFinite(value));
  if (values.length < 2) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function stdDev(history: FrameFeatures[], key: keyof FrameFeatures, count = 10) {
  const values = history
    .slice(-count)
    .map((item) => item[key])
    .filter((value): value is number => Number.isFinite(value));
  if (values.length < 2) return 0;
  const mean = average(values) ?? 0;
  const variance = average(values.map((value) => (value - mean) ** 2)) ?? 0;
  return Math.sqrt(variance);
}

export function groupVisible(points: PosePointMap): VisibilityGroups {
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

export function extractFrameFeatures(
  keypoints: PoseKeypoint[] = [],
  frame: PoseFrame = { width: 1, height: 1 },
  timestamp = Date.now(),
): FrameFeatures {
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
  const shoulderWidth = groups.shoulders ? Math.max(1, Math.abs(points.ls!.x - points.rs!.x)) : null;
  const ankleWidth = groups.ankles ? Math.abs(points.la!.x - points.ra!.x) : null;
  const kneeWidth = groups.knees ? Math.abs(points.lk!.x - points.rk!.x) : null;
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
      ? Math.max(Math.abs(points.lk!.x - points.la!.x), Math.abs(points.rk!.x - points.ra!.x)) / width
      : null;
  const frontKneeAngle =
    average([leftKneeAngle, rightKneeAngle]) === null
      ? null
      : Math.min(
          Number.isFinite(leftKneeAngle) ? Number(leftKneeAngle) : 180,
          Number.isFinite(rightKneeAngle) ? Number(rightKneeAngle) : 180,
        );
  const kneeAsymmetry =
    Number.isFinite(leftKneeAngle) && Number.isFinite(rightKneeAngle)
      ? Math.abs(Number(leftKneeAngle) - Number(rightKneeAngle))
      : null;
  const elbowAsymmetry =
    Number.isFinite(leftElbowAngle) && Number.isFinite(rightElbowAngle)
      ? Math.abs(Number(leftElbowAngle) - Number(rightElbowAngle))
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

export function baseMetrics(features: FrameFeatures): Record<string, number> {
  return {
    confidence: round(features.avgScore, 2),
    visible_keypoints: features.visibleCount,
    body_width_ratio: round(features.widthRatio, 2),
    body_height_ratio: round(features.heightRatio, 2),
    knee_angle: round(features.kneeAngle),
    left_knee_angle: round(features.leftKneeAngle),
    right_knee_angle: round(features.rightKneeAngle),
    elbow_angle: round(features.elbowAngle),
    left_elbow_angle: round(features.leftElbowAngle),
    right_elbow_angle: round(features.rightElbowAngle),
    shoulder_angle: round(features.shoulderAngle),
    body_angle: round(features.bodyAngle),
    hip_offset: round(features.hipOffset, 3),
    torso_lean: round(features.torsoLean, 3),
    hip_tilt: round(features.hipTilt, 3),
    ankle_width_ratio: round(features.ankleWidthRatio, 2),
    knee_ankle_ratio: round(features.kneeAnkleRatio, 2),
    wrist_elbow_stack: round(features.wristElbowStack, 3),
    wrist_shoulder_stack: round(features.wristShoulderStack, 3),
    asymmetry: round(features.elbowAsymmetry ?? features.kneeAsymmetry),
    arms_overhead: features.armsOverhead ? 1 : 0,
  };
}
