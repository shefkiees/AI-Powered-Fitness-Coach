import { getGoals } from "@/src/services/goalsService";
import { getLatestNutritionPlan } from "@/src/services/nutritionService";
import { getProfile } from "@/src/services/profileService";
import { getProgressLogs } from "@/src/services/progressService";
import { getWorkoutLogs, getWorkoutPlan } from "@/src/services/workoutService";

export async function loadDashboardData() {
  const [profile, workouts, progressLogs, goals, workoutLogs] = await Promise.all([
    getProfile(),
    getWorkoutPlan(),
    getProgressLogs(),
    getGoals(),
    getWorkoutLogs(),
  ]);

  return {
    profile,
    workouts,
    progressLogs,
    goals,
    workoutLogs,
    nutritionPlan: await getLatestNutritionPlan(),
  };
}
