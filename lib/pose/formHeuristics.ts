import type { PoseKeypoint } from "@/lib/pose/drawPose";

const MIN_SCORE = 0.28;

function strong(kp: PoseKeypoint | undefined): boolean {
  return (kp?.score ?? 0) >= MIN_SCORE;
}

export type FormStatus = "good" | "adjust" | "off_frame";

export function analyzePoseForm(
  keypoints: PoseKeypoint[],
  frame: { width: number; height: number },
): {
  status: FormStatus;
  headline: string;
  tips: string[];
} {
  const h = Math.max(frame.height, 1);
  const w = Math.max(frame.width, 1);

  if (!keypoints.length) {
    return {
      status: "off_frame",
      headline: "No pose detected",
      tips: ["Allow camera access and step back so your full body is visible."],
    };
  }

  const ls = keypoints[5];
  const rs = keypoints[6];
  const lh = keypoints[11];
  const rh = keypoints[12];
  const lk = keypoints[13];
  const rk = keypoints[14];
  const la = keypoints[15];
  const ra = keypoints[16];

  const core =
    strong(ls) && strong(rs) && strong(lh) && strong(rh) && strong(lk) && strong(rk);

  if (!core) {
    return {
      status: "off_frame",
      headline: "Need better framing",
      tips: ["Keep hips, knees, and shoulders in frame for form feedback."],
    };
  }

  const tips: string[] = [];

  const hipTilt = Math.abs(lh!.y - rh!.y) / h;
  if (hipTilt > 0.07) {
    tips.push("Level your hips - square up to the camera.");
  }

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
  if (drop > 0.14) {
    tips.push("Lift hips slightly - brace your core like a plank.");
  }

  if (tips.length === 0) {
    return {
      status: "good",
      headline: "Good form",
      tips: ["Solid alignment. Keep smooth breathing and controlled tempo."],
    };
  }

  return {
    status: "adjust",
    headline: "Adjust posture",
    tips: tips.slice(0, 2),
  };
}
