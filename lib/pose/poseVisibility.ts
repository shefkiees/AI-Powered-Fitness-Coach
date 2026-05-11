import type { FrameFeatures, SetupGuidance } from "@/lib/pose/poseTypes";
import { round } from "@/lib/pose/poseMetrics";

export function setupGuidance(features: FrameFeatures): SetupGuidance {
  const checklist = [
    { label: "Shoulders visible", ok: features.groups.shoulders },
    { label: "Hips visible", ok: features.groups.hips },
    { label: "Knees visible", ok: features.groups.knees },
    { label: "Ankles visible", ok: features.groups.ankles },
    { label: "Hands visible", ok: features.groups.wrists },
    { label: "Tracking confidence", ok: features.avgScore >= 0.28 && features.visibleCount >= 6 },
  ];
  const messages: string[] = [];

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
