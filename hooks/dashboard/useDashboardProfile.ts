"use client";

import {
  asNumber,
  asPositiveNumber,
  asString,
  asStringArray,
} from "@/hooks/dashboard/useDashboardStats";
import type { DashboardProfile } from "@/hooks/dashboard/types";

export function profileFromRows(
  profileRow: Record<string, unknown> | null,
  fitnessRow: Record<string, unknown> | null,
): DashboardProfile {
  const weightKg = asNumber(profileRow?.weight_kg);
  const weeklyTarget = asPositiveNumber(fitnessRow?.weekly_workout_target ?? profileRow?.workout_days_per_week, 3);
  const goal = asString(profileRow?.goal ?? fitnessRow?.main_goal, "improve_fitness");
  const fitnessLevel = asString(profileRow?.fitness_level ?? fitnessRow?.fitness_level, "beginner");
  const name = asString(profileRow?.name, "Athlete");
  const age = asNumber(profileRow?.age);
  const height = asNumber(profileRow?.height_cm);
  const preferredWorkoutDays = asStringArray(profileRow?.preferred_workout_days ?? fitnessRow?.preferred_workout_days);

  return {
    name,
    age,
    weightKg,
    goal,
    fitnessLevel,
    workoutDaysPerWeek: Math.min(7, Math.max(1, weeklyTarget)),
    preferredWorkoutDays,
    targetWeightKg: asNumber(fitnessRow?.target_weight_kg),
    equipment: asStringArray(profileRow?.equipment_available ?? fitnessRow?.equipment_available),
    injuries: asString(profileRow?.injuries ?? fitnessRow?.injuries_limitations, ""),
    profileComplete:
      name.length >= 2 &&
      Boolean(goal) &&
      Boolean(fitnessLevel) &&
      Boolean(age && age > 0) &&
      Boolean(weightKg && weightKg > 0) &&
      Boolean(height && height > 0),
  };
}
