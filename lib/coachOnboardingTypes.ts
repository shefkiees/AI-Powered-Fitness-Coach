export const COACH_ONBOARDING_STORAGE_KEY = "pulse_coach_onboarding_v1";

export type FitnessGoalOption =
  | "lose_fat"
  | "build_muscle"
  | "improve_endurance"
  | "stay_healthy";

export type FitnessLevelOption = "beginner" | "intermediate" | "advanced";

export type WorkoutLocationOption = "home" | "gym" | "outdoor";

export type CoachOnboardingPayload = {
  gender: string;
  age: number;
  heightCm: number;
  weightKg: number;
  fitnessGoal: FitnessGoalOption;
  fitnessLevel: FitnessLevelOption;
  workoutDaysPerWeek: number;
  workoutDurationMinutes: number;
  equipment: string[];
  injuries: string;
  workoutLocation: WorkoutLocationOption;
  nutritionPreference: string;
  targetWeightKg: number | null;
  mainMotivation: string;
};

export const emptyCoachOnboarding = (): CoachOnboardingPayload => ({
  gender: "",
  age: 28,
  heightCm: 170,
  weightKg: 70,
  fitnessGoal: "stay_healthy",
  fitnessLevel: "beginner",
  workoutDaysPerWeek: 3,
  workoutDurationMinutes: 45,
  equipment: [],
  injuries: "",
  workoutLocation: "home",
  nutritionPreference: "balanced",
  targetWeightKg: null,
  mainMotivation: "",
});

export function mapGoalToProfileGoal(goal: FitnessGoalOption): string {
  switch (goal) {
    case "lose_fat":
      return "lose_weight";
    case "build_muscle":
      return "build_muscle";
    case "improve_endurance":
      return "improve_endurance";
    case "stay_healthy":
    default:
      return "maintain_health";
  }
}

export function mapGoalToFitnessMainGoal(goal: FitnessGoalOption): string {
  switch (goal) {
    case "lose_fat":
      return "lose_weight";
    case "build_muscle":
      return "build_muscle";
    case "improve_endurance":
      return "endurance";
    case "stay_healthy":
    default:
      return "maintain_health";
  }
}
