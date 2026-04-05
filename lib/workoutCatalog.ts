export type WorkoutType = "strength" | "cardio" | "flexibility";

export type CatalogExercise = {
  id: string;
  name: string;
  type: WorkoutType;
  /** Seconds per working set */
  workSeconds: number;
  sets: number;
  /** Rest between sets */
  restSeconds: number;
  description: string;
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: "Strength",
  cardio: "Cardio",
  flexibility: "Flexibility",
};

export const WORKOUT_CATALOG: CatalogExercise[] = [
  {
    id: "squats",
    name: "Squats",
    type: "strength",
    workSeconds: 45,
    sets: 3,
    restSeconds: 45,
    description: "Hips back, chest up, full depth if comfortable.",
  },
  {
    id: "pushups",
    name: "Push-ups",
    type: "strength",
    workSeconds: 40,
    sets: 3,
    restSeconds: 40,
    description: "Straight line from head to heels; control the lowering.",
  },
  {
    id: "lunges",
    name: "Alternating lunges",
    type: "strength",
    workSeconds: 45,
    sets: 3,
    restSeconds: 40,
    description: "Step long, keep front knee stacked over ankle.",
  },
  {
    id: "plank",
    name: "Plank hold",
    type: "strength",
    workSeconds: 30,
    sets: 4,
    restSeconds: 30,
    description: "Brace core; hips level with shoulders.",
  },
  {
    id: "burpees",
    name: "Burpees",
    type: "cardio",
    workSeconds: 30,
    sets: 4,
    restSeconds: 30,
    description: "Steady rhythm; step back if you need a softer version.",
  },
  {
    id: "jumping_jacks",
    name: "Jumping jacks",
    type: "cardio",
    workSeconds: 45,
    sets: 3,
    restSeconds: 30,
    description: "Light feet, relaxed arms.",
  },
  {
    id: "high_knees",
    name: "High knees",
    type: "cardio",
    workSeconds: 30,
    sets: 4,
    restSeconds: 25,
    description: "Drive knees up; stay tall through the torso.",
  },
  {
    id: "mountain_climbers",
    name: "Mountain climbers",
    type: "cardio",
    workSeconds: 35,
    sets: 3,
    restSeconds: 35,
    description: "Hands under shoulders; hips low and quiet.",
  },
  {
    id: "cat_cow",
    name: "Cat–cow",
    type: "flexibility",
    workSeconds: 60,
    sets: 2,
    restSeconds: 15,
    description: "Move slowly with your breath.",
  },
  {
    id: "hip_circles",
    name: "Hip circles",
    type: "flexibility",
    workSeconds: 45,
    sets: 2,
    restSeconds: 15,
    description: "Big smooth circles; switch direction halfway.",
  },
  {
    id: "shoulder_rolls",
    name: "Shoulder rolls",
    type: "flexibility",
    workSeconds: 40,
    sets: 2,
    restSeconds: 15,
    description: "Relax neck; roll backward and forward.",
  },
  {
    id: "hamstring_stretch",
    name: "Standing hamstring fold",
    type: "flexibility",
    workSeconds: 45,
    sets: 2,
    restSeconds: 20,
    description: "Soft knees if needed; breathe into the stretch.",
  },
];

export function getExerciseById(id: string): CatalogExercise | undefined {
  return WORKOUT_CATALOG.find((e) => e.id === id);
}

export function exercisesByType(type: WorkoutType): CatalogExercise[] {
  return WORKOUT_CATALOG.filter((e) => e.type === type);
}
