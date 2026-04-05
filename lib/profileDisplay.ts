import { WORKOUT_PREFERENCE_LABELS } from "@/lib/profileOptions";

export const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose weight",
  build_muscle: "Build muscle",
  stay_fit: "Stay fit",
  maintain: "Stay fit",
  general_fitness: "Stay fit",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  sedentary: "Low",
  light: "Low",
  active: "High",
  athlete: "High",
};

export const GENDER_LABELS: Record<string, string> = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  prefer_not_say: "Prefer not to say",
};

export function workoutFocusLabel(preference: string): string {
  return (
    WORKOUT_PREFERENCE_LABELS[preference] ??
    WORKOUT_PREFERENCE_LABELS.full_body
  );
}
