import type { FitnessProfileRow } from "@/lib/fitnessProfiles";

export type WorkoutExercise = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  description: string;
};

export type WorkoutSection = {
  title: "Warm-up" | "Main workout" | "Cooldown";
  exercises: WorkoutExercise[];
};

export type GeneratedWorkoutPlan = {
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sections: WorkoutSection[];
};

export type WorkoutPreferenceId =
  | "abs"
  | "chest"
  | "legs"
  | "full_body"
  | "fat_loss"
  | "strength"
  | "cardio";

const PREFERENCE_IDS: readonly WorkoutPreferenceId[] = [
  "abs",
  "chest",
  "legs",
  "full_body",
  "fat_loss",
  "strength",
  "cardio",
] as const;

export function normalizeWorkoutPreference(raw: string): WorkoutPreferenceId {
  const v = (raw ?? "").trim().toLowerCase();
  return PREFERENCE_IDS.includes(v as WorkoutPreferenceId)
    ? (v as WorkoutPreferenceId)
    : "full_body";
}

function mergeMainWithPreference(
  goalMain: WorkoutExercise[],
  focusMain: WorkoutExercise[],
  mainCount: number,
  seed: number,
): WorkoutExercise[] {
  const focusShare = Math.min(
    focusMain.length,
    Math.max(2, Math.ceil(mainCount * 0.55)),
  );
  const focusPicks = rotateExercises(focusMain, seed).slice(0, focusShare);
  const names = new Set(focusPicks.map((e) => e.name));
  const filler = rotateExercises(goalMain, seed + 5).filter(
    (e) => !names.has(e.name),
  );
  const merged = [...focusPicks, ...filler];
  return merged.slice(0, mainCount);
}

type NormalizedGoal = "lose_weight" | "build_muscle" | "stay_fit";
type Tier = 1 | 2 | 3;

/** Map stored goals + legacy IDs to planner goals */
export function normalizeGoal(goal: string): NormalizedGoal {
  if (goal === "lose_weight") return "lose_weight";
  if (goal === "build_muscle") return "build_muscle";
  if (goal === "stay_fit") return "stay_fit";
  if (goal === "maintain" || goal === "general_fitness") return "stay_fit";
  return "stay_fit";
}

/** Map activity_level (new + legacy) to intensity tier */
export function normalizeActivityLevel(level: string): "low" | "moderate" | "high" {
  const v = level.toLowerCase();
  if (v === "low" || v === "sedentary" || v === "light") return "low";
  if (v === "high" || v === "active" || v === "athlete") return "high";
  if (v === "moderate") return "moderate";
  return "moderate";
}

function tierFromActivity(a: ReturnType<typeof normalizeActivityLevel>): Tier {
  if (a === "low") return 1;
  if (a === "moderate") return 2;
  return 3;
}

function rotateExercises<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return items;
  const k = seed % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

function scale(
  tier: Tier,
  sets: [string, string, string],
  reps: [string, string, string],
  rest: [string, string, string],
) {
  const i = tier - 1;
  return { sets: sets[i], reps: reps[i], rest: rest[i] };
}

export function buildWorkoutPlan(
  profile: FitnessProfileRow,
  refreshSeed = 0,
): GeneratedWorkoutPlan {
  const goal = normalizeGoal(profile.goal);
  const tier = tierFromActivity(normalizeActivityLevel(profile.activity_level));
  const difficulty: GeneratedWorkoutPlan["difficulty"] =
    tier === 1 ? "Beginner" : tier === 2 ? "Intermediate" : "Advanced";

  const s = (base: {
    sets: [string, string, string];
    reps: [string, string, string];
    rest: [string, string, string];
  }) => scale(tier, base.sets, base.reps, base.rest);

  const warmUps: WorkoutExercise[] = [
    {
      name: "Arm circles",
      ...s({
        sets: ["1", "1", "1"],
        reps: ["10 each way", "15 each way", "20 each way"],
        rest: ["15s", "15s", "10s"],
      }),
      description: "Slow controlled circles forward and backward.",
    },
    {
      name: "Leg swings",
      ...s({
        sets: ["1", "2", "2"],
        reps: ["8 per leg", "10 per leg", "12 per leg"],
        rest: ["20s", "15s", "15s"],
      }),
      description: "Hold a wall; swing one leg forward and back with control.",
    },
    {
      name: "Cat-cow stretch",
      ...s({
        sets: ["1", "2", "2"],
        reps: ["8 cycles", "10 cycles", "12 cycles"],
        rest: ["20s", "15s", "15s"],
      }),
      description: "On hands and knees, alternate arch and round your spine.",
    },
  ];

  const coolDowns: WorkoutExercise[] = [
    {
      name: "Forward fold",
      ...s({
        sets: ["1", "1", "2"],
        reps: ["30s hold", "45s hold", "2×30s"],
        rest: ["—", "—", "20s"],
      }),
      description: "Let your upper body hang; slight bend in knees if needed.",
    },
    {
      name: "Chest doorway stretch",
      ...s({
        sets: ["1", "2", "2"],
        reps: ["20s per side", "30s per side", "2×30s per side"],
        rest: ["10s", "10s", "15s"],
      }),
      description: "Forearm on door frame; step through gently to open chest.",
    },
  ];

  const loseWeightMain: WorkoutExercise[] = [
    {
      name: "Jumping jacks",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["20", "30", "45 sec"],
        rest: ["45s", "40s", "30s"],
      }),
      description: "Light landings; stay on the balls of your feet.",
    },
    {
      name: "Bodyweight squats",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["10", "12-15", "15-20"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Chest up, knees track over toes; depth you control.",
    },
    {
      name: "Burpees",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["5", "8", "10-12"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Optional step-back instead of jump if you need to dial intensity.",
    },
    {
      name: "High knees (in place)",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20s", "30s", "45s"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Pump arms; lift knees toward hip height.",
    },
    {
      name: "Brisk walk or easy jog",
      ...s({
        sets: ["1", "1", "1"],
        reps: ["5 min", "8 min", "12 min"],
        rest: ["—", "—", "—"],
      }),
      description: "Outdoors or treadmill; finish strong but conversational pace.",
    },
  ];

  const buildMuscleMain: WorkoutExercise[] = [
    {
      name: "Push-ups",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["6-10", "10-15", "15-20"],
        rest: ["60s", "60s", "45s"],
      }),
      description: "Rigid plank; elbows ~45° from torso. Incline if needed.",
    },
    {
      name: "Inverted row or pull-up prep",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["6-8", "8-12", "AMRAP -1"],
        rest: ["75s", "60s", "60s"],
      }),
      description: "Under a sturdy table edge or bar; pull chest to the bar.",
    },
    {
      name: "Dumbbell floor press",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["8-10", "10-12", "12-15"],
        rest: ["75s", "60s", "60s"],
      }),
      description: "Short range of motion is fine; squeeze at lockout. Use any load you have.",
    },
    {
      name: "Goblet squat",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["8-10", "10-12", "12-15"],
        rest: ["90s", "75s", "60s"],
      }),
      description: "Hold one dumbbell at chest; squat between hips and knees.",
    },
    {
      name: "Romanian deadlift (dumbbells)",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["8-10", "10-12", "12-14"],
        rest: ["90s", "75s", "60s"],
      }),
      description: "Soft bend in knees; push hips back; feel hamstrings lengthen.",
    },
  ];

  const absFocus: WorkoutExercise[] = [
    {
      name: "Dead bug",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["8 per side", "10 per side", "12 per side"],
        rest: ["45s", "40s", "35s"],
      }),
      description:
        "Lower back pressed down; opposite arm and leg extend with control.",
    },
    {
      name: "Slow bicycle crunch",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["12 total", "16 total", "20 total"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Elbow meets opposite knee; avoid yanking on the neck.",
    },
    {
      name: "Side plank (each side)",
      ...s({
        sets: ["1", "2", "2"],
        reps: ["20s", "30s", "40s"],
        rest: ["30s", "25s", "20s"],
      }),
      description: "Stack shoulders and hips; lift hips in a straight line.",
    },
    {
      name: "Plank shoulder taps",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["10 taps", "14 taps", "18 taps"],
        rest: ["50s", "45s", "40s"],
      }),
      description: "Minimal hip sway; feet slightly wider if needed.",
    },
    {
      name: "Slow Russian twist",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["16", "20", "24"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Heels down or feet up; rotate through the ribcage.",
    },
  ];

  const chestFocus: WorkoutExercise[] = [
    {
      name: "Push-ups",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["6-10", "10-15", "15-20"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Rigid plank; elbows ~45° from torso. Incline if needed.",
    },
    {
      name: "Wide-grip push-ups",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["6-10", "8-12", "12-15"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Hands wider than shoulders; chest toward the floor.",
    },
    {
      name: "Pike push-up",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["5-8", "8-10", "10-12"],
        rest: ["75s", "60s", "50s"],
      }),
      description: "Hips high; head moves toward hands—shoulders do the work.",
    },
    {
      name: "Triceps bench dip",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["8-10", "10-12", "12-15"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Shoulders down; bend elbows to 90°, press up without shrugging.",
    },
    {
      name: "Incline push-up (hands elevated)",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["8-12", "12-15", "15-18"],
        rest: ["50s", "45s", "40s"],
      }),
      description: "Hands on a bench or counter; full range with control.",
    },
  ];

  const legsFocus: WorkoutExercise[] = [
    {
      name: "Bodyweight squat",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["10", "12-15", "15-20"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Chest tall; knees track toes; depth you own.",
    },
    {
      name: "Reverse lunge",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["8 per leg", "10 per leg", "12 per leg"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Step back softly; front shin stays mostly vertical.",
    },
    {
      name: "Jump squat (or squat to calf raise)",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["6", "8", "10"],
        rest: ["75s", "60s", "50s"],
      }),
      description: "Land quietly—or skip the jump and rise onto toes.",
    },
    {
      name: "Single-leg glute bridge",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["8 per side", "10 per side", "12 per side"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Drive through the heel; don’t over-arch the low back.",
    },
    {
      name: "Wall sit",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20s", "30s", "40s"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Thighs near parallel; breathe steadily.",
    },
  ];

  const cardioFocus: WorkoutExercise[] = [
    {
      name: "Jumping jacks",
      ...s({
        sets: ["2", "3", "4"],
        reps: ["20", "30", "45 sec"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Light landings; stay tall through the crown of the head.",
    },
    {
      name: "Mountain climbers (slow)",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20s", "30s", "40s"],
        rest: ["50s", "45s", "40s"],
      }),
      description: "Hands under shoulders; drive knees without bouncing hips.",
    },
    {
      name: "High knees",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20s", "30s", "40s"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Quick but controlled; pump arms.",
    },
    {
      name: "Skater hops",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["10 per side", "12 per side", "16 per side"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Leap side to side; soft knee on the landing leg.",
    },
    {
      name: "Butt kicks in place",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20s", "30s", "40s"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Light feet; heels toward glutes without leaning forward.",
    },
  ];

  const stayFitMain: WorkoutExercise[] = [
    {
      name: "Bodyweight squats",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["10", "12-15", "15-18"],
        rest: ["50s", "45s", "40s"],
      }),
      description: "Steady tempo down and up.",
    },
    {
      name: "Push-ups",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["6-10", "8-12", "12-15"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Quality reps over speed.",
    },
    {
      name: "Plank",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20s", "30-45s", "45-60s"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Glutes tucked; breathe without sagging hips.",
    },
    {
      name: "Jumping jacks",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["20", "30", "40"],
        rest: ["45s", "40s", "35s"],
      }),
      description: "Light cardio flush between strength moves.",
    },
    {
      name: "Lunges (alternating)",
      ...s({
        sets: ["2", "3", "3"],
        reps: ["8 per leg", "10 per leg", "12 per leg"],
        rest: ["60s", "50s", "45s"],
      }),
      description: "Short stride; back knee approaches floor softly.",
    },
  ];

  const mainPool =
    goal === "lose_weight"
      ? loseWeightMain
      : goal === "build_muscle"
        ? buildMuscleMain
        : stayFitMain;

  const preference = normalizeWorkoutPreference(profile.workout_preference);

  const focusPool: WorkoutExercise[] =
    preference === "abs"
      ? absFocus
      : preference === "chest"
        ? chestFocus
        : preference === "legs"
          ? legsFocus
          : preference === "cardio"
            ? cardioFocus
            : preference === "fat_loss"
              ? loseWeightMain
              : preference === "strength"
                ? buildMuscleMain
                : stayFitMain;

  const warmCount = tier === 1 ? 2 : tier === 2 ? 3 : 3;
  const mainCount = tier === 1 ? 3 : tier === 2 ? 4 : 5;
  const coolCount = tier === 1 ? 1 : 2;

  const mainOrdered =
    preference === "full_body"
      ? rotateExercises(mainPool, refreshSeed).slice(0, mainCount)
      : mergeMainWithPreference(mainPool, focusPool, mainCount, refreshSeed);

  return {
    difficulty,
    sections: [
      {
        title: "Warm-up",
        exercises: rotateExercises(warmUps, refreshSeed).slice(0, warmCount),
      },
      {
        title: "Main workout",
        exercises: mainOrdered,
      },
      {
        title: "Cooldown",
        exercises: rotateExercises(coolDowns, refreshSeed + 1).slice(
          0,
          coolCount,
        ),
      },
    ],
  };
}
