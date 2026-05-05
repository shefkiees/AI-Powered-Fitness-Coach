/** Shared onboarding / profile edit option lists */

export const GENDER_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "prefer_not_say", label: "Prefer not to say" },
] as const;

export const GOAL_OPTIONS = [
  {
    id: "lose_weight",
    label: "Lose weight",
    sub: "Cardio + calorie awareness",
  },
  {
    id: "build_muscle",
    label: "Build muscle",
    sub: "Strength & progressive overload",
  },
  {
    id: "stay_fit",
    label: "Stay fit",
    sub: "Balanced cardio and strength",
  },
] as const;

export const ACTIVITY_OPTIONS = [
  { id: "low", label: "Low", sub: "Mostly sedentary or light movement" },
  {
    id: "moderate",
    label: "Moderate",
    sub: "Regular activity a few days/week",
  },
  { id: "high", label: "High", sub: "Very active or training most days" },
] as const;

/** Legacy onboarding option; current profile rows store the main level in profiles.fitness_level. */
export const WORKOUT_PREFERENCE_OPTIONS = [
  {
    id: "abs",
    label: "Abs & core",
    sub: "Planks, twists, and midsection strength",
  },
  {
    id: "chest",
    label: "Chest",
    sub: "Push patterns and upper-body pressing",
  },
  {
    id: "legs",
    label: "Legs",
    sub: "Squats, lunges, and lower-body power",
  },
  {
    id: "full_body",
    label: "Full body",
    sub: "Balanced upper, lower, and core each session",
  },
  {
    id: "fat_loss",
    label: "Fat loss",
    sub: "Higher-movement circuits and conditioning",
  },
  {
    id: "strength",
    label: "Strength",
    sub: "Heavier sets, fewer reps, more rest",
  },
  {
    id: "cardio",
    label: "Cardio",
    sub: "Heart rate up - jumps, steps, and intervals",
  },
] as const;

export type WorkoutPreferenceId =
  (typeof WORKOUT_PREFERENCE_OPTIONS)[number]["id"];

export const WORKOUT_PREFERENCE_LABELS: Record<string, string> =
  Object.fromEntries(
    WORKOUT_PREFERENCE_OPTIONS.map((option) => [option.id, option.label]),
  ) as Record<string, string>;
