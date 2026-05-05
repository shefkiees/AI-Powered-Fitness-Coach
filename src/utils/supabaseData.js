import { requireSupabase } from "@/src/lib/supabaseClient";
import {
  calculateNutritionTargets,
  generateMeals,
} from "@/src/utils/fitnessCalculations";

export const PROFILE_SCHEMA_ERROR_MESSAGE =
  "Tabela public.profiles nuk ekziston ose schema cache nuk eshte rifreskuar. Apliko supabase-schema.sql ne Supabase SQL Editor, pastaj provo perseri.";

export const WORKOUT_SCHEMA_ERROR_MESSAGE =
  "Workout schema mungon ose Supabase schema cache nuk eshte rifreskuar. Apliko supabase-schema.sql finale ne Supabase SQL Editor, pastaj provo perseri.";

const emptyUuid = "00000000-0000-0000-0000-000000000000";

const exerciseLibraryFallback = [
  ["Bodyweight Squat", "Legs", "Bodyweight", "Beginner", "Stand tall, sit hips back, bend knees, then drive through your feet to stand."],
  ["Push-up", "Chest", "Bodyweight", "Beginner", "Keep hands under shoulders, lower with control, and press back up with a firm core."],
  ["Dumbbell Row", "Back", "Dumbbells", "Beginner", "Support one hand, pull the dumbbell toward your hip, and lower slowly."],
  ["Reverse Lunge", "Legs", "Bodyweight", "Beginner", "Step back, lower both knees, then push through the front foot to return."],
  ["Plank", "Core", "Bodyweight", "Beginner", "Keep elbows under shoulders, squeeze glutes, and breathe steadily."],
  ["Romanian Deadlift", "Hamstrings", "Dumbbells", "Intermediate", "Hinge at hips, keep weights close, and stand by squeezing glutes."],
  ["Goblet Squat", "Legs", "Dumbbell", "Intermediate", "Hold one dumbbell at chest height and squat with a tall torso."],
  ["Shoulder Press", "Shoulders", "Dumbbells", "Intermediate", "Brace your core and press weights overhead without shrugging."],
  ["Lat Pulldown", "Back", "Machine", "Intermediate", "Pull the bar toward your upper chest and control it back up."],
  ["Mountain Climber", "Core", "Bodyweight", "Intermediate", "Keep shoulders over wrists and alternate knees toward your chest."],
  ["Step-up", "Legs", "Bench", "Beginner", "Step onto a stable box and drive through the full foot."],
  ["Side Plank", "Core", "Bodyweight", "Intermediate", "Stack feet, lift hips, and hold a straight line from head to heels."],
].map(([name, muscle_group, equipment, difficulty, instructions], index) => ({
  id: `static_${index + 1}`,
  name,
  muscle_group,
  equipment,
  difficulty,
  instructions,
  image_url: null,
}));

function textFromError(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ");
}

function isMissingRelationError(error, tableName = "") {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  const table = tableName.toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    (table && message.includes(`relation "public.${table}"`))
  );
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function isProfileNotFoundError(error) {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  return (
    error.code === "PGRST116" ||
    (error.status === 406 && message.includes("0 rows")) ||
    message.includes("0 rows")
  );
}

export function isProfilesTableMissingError(error) {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.status === 404 && message.includes("profiles")) ||
    (message.includes("schema cache") && message.includes("profiles")) ||
    (message.includes('relation "public.profiles"') && message.includes("does not exist"))
  );
}

function throwProfileError(error) {
  if (isProfilesTableMissingError(error)) {
    throw new Error(PROFILE_SCHEMA_ERROR_MESSAGE);
  }

  throw error;
}

function profileNameFromUser(user, fallbackName = "") {
  return (
    fallbackName?.trim?.() ||
    user?.user_metadata?.full_name?.trim?.() ||
    user?.user_metadata?.name?.trim?.() ||
    user?.email?.split("@")?.[0]?.trim?.() ||
    ""
  );
}

function nullableNumber(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

function normalizeProfilePayload(formValues) {
  return {
    name: formValues.name.trim(),
    age: Number(formValues.age),
    gender: formValues.gender,
    height_cm: Number(formValues.height_cm),
    weight_kg: Number(formValues.weight_kg),
    goal: formValues.goal,
    fitness_level: formValues.fitness_level,
    workout_days_per_week: Number(formValues.workout_days_per_week),
    dietary_preference: formValues.dietary_preference.trim() || "standard",
    injuries: formValues.injuries.trim(),
  };
}

function normalizeGoalPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    target_value: values.target_value === "" ? null : Number(values.target_value),
    current_value: values.current_value === "" ? 0 : Number(values.current_value),
    unit: values.unit.trim() || null,
    status: values.status || "active",
    deadline: values.deadline || null,
  };
}

function normalizeWorkoutPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description?.trim?.() || "",
    day_of_week: values.day_of_week?.trim?.() || null,
    difficulty: values.difficulty || "Beginner",
    duration_minutes: values.duration_minutes === "" ? null : Number(values.duration_minutes),
  };
}

function normalizeExercisePayload(workoutId, values) {
  return {
    workout_id: workoutId,
    name: values.name.trim(),
    sets: values.sets === "" ? null : Number(values.sets),
    reps: values.reps?.trim?.() || null,
    weight_kg: values.weight_kg === "" ? null : Number(values.weight_kg),
    rest_seconds: values.rest_seconds === "" ? null : Number(values.rest_seconds),
    notes: values.notes?.trim?.() || "",
    order_index: values.order_index === "" ? null : Number(values.order_index),
  };
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function normalizeProgressPayload(values) {
  return {
    weight_kg: nullableNumber(values.weight_kg),
    calories_burned: nullableNumber(values.calories ?? values.calories_burned),
    steps: values.steps === "" || values.steps === null || values.steps === undefined ? null : Number(values.steps),
    notes: values.note?.trim?.() || values.notes?.trim?.() || "",
    logged_at: values.logged_at || undefined,
  };
}

function normalizeLegacyProgressPayload(values) {
  return {
    weight_kg: nullableNumber(values.weight_kg),
    calories: nullableNumber(values.calories ?? values.calories_burned),
    steps: values.steps === "" || values.steps === null || values.steps === undefined ? null : Number(values.steps),
    note: values.note?.trim?.() || values.notes?.trim?.() || "",
  };
}

async function getLegacyProgressLogs(client) {
  const { data, error } = await client
    .from("progress")
    .select("*")
    .order("logged_at", { ascending: true });

  if (error) {
    if (isMissingRelationError(error, "progress")) return [];
    throw error;
  }

  return (data || []).map(normalizeProgressRow);
}

async function addLegacyProgressLog(client, values) {
  const { data, error } = await client
    .from("progress")
    .insert(normalizeLegacyProgressPayload(values))
    .select()
    .single();

  if (error) throw error;
  return normalizeProgressRow(data);
}

function isMissingColumnError(error) {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.code === "23502" ||
    message.includes("schema cache") ||
    message.includes("column") ||
    message.includes("null value")
  );
}

function normalizeProgressRow(row) {
  return {
    ...row,
    calories: row.calories_burned ?? row.calories ?? null,
    note: row.notes ?? row.note ?? "",
  };
}

function normalizeWorkoutLogPayload(workout, values = {}) {
  return {
    workout_id: workout?.is_local_catalog ? null : workout?.id || values.workout_id || null,
    session_id: values.session_id || null,
    workout_title: (workout?.title || values.workout_title || "Workout").trim(),
    duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
    calories_burned:
      nullableNumber(values.calories_burned) ||
      estimateCalories(workout?.duration_minutes ?? values.duration_minutes, values.intensity),
    rating: nullableNumber(values.rating),
    notes: values.notes?.trim?.() || "",
    completed_at: values.completed_at || undefined,
  };
}

function normalizeWorkoutLibraryRow(row) {
  const media = [...(row.workout_media || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const linkedExercises = [...(row.workout_exercises || [])]
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map((item, index) => ({
      id: item.exercise_id || item.id,
      name: item.exercise_name || item.exercises?.name || "Exercise",
      sets: item.sets,
      reps: item.reps,
      time_seconds: item.time_seconds,
      rest_seconds: item.rest_seconds,
      notes: item.notes || item.exercises?.instructions || item.exercises?.description || "",
      order_index: item.order_index || index + 1,
      muscle_group: item.exercises?.muscle_group || row.muscle_group,
      equipment: item.exercises?.equipment || row.equipment,
    }));
  const directExercises = [...(row.exercises || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const exercises = linkedExercises.length ? linkedExercises : directExercises;
  const primaryMedia = media.find((item) => item.is_primary) || media[0] || null;
  const thumbnail =
    row.thumbnail_url ||
    primaryMedia?.thumbnail_url ||
    (primaryMedia?.media_type === "image" ? primaryMedia.media_url : null);

  return {
    ...row,
    category: row.category || (row.user_id ? "Plan" : "General"),
    muscle_group: row.muscle_group || "Full body",
    difficulty: row.difficulty || "Beginner",
    duration_minutes: row.duration_minutes || null,
    thumbnail_url: workoutThumbnailFor(row, thumbnail),
    goal_tags: Array.isArray(row.goal_tags) ? row.goal_tags : [],
    workout_media: media,
    workout_steps: exercises.map((exercise, index) => ({
          id: exercise.id,
          title: exercise.name,
          description: [
            exercise.sets ? `${exercise.sets} sets` : "",
            exercise.reps || "",
            exercise.notes || "",
          ]
            .filter(Boolean)
            .join(" - "),
          duration_seconds: exercise.rest_seconds || null,
          order_index: exercise.order_index || index + 1,
        })),
    exercises,
  };
}

const fallbackExerciseVideos = {
  "bodyweight squat": "https://www.youtube.com/watch?v=u-xm0I1Lcgs",
  "goblet squat": "https://www.youtube.com/watch?v=MeIiIdhvXT4",
  "incline push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
  "push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
  "dumbbell floor press": "https://www.youtube.com/watch?v=VmB1G1K7v94",
  "plank shoulder tap": "https://www.youtube.com/watch?v=gWHQpMUd7vw",
  "dumbbell row": "https://www.youtube.com/watch?v=roCP6wCXPqo",
  "reverse fly": "https://www.youtube.com/watch?v=JoCRRZ3zRtI",
  "lat pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "biceps curl": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  "triceps dip": "https://www.youtube.com/watch?v=6kALZikXxLc",
  "plank": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
  "side plank": "https://www.youtube.com/watch?v=K2VljzCC16g",
  "dead bug": "https://www.youtube.com/watch?v=g_BYB0R-4Ws",
  "bird dog": "https://www.youtube.com/watch?v=wiFNA3sqjCA",
  "bicycle crunch": "https://www.youtube.com/watch?v=9FGilxCbdz8",
  "marching intervals": "https://www.youtube.com/watch?v=ZllXIKITzfg",
  "mountain climber": "https://www.youtube.com/watch?v=nmwgirgXLYM",
  "jumping jacks": "https://www.youtube.com/watch?v=c4DAnQ6DtF8",
  "burpee": "https://www.youtube.com/watch?v=TU8QYVW0gDU",
  "high knees": "https://www.youtube.com/watch?v=oDdkytliOqE",
  "shoulder press": "https://www.youtube.com/watch?v=B-aVuyhvLHU",
  "lateral raise": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "front raise": "https://www.youtube.com/watch?v=-t7fuZ0KhDA",
  "reverse lunge": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
  "step-up": "https://www.youtube.com/watch?v=dQqApCGd5Ss",
  "glute bridge": "https://www.youtube.com/watch?v=wPM8icPu6H8",
  "romanian deadlift": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
};

const workoutThumbnailRules = [
  {
    match: ["back", "pull", "biceps", "row"],
    url: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["chest", "push", "upper body"],
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["shoulder", "deltoid"],
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["leg", "lower", "glute"],
    url: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["hiit", "fat", "cardio", "conditioning"],
    url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["core", "abs", "stability"],
    url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["mobility", "stretch", "recovery", "yoga"],
    url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["boxing"],
    url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
  },
];

function workoutThumbnailFor(workout, fallback = null) {
  const current = String(fallback || "");
  const isGenericLocal =
    !current ||
    current.includes("/pulse-assets/workout-strength.jpg") ||
    current.includes("/pulse-assets/workout-cardio.jpg") ||
    current.includes("/pulse-assets/workout-yoga.jpg") ||
    current.includes("/pulse-assets/workout-stretch.jpg");

  if (!workout?.is_local_catalog && !workout?.slug?.includes?.("starter") && !isGenericLocal) {
    return fallback;
  }

  const text = normalizeText(
    `${workout?.slug || ""} ${workout?.title || ""} ${workout?.category || ""} ${workout?.muscle_group || ""}`,
  );
  const hit = workoutThumbnailRules.find((rule) => rule.match.some((word) => text.includes(word)));
  return hit?.url || fallback || "/pulse-assets/workout-strength.jpg";
}

function fallbackVideoForExercise(name) {
  const key = normalizeText(name);
  return fallbackExerciseVideos[key] || null;
}

const fallbackExercisesByCategory = {
  chest: [
    ["Incline Push-up", 3, "8-12", 45, 60, "Keep your body straight and lower with control."],
    ["Dumbbell Floor Press", 3, "10-12", 45, 75, "Press up smoothly and keep shoulders relaxed."],
    ["Plank Shoulder Tap", 3, "20 taps", 40, 45, "Keep hips still while tapping each shoulder."],
    ["Triceps Dip", 3, "8-10", 40, 60, "Lower only as far as your shoulders feel comfortable."],
    ["Push-up", 2, "6-10", 40, 60, "Use knees or an incline if needed and keep a straight line."],
  ],
  back: [
    ["Dumbbell Row", 3, "10-12 each side", 45, 60, "Pull elbow toward your hip and pause at the top."],
    ["Reverse Fly", 3, "10-12", 40, 60, "Use light weight and squeeze shoulder blades together."],
    ["Lat Pulldown", 3, "10-12", 45, 75, "Pull toward your upper chest and control the return."],
    ["Biceps Curl", 3, "10-12", 40, 45, "Keep elbows close and avoid swinging the weight."],
    ["Dead Bug", 2, "8 each side", 40, 45, "Move slowly and keep your lower back steady."],
  ],
  core: [
    ["Plank", 3, "30-45 sec", 40, 45, "Brace your core and breathe steadily."],
    ["Side Plank", 2, "25 sec each side", 35, 45, "Keep hips lifted and shoulders stacked."],
    ["Dead Bug", 3, "8 each side", 40, 45, "Move opposite arm and leg with control."],
    ["Bird Dog", 3, "8 each side", 40, 45, "Reach long and keep your hips level."],
    ["Bicycle Crunch", 3, "16 reps", 40, 45, "Rotate gently and keep the movement controlled."],
  ],
  cardio: [
    ["Marching Intervals", 4, "45 sec", 45, 30, "Stay tall and keep the pace comfortable."],
    ["Jumping Jacks", 3, "35 sec", 35, 30, "Land softly and keep your breathing steady."],
    ["Mountain Climber", 3, "30 sec", 30, 45, "Keep shoulders over wrists and move smoothly."],
    ["Bodyweight Squat", 3, "12 reps", 45, 45, "Sit hips back and drive through your feet."],
    ["Burpee", 2, "6-8", 35, 60, "Move at a pace where your form stays clean."],
  ],
  shoulders: [
    ["Shoulder Press", 3, "8-12", 45, 60, "Brace your core and press overhead smoothly."],
    ["Lateral Raise", 3, "10-12", 35, 45, "Lift only to shoulder height with soft elbows."],
    ["Front Raise", 2, "10-12", 35, 45, "Raise with control and keep ribs down."],
    ["Reverse Fly", 3, "10-12", 40, 60, "Use light weight and squeeze shoulder blades together."],
    ["Plank Shoulder Tap", 3, "20 taps", 40, 45, "Keep hips still while tapping each shoulder."],
  ],
  legs: [
    ["Goblet Squat", 3, "10-12", 45, 60, "Hold the weight close and keep your chest tall."],
    ["Reverse Lunge", 3, "8 each side", 45, 60, "Step back softly and push through the front foot."],
    ["Romanian Deadlift", 3, "10-12", 45, 75, "Hinge at the hips and keep weights close."],
    ["Step-up", 3, "8 each side", 45, 60, "Use a stable step and drive through the full foot."],
    ["Glute Bridge", 3, "12-15", 40, 45, "Pause at the top and squeeze your glutes."],
  ],
  strength: [
    ["Bodyweight Squat", 3, "10-12", 45, 60, "Sit hips back, keep chest tall, then stand strong."],
    ["Push-up", 3, "6-12", 40, 60, "Use an incline if needed and stop before form breaks."],
    ["Dumbbell Row", 3, "10-12 each side", 45, 60, "Pull toward your hip and lower slowly."],
    ["Reverse Lunge", 3, "8 each side", 45, 60, "Step back, lower under control, then stand tall."],
    ["Plank", 2, "30-45 sec", 40, 45, "Keep ribs down and breathe steadily."],
  ],
};

function fallbackExercisesForWorkout(workout) {
  const haystack = normalizeText(`${workout.title} ${workout.category} ${workout.muscle_group}`);
  const key =
    (haystack.includes("shoulder") || haystack.includes("deltoid") ? "shoulders" : "") ||
    (haystack.includes("leg") || haystack.includes("lower") ? "legs" : "") ||
    (haystack.includes("hiit") || haystack.includes("fat") ? "cardio" : "") ||
    (haystack.includes("pull") ? "back" : "") ||
    Object.keys(fallbackExercisesByCategory).find((item) => haystack.includes(item)) ||
    "strength";

  return fallbackExercisesByCategory[key].map(([name, sets, reps, time_seconds, rest_seconds, notes], index) => ({
    id: `${workout.id || workout.slug || "workout"}-fallback-${index + 1}`,
    name,
    sets,
    reps,
    time_seconds,
    rest_seconds,
    notes,
    order_index: index + 1,
    muscle_group: workout.muscle_group || "Full body",
    equipment: workout.equipment || "Bodyweight",
    video_url: fallbackVideoForExercise(name),
    fallback: true,
  }));
}

function withWorkoutSteps(workout, exercises) {
  return {
    ...workout,
    exercises,
    workout_steps: exercises.map((exercise, index) => ({
      id: exercise.id,
      title: exercise.name,
      description: [
        exercise.sets ? `${exercise.sets} sets` : "",
        exercise.reps || "",
        exercise.notes || exercise.instructions || "",
      ]
        .filter(Boolean)
        .join(" - "),
      duration_seconds: exercise.rest_seconds || null,
      order_index: exercise.order_index || index + 1,
    })),
  };
}

const localWorkoutCatalog = [
  {
    slug: "upper-body-strength-builder",
    title: "Upper Body Strength Builder",
    category: "Strength",
    muscle_group: "Chest",
    difficulty: "Beginner",
    duration_minutes: 26,
    description: "Beginner-friendly push training for chest, shoulders, arms, and core control.",
    thumbnail_url: "/pulse-assets/workout-strength.jpg",
    equipment: "Bodyweight, Dumbbells",
    goal_tags: ["build_muscle", "improve_fitness"],
  },
  {
    slug: "back-and-biceps-foundation",
    title: "Back and Biceps Foundation",
    category: "Strength",
    muscle_group: "Back",
    difficulty: "Beginner",
    duration_minutes: 30,
    description: "A clear pull-day session with rows, rear-delts, arms, and a core finisher.",
    thumbnail_url: "/pulse-assets/workout-strength.jpg",
    equipment: "Dumbbells",
    goal_tags: ["build_muscle", "improve_fitness"],
  },
  {
    slug: "lower-body-leg-day",
    title: "Lower Body Leg Day",
    category: "Strength",
    muscle_group: "Legs",
    difficulty: "Beginner",
    duration_minutes: 34,
    description: "Simple lower-body work for quads, glutes, hamstrings, and balance.",
    thumbnail_url: "/pulse-assets/workout-cardio.jpg",
    equipment: "Bodyweight, Dumbbells",
    goal_tags: ["build_muscle", "lose_weight"],
  },
  {
    slug: "shoulder-shape-and-posture",
    title: "Shoulder Shape and Posture",
    category: "Strength",
    muscle_group: "Shoulders",
    difficulty: "Beginner",
    duration_minutes: 24,
    description: "Shoulder volume with controlled presses, raises, and upper-back support.",
    thumbnail_url: "/pulse-assets/workout-strength.jpg",
    equipment: "Dumbbells",
    goal_tags: ["build_muscle", "maintain"],
  },
  {
    slug: "hiit-fat-burn-starter",
    title: "HIIT Fat Burn Starter",
    category: "Cardio",
    muscle_group: "Full body",
    difficulty: "Beginner",
    duration_minutes: 20,
    description: "Short conditioning intervals with scalable movements and simple rest.",
    thumbnail_url: "/pulse-assets/workout-cardio.jpg",
    equipment: "Bodyweight",
    goal_tags: ["lose_weight", "improve_fitness"],
  },
  {
    slug: "core-control-and-abs",
    title: "Core Control and Abs",
    category: "Core",
    muscle_group: "Core",
    difficulty: "Beginner",
    duration_minutes: 22,
    description: "A core session focused on bracing, balance, and clean movement.",
    thumbnail_url: "/pulse-assets/workout-yoga.jpg",
    equipment: "Bodyweight",
    goal_tags: ["improve_fitness", "maintain"],
  },
  {
    slug: "full-body-dumbbell-circuit",
    title: "Full Body Dumbbell Circuit",
    category: "Strength",
    muscle_group: "Full body",
    difficulty: "Intermediate",
    duration_minutes: 38,
    description: "A balanced circuit mixing legs, push, pull, and core without complicated setup.",
    thumbnail_url: "/pulse-assets/workout-strength.jpg",
    equipment: "Dumbbells",
    goal_tags: ["build_muscle", "lose_weight"],
  },
  {
    slug: "mobility-reset-flow",
    title: "Mobility Reset Flow",
    category: "Mobility",
    muscle_group: "Full body",
    difficulty: "Beginner",
    duration_minutes: 18,
    description: "A light recovery workout for hips, shoulders, back, and breathing.",
    thumbnail_url: "/pulse-assets/workout-stretch.jpg",
    equipment: "Bodyweight",
    goal_tags: ["maintain", "improve_fitness"],
  },
];

function normalizeLocalCatalogWorkout(row) {
  const workout = {
    id: `local-${row.slug}`,
    is_local_catalog: true,
    is_public: true,
    source: "local_catalog",
    workout_media: [],
    ...row,
  };
  workout.thumbnail_url = workoutThumbnailFor(workout, row.thumbnail_url);

  return withWorkoutSteps(workout, fallbackExercisesForWorkout(workout));
}

function localWorkoutById(workoutId) {
  const id = String(workoutId || "");
  if (!id.startsWith("local-")) return null;
  const slug = id.replace(/^local-/, "");
  const row = localWorkoutCatalog.find((item) => item.slug === slug);
  return row ? normalizeLocalCatalogWorkout(row) : null;
}

function extendWorkoutLibrary(workouts) {
  const existingSlugs = new Set(workouts.map((workout) => workout.slug).filter(Boolean));
  const localWorkouts = localWorkoutCatalog
    .filter((workout) => !existingSlugs.has(workout.slug))
    .map(normalizeLocalCatalogWorkout);

  return [...workouts, ...localWorkouts];
}

function normalizeWorkoutPreferenceRow(row) {
  return {
    ...row,
    is_favorite: true,
  };
}

function workoutSchemaError(error) {
  if (
    isMissingRelationError(error, "workout_steps") ||
    isMissingRelationError(error, "workout_media") ||
    isMissingRelationError(error, "favorite_workouts") ||
    isMissingRelationError(error, "completed_workouts")
  ) {
    return new Error(WORKOUT_SCHEMA_ERROR_MESSAGE);
  }

  return error;
}

function buildNutritionPlan(profile) {
  if (!profile) return null;
  const targets = calculateNutritionTargets(profile);
  return {
    id: "computed-nutrition-plan",
    ...targets,
    log_date: todayKey(),
    target_calories: targets.calories,
    target_protein_g: targets.protein_g,
    target_carbs_g: targets.carbs_g,
    target_fat_g: targets.fat_g,
    consumed_calories: 0,
    consumed_protein_g: 0,
    consumed_carbs_g: 0,
    consumed_fat_g: 0,
    water_ml: 0,
    water_target_ml: 2500,
    meals: generateMeals(profile, targets).map((meal, index) => ({
      id: `computed-meal-${index + 1}`,
      order_index: index + 1,
      ...meal,
    })),
  };
}

function normalizeNutritionPlanRow(row) {
  if (!row) return null;

  return {
    ...row,
    calories: row.target_calories ?? row.calories ?? 0,
    protein_g: row.target_protein_g ?? row.protein_g ?? 0,
    carbs_g: row.target_carbs_g ?? row.carbs_g ?? 0,
    fat_g: row.target_fat_g ?? row.fat_g ?? 0,
    consumed_calories: row.consumed_calories ?? row.calories ?? 0,
    consumed_protein_g: row.consumed_protein_g ?? row.protein_g ?? 0,
    consumed_carbs_g: row.consumed_carbs_g ?? row.carbs_g ?? 0,
    consumed_fat_g: row.consumed_fat_g ?? row.fat_g ?? 0,
    meals: [...(row.meals || [])].sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0),
    ),
  };
}

function estimateCalories(minutes, intensity = "moderate") {
  const mins = Number(minutes || 30);
  const multiplier = intensity === "hard" ? 9 : intensity === "easy" ? 5 : 7;
  return Math.max(40, Math.round(mins * multiplier));
}

async function refreshProgressSnapshot() {
  const client = requireSupabase();
  const { data: completed } = await client
    .from("completed_workouts")
    .select("completed_at, calories_burned")
    .order("completed_at", { ascending: false })
    .limit(60);
  const { data: goals } = await client
    .from("goals")
    .select("target_value,current_value,status")
    .eq("status", "active")
    .limit(6);

  const rows = completed || [];
  const dates = new Set(rows.map((row) => String(row.completed_at).slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 60; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekRows = rows.filter((row) => new Date(row.completed_at) >= weekStart);
  const workoutsCompleted = weekRows.length;
  const caloriesBurned = weekRows.reduce((sum, row) => sum + (Number(row.calories_burned) || 0), 0);
  const goalProgress = (goals || []).reduce((sum, goal) => {
    const target = Number(goal.target_value) || 0;
    const current = Number(goal.current_value) || 0;
    return sum + (target > 0 ? Math.min(100, (current / target) * 100) : 0);
  }, 0);
  const goalCount = goals?.length || 0;

  await client.from("progress_snapshots").upsert(
    {
      snapshot_date: todayKey(),
      calories_burned: caloriesBurned,
      workouts_completed: workoutsCompleted,
      streak_days: streak,
      goal_progress_percent: goalCount ? Math.round(goalProgress / goalCount) : Math.min(100, workoutsCompleted * 15),
      summary: {
        tip:
          workoutsCompleted >= 3
            ? "Great weekly rhythm. Protect recovery with one lighter mobility block."
            : "Book one short session today and keep the weekly chain alive.",
      },
    },
    { onConflict: "user_id,snapshot_date" },
  );
}

export function isProfileComplete(profile) {
  if (!profile) return false;

  const hasName = String(profile.name || "").trim().length >= 2;
  const requiredNumbers = [
    profile.age,
    profile.height_cm,
    profile.weight_kg,
    profile.workout_days_per_week,
  ];

  return (
    hasName &&
    requiredNumbers.every((value) => Number.isFinite(Number(value)) && Number(value) > 0) &&
    Boolean(profile.gender) &&
    Boolean(profile.goal) &&
    Boolean(profile.fitness_level)
  );
}

export async function getProfile() {
  const client = requireSupabase();
  const { data, error } = await client.from("profiles").select("*").maybeSingle();

  if (error) {
    if (isProfileNotFoundError(error)) return null;
    throwProfileError(error);
  }

  return data;
}

export async function ensureProfile(user, fallbackName = "") {
  const existingProfile = await getProfile();
  if (existingProfile) return existingProfile;

  const payload = {};
  const name = profileNameFromUser(typeof user === "string" ? null : user, fallbackName);
  if (name) payload.name = name;

  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return getProfile();
    throwProfileError(error);
  }

  if (!data) {
    throw new Error("Profili nuk u krijua. Kontrollo RLS policies per public.profiles.");
  }

  return data;
}

export async function saveProfile(_userId, formValues) {
  const client = requireSupabase();
  const payload = normalizeProfilePayload(formValues);
  const existingProfile = await getProfile();

  if (existingProfile?.id) {
    const { data, error } = await client
      .from("profiles")
      .update(payload)
      .eq("id", existingProfile.id)
      .select()
      .maybeSingle();

    if (error) throwProfileError(error);
    if (data) {
      await upsertFitnessPreferences(data);
      return data;
    }
  }

  const { data, error } = await client
    .from("profiles")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) throwProfileError(error);
  if (!data) throw new Error("Profili nuk u ruajt. Kontrollo RLS policies per public.profiles.");

  await upsertFitnessPreferences(data);
  return data;
}

async function upsertFitnessPreferences(profile) {
  const client = requireSupabase();
  const { data: existing } = await client
    .from("fitness_profiles")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    fitness_level: profile.fitness_level || "beginner",
    main_goal: profile.goal || "improve_fitness",
    weekly_workout_target: Number(profile.workout_days_per_week || 3),
    preferred_workout_days: profile.preferred_workout_days || [],
    equipment_available: profile.equipment_available || [],
    injuries_limitations: profile.injuries || "",
    coaching_style: "balanced",
  };

  if (existing?.id) {
    await client.from("fitness_profiles").update(payload).eq("id", existing.id);
    return;
  }
  await client.from("fitness_profiles").insert(payload);
}

export async function getWorkoutPlan() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("user_workout_plans")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data || [];
}

export async function getWorkoutLibrary() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workouts")
    .select(
      `
        *,
        workout_exercises(*, exercises(*))
      `,
    )
    .order("is_public", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw workoutSchemaError(error);
  return extendWorkoutLibrary((data || []).map(normalizeWorkoutLibraryRow));
}

export async function getUserWorkoutPreferences() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("favorite_workouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw workoutSchemaError(error);
  return (data || []).map(normalizeWorkoutPreferenceRow);
}

export async function saveWorkoutPreference(workoutId, values) {
  const client = requireSupabase();
  const existing = await client
    .from("favorite_workouts")
    .select("*")
    .eq("workout_id", workoutId)
    .maybeSingle();

  if (existing.error) throw workoutSchemaError(existing.error);

  const payload = {
    workout_id: workoutId,
    notes: values.notes || "",
  };

  if (!values.is_favorite && existing.data?.id) {
    const { error } = await client.from("favorite_workouts").delete().eq("id", existing.data.id);
    if (error) throw workoutSchemaError(error);
    return { ...existing.data, is_favorite: false };
  }

  const query = existing.data?.id
    ? client.from("favorite_workouts").update(payload).eq("id", existing.data.id)
    : client.from("favorite_workouts").insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw workoutSchemaError(error);
  return normalizeWorkoutPreferenceRow(data);
}

export async function getUserCompletedWorkouts() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("completed_workouts")
    .select("*")
    .order("completed_at", { ascending: false });

  if (error) throw workoutSchemaError(error);
  return data || [];
}

export async function completeLibraryWorkout(workout, values = {}) {
  const client = requireSupabase();
  const payload = {
    workout_id: workout?.id || values.workout_id || null,
    session_id: values.session_id || null,
    workout_title: (workout?.title || values.workout_title || "Workout").trim(),
    duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
    calories_burned:
      nullableNumber(values.calories_burned) ||
      estimateCalories(workout?.duration_minutes ?? values.duration_minutes, values.intensity),
    rating: nullableNumber(values.rating),
    notes: values.notes?.trim?.() || "",
    completed_at: values.completed_at || new Date().toISOString(),
  };

  const { data, error } = await client
    .from("completed_workouts")
    .insert(payload)
    .select()
    .single();

  if (error) throw workoutSchemaError(error);
  await refreshProgressSnapshot();

  return data;
}

export async function loadWorkoutModuleData() {
  const [workouts, preferences, completedWorkouts] = await Promise.all([
    getWorkoutLibrary(),
    getUserWorkoutPreferences(),
    getUserCompletedWorkouts(),
  ]);

  return {
    workouts,
    preferences,
    completedWorkouts,
  };
}

export async function createWorkout(values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workouts")
    .insert(normalizeWorkoutPayload(values))
    .select("*, exercises(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkout(workoutId) {
  const client = requireSupabase();
  const { error } = await client.from("workouts").delete().eq("id", workoutId);
  if (error) throw error;
}

export async function addExerciseToWorkout(workoutId, values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("exercises")
    .insert(normalizeExercisePayload(workoutId, values))
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExercise(exerciseId) {
  const client = requireSupabase();
  const { error } = await client.from("exercises").delete().eq("id", exerciseId);
  if (error) throw error;
}

export async function createWorkoutPlan(_userId, profile) {
  const response = await fetch("/api/workout-plan/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Could not generate workout plan.");
  }
  return data.sessions || [];
}

export async function getWorkoutLogs() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("completed_workouts")
    .select("*")
    .order("completed_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error, "completed_workouts")) return [];
    throw error;
  }

  return data || [];
}

export async function completeWorkout(_userId, workout, values = {}) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("completed_workouts")
    .insert(normalizeWorkoutLogPayload(workout, values))
    .select()
    .single();

  if (error) throw error;
  if (values.session_id) {
    await client
      .from("user_workout_sessions")
      .update({
        status: "completed",
        completed_at: data.completed_at,
        duration_minutes: data.duration_minutes,
        calories_burned: data.calories_burned,
      })
      .eq("id", values.session_id);
  }
  await refreshProgressSnapshot();
  return data;
}

export async function createNutritionPlan(_userId, profile) {
  const plan = buildNutritionPlan(profile);
  if (!plan) return null;

  const client = requireSupabase();
  const { meals, id: _id, calories, protein_g, carbs_g, fat_g, ...payload } = plan;
  void _id;

  const { data: savedPlan, error } = await client
    .from("nutrition_logs")
    .upsert(
      {
        ...payload,
        log_date: todayKey(),
        target_calories: calories,
        target_protein_g: protein_g,
        target_carbs_g: carbs_g,
        target_fat_g: fat_g,
        consumed_calories: 0,
        consumed_protein_g: 0,
        consumed_carbs_g: 0,
        consumed_fat_g: 0,
      },
      { onConflict: "user_id,log_date" },
    )
    .select()
    .single();

  if (error) {
    if (isMissingRelationError(error, "nutrition_logs")) return plan;
    throw error;
  }

  await client.from("meals").delete().eq("nutrition_log_id", savedPlan.id).eq("is_template", true);

  const mealRows = meals.map((meal, index) => ({
    nutrition_log_id: savedPlan.id,
    title: meal.title,
    description: meal.description,
    meal_type: ["breakfast", "lunch", "dinner"][index] || "meal",
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    order_index: index + 1,
    is_template: true,
  }));

  const { error: mealsError } = await client.from("meals").insert(mealRows);
  if (mealsError) {
    await client.from("nutrition_logs").delete().eq("id", savedPlan.id);
    if (isMissingRelationError(mealsError, "meals")) return plan;
    throw mealsError;
  }

  return {
    ...savedPlan,
    meals: mealRows.map((meal, index) => ({
      id: `${savedPlan.id}-meal-${index + 1}`,
      ...meal,
    })),
  };
}

export async function getLatestNutritionPlan() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("nutrition_logs")
    .select("*, meals(*)")
    .order("log_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error, "nutrition_logs")) {
      return buildNutritionPlan(await getProfile());
    }
    throw error;
  }

  if (data) {
    const { data: water } = await client
      .from("water_logs")
      .select("*")
      .eq("log_date", data.log_date)
      .maybeSingle();
    return normalizeNutritionPlanRow({
      ...data,
      water_ml: water?.amount_ml || 0,
      water_target_ml: water?.target_ml || 2500,
    });
  }
  return buildNutritionPlan(await getProfile());
}

export async function getNutritionLog(date = todayKey()) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("nutrition_logs")
    .select("*, meals(*)")
    .eq("log_date", date)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeNutritionPlanRow(data) : null;
}

export async function addMealLog(values, date = todayKey()) {
  const client = requireSupabase();
  let log = await getNutritionLog(date);
  if (!log) {
    log = await createNutritionPlan(null, await getProfile());
  }
  const mealPayload = {
    nutrition_log_id: log.id,
    title: values.title?.trim?.() || "Meal",
    description: values.description?.trim?.() || "",
    meal_type: values.meal_type || "meal",
    calories: nullableNumber(values.calories) || 0,
    protein_g: nullableNumber(values.protein_g) || 0,
    carbs_g: nullableNumber(values.carbs_g) || 0,
    fat_g: nullableNumber(values.fat_g) || 0,
    order_index: (log.meals?.length || 0) + 1,
  };
  const { error: mealError } = await client.from("meals").insert(mealPayload);
  if (mealError) throw mealError;

  const next = {
    consumed_calories: Number(log.consumed_calories || 0) + Number(mealPayload.calories || 0),
    consumed_protein_g: Number(log.consumed_protein_g || 0) + Number(mealPayload.protein_g || 0),
    consumed_carbs_g: Number(log.consumed_carbs_g || 0) + Number(mealPayload.carbs_g || 0),
    consumed_fat_g: Number(log.consumed_fat_g || 0) + Number(mealPayload.fat_g || 0),
  };
  const { data, error } = await client
    .from("nutrition_logs")
    .update(next)
    .eq("id", log.id)
    .select("*, meals(*)")
    .single();
  if (error) throw error;
  return normalizeNutritionPlanRow(data);
}

export async function addWaterLog(amountMl, date = todayKey()) {
  const client = requireSupabase();
  const existing = await client.from("water_logs").select("*").eq("log_date", date).maybeSingle();
  const current = Number(existing.data?.amount_ml || 0);
  const payload = {
    log_date: date,
    amount_ml: current + Number(amountMl || 0),
    target_ml: Number(existing.data?.target_ml || 2500),
  };
  const query = existing.data?.id
    ? client.from("water_logs").update(payload).eq("id", existing.data.id)
    : client.from("water_logs").insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function getProgressLogs() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("weight_logs")
    .select("*")
    .order("logged_at", { ascending: true });

  if (error) {
    if (isMissingRelationError(error, "weight_logs")) return getLegacyProgressLogs(client);
    throw error;
  }
  const rows = (data || []).map(normalizeProgressRow);
  if (rows.length) return rows;
  return getLegacyProgressLogs(client);
}

export async function addProgressLog(_userId, values) {
  const client = requireSupabase();
  const modern = await client
    .from("weight_logs")
    .insert(normalizeProgressPayload(values))
    .select()
    .single();

  let data = modern.data;
  let error = modern.error;

  if (error && isMissingColumnError(error)) {
    const legacy = await client
      .from("weight_logs")
      .insert(normalizeLegacyProgressPayload(values))
      .select()
      .single();
    data = legacy.data;
    error = legacy.error;
  }

  if (error && (isMissingRelationError(error, "weight_logs") || isMissingColumnError(error))) {
    const legacyProgress = await addLegacyProgressLog(client, values);
    await refreshProgressSnapshot();
    return legacyProgress;
  }

  if (error) throw error;
  await refreshProgressSnapshot();
  return normalizeProgressRow(data);
}

export async function getProgressSnapshots() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("progress_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: true })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function getGoals() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveGoal(_userId, values, goalId = null) {
  const client = requireSupabase();
  const payload = normalizeGoalPayload(values);
  const query = goalId
    ? client.from("goals").update(payload).eq("id", goalId)
    : client.from("goals").insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(_userId, goalId) {
  const client = requireSupabase();
  const { error } = await client.from("goals").delete().eq("id", goalId);
  if (error) throw error;
}

export async function updateGoalStatus(_userId, goalId, status) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("goals")
    .update({ status })
    .eq("id", goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getExerciseLibrary() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("exercises")
    .select("*")
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (error) {
    if (isMissingRelationError(error, "exercises")) return exerciseLibraryFallback;
    throw error;
  }

  return data || [];
}

export async function getWorkoutById(workoutId) {
  const localWorkout = localWorkoutById(workoutId);
  if (localWorkout) return localWorkout;

  const client = requireSupabase();
  const { data, error } = await client
    .from("workouts")
    .select(
      `
        *,
        workout_exercises(*, exercises(*))
      `,
    )
    .eq("id", workoutId)
    .maybeSingle();
  if (error) throw workoutSchemaError(error);
  if (!data) return null;

  const normalized = normalizeWorkoutLibraryRow(data);
  if (normalized.exercises?.length) return normalized;

  const { data: directExercises, error: directError } = await client
    .from("exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true });

  if (directError && !isMissingRelationError(directError, "exercises")) {
    throw directError;
  }

  const exercises =
    directExercises?.length ? directExercises : fallbackExercisesForWorkout(normalized);

  return withWorkoutSteps(normalized, exercises);
}

export async function getUpcomingWorkoutSessions() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("user_workout_sessions")
    .select("*, workouts(*)")
    .in("status", ["scheduled", "in_progress"])
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(12);
  if (error) throw error;
  return data || [];
}

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

export async function startWorkoutSession(workout, values = {}) {
  if (workout?.is_local_catalog) {
    return {
      id: null,
      workout_id: null,
      title: workout?.title || values.title || "Workout session",
      started_at: new Date().toISOString(),
      status: "in_progress",
      duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
      session_data: {
        workout,
        completedSets: [],
        skippedExercises: [],
      },
      is_local_session: true,
    };
  }

  const client = requireSupabase();
  const payload = {
    workout_id: workout?.id || values.workout_id || null,
    plan_id: values.plan_id || null,
    title: workout?.title || values.title || "Workout session",
    scheduled_for: values.scheduled_for || null,
    started_at: new Date().toISOString(),
    status: "in_progress",
    duration_minutes: nullableNumber(workout?.duration_minutes ?? values.duration_minutes),
    calories_burned: null,
    notes: "",
    session_data: {
      workout,
      completedSets: [],
      skippedExercises: [],
    },
  };
  const { data, error } = await client.from("user_workout_sessions").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function savePoseSession(values = {}) {
  const client = requireSupabase();
  const { data: session, error } = await client
    .from("pose_sessions")
    .insert({
      exercise_name: values.exercise_name || "Movement check",
      started_at: values.started_at || new Date().toISOString(),
      completed_at: values.completed_at || new Date().toISOString(),
      reps: Number(values.reps || 0),
      score: Number(values.score || 0),
      summary: values.summary || "Pose session saved.",
    })
    .select()
    .single();
  if (error) throw error;

  const cues = Array.isArray(values.cues) ? values.cues : [];
  if (cues.length) {
    await client.from("pose_feedback").insert(
      cues.map((cue, index) => ({
        pose_session_id: session.id,
        exercise_name: values.exercise_name || "Movement check",
        rep_index: index + 1,
        score: Number(values.score || 0),
        cue: String(cue),
        severity: String(cue).toLowerCase().includes("great") ? "positive" : "info",
      })),
    );
  }
  return session;
}

export async function getPoseHistory() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("pose_sessions")
    .select("*, pose_feedback(*)")
    .order("completed_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export { emptyUuid };
