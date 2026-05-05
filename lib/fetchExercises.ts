import { getExerciseImageUrl } from "@/lib/exerciseImages";

export type ExerciseRow = {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  image_url: string;
};

/** Static fallback when DB table is empty or unavailable */
export const STATIC_EXERCISES: ExerciseRow[] = [
  {
    id: "s1",
    name: "Push-ups",
    description: "Upper-body pushing strength with no equipment.",
    muscle_group: "chest",
    image_url: getExerciseImageUrl("Push-ups"),
  },
  {
    id: "s2",
    name: "Squats",
    description: "Pattern for legs and hips; control depth and knees.",
    muscle_group: "legs",
    image_url: getExerciseImageUrl("Squats"),
  },
  {
    id: "s3",
    name: "Plank",
    description: "Anti-extension core; keep ribs stacked over hips.",
    muscle_group: "core",
    image_url: getExerciseImageUrl("Plank"),
  },
  {
    id: "s4",
    name: "Lunges",
    description: "Single-leg stability and quad/glute loading.",
    muscle_group: "legs",
    image_url: getExerciseImageUrl("Lunges"),
  },
  {
    id: "s5",
    name: "Burpees",
    description: "Full-body power and conditioning in one move.",
    muscle_group: "full_body",
    image_url: getExerciseImageUrl("Burpees"),
  },
  {
    id: "s6",
    name: "Glute bridge",
    description: "Hip extension; squeeze at the top without over-arching.",
    muscle_group: "glutes",
    image_url: getExerciseImageUrl("Glute bridge"),
  },
  {
    id: "s7",
    name: "Mountain climbers",
    description: "Core and cardio; hands under shoulders.",
    muscle_group: "core",
    image_url: getExerciseImageUrl("Mountain climbers"),
  },
  {
    id: "s8",
    name: "Dumbbell row",
    description: "Pulling strength for mid-back.",
    muscle_group: "back",
    image_url: getExerciseImageUrl("Dumbbell row"),
  },
];

export async function fetchExerciseLibrary(): Promise<ExerciseRow[]> {
  return STATIC_EXERCISES;
}
