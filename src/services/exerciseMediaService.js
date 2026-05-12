import { WORKOUT_SCHEMA_ERROR_MESSAGE, normalizeText } from "@/src/services/serviceShared";

export const exerciseLibraryFallback = [
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
  burpee: "https://www.youtube.com/watch?v=TU8QYVW0gDU",
  "high knees": "https://www.youtube.com/watch?v=oDdkytliOqE",
  "shoulder press": "https://www.youtube.com/watch?v=B-aVuyhvLHU",
  "lateral raise": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  "front raise": "https://www.youtube.com/watch?v=-t7fuZ0KhDA",
  "reverse lunge": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
  "step-up": "https://www.youtube.com/watch?v=dQqApCGd5Ss",
  "glute bridge": "https://www.youtube.com/watch?v=wPM8icPu6H8",
  "romanian deadlift": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
};

const exerciseThumbnailRules = [
  { match: ["goblet squat", "bodyweight squat", "squat", "reverse lunge", "lunge", "step-up", "step up"], url: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=1200&q=80" },
  { match: ["romanian deadlift", "deadlift", "glute bridge", "glute", "hamstring"], url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80" },
  { match: ["push-up", "push up", "floor press", "chest press", "triceps dip", "dip", "chest"], url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80" },
  { match: ["dumbbell row", "row", "reverse fly", "lat pulldown", "biceps curl", "curl", "back", "pull"], url: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80" },
  { match: ["shoulder press", "lateral raise", "front raise", "shoulder", "deltoid"], url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" },
  { match: ["plank", "side plank", "dead bug", "bird dog", "bicycle crunch", "core", "abs", "stability"], url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80" },
  { match: ["marching", "mountain climber", "jumping jack", "jumping jacks", "burpee", "high knees", "hiit", "cardio", "conditioning"], url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80" },
  { match: ["mobility", "stretch", "recovery", "yoga"], url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80" },
  { match: ["boxing"], url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80" },
];

const representativeExerciseRules = [
  { workoutMatch: ["pull", "back", "biceps"], exerciseMatch: ["row", "pulldown", "fly", "curl"] },
  { workoutMatch: ["push", "chest", "triceps"], exerciseMatch: ["push", "press", "dip"] },
  { workoutMatch: ["shoulder", "deltoid", "posture"], exerciseMatch: ["shoulder", "raise", "press", "fly"] },
  { workoutMatch: ["leg", "lower", "glute", "squat"], exerciseMatch: ["squat", "lunge", "deadlift", "step", "glute"] },
  { workoutMatch: ["core", "abs", "stability"], exerciseMatch: ["plank", "bug", "dog", "crunch"] },
  { workoutMatch: ["cardio", "hiit", "conditioning", "metabolic", "fat"], exerciseMatch: ["marching", "mountain", "jumping", "burpee", "knees"] },
];

const workoutThumbnailRules = [
  { match: ["back", "pull", "biceps", "row"], url: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80" },
  { match: ["chest", "push", "upper body"], url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80" },
  { match: ["shoulder", "deltoid"], url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" },
  { match: ["leg", "lower", "glute"], url: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=1200&q=80" },
  { match: ["hiit", "fat", "cardio", "conditioning"], url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80" },
  { match: ["core", "abs", "stability"], url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80" },
  { match: ["mobility", "stretch", "recovery", "yoga"], url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80" },
  { match: ["boxing"], url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80" },
];

const localWorkoutMediaBySlug = {
  "full-body-starter-strength": "/workouts/strength-foundation/cover.jpg",
  "upper-body-strength-builder": "/workouts/upper-body-push/cover.jpg",
  "upper-body-push-basics": "/workouts/upper-body-push/cover.jpg",
  "back-and-biceps-foundation": "/workouts/strength-foundation/cover.jpg",
  "lower-body-leg-day": "/workouts/lower-body-leg-day/cover.jpg",
  "shoulder-shape-and-posture": "/workouts/shoulder-posture/cover.jpg",
  "hiit-fat-burn-starter": "/workouts/hiit-fat-burn/cover.jpg",
  "low-impact-cardio-burn": "/workouts/hiit-fat-burn/cover.jpg",
  "core-control-and-abs": "/workouts/core-control/cover.jpg",
  "core-stability-flow": "/workouts/core-control/cover.jpg",
  "full-body-dumbbell-circuit": "/workouts/full-body-dumbbell/cover.jpg",
  "mobility-reset-flow": "/workouts/mobility-reset/cover.jpg",
  "mobility-recovery-stretch": "/workouts/mobility-reset/cover.jpg",
  "boxing-conditioning-rounds": "/workouts/boxing-conditioning/cover.jpg",
};

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

const localWorkoutCatalog = [
  { slug: "upper-body-strength-builder", title: "Upper Body Strength Builder", category: "Strength", muscle_group: "Chest", difficulty: "Beginner", duration_minutes: 26, description: "Beginner-friendly push training for chest, shoulders, arms, and core control.", thumbnail_url: localWorkoutMediaBySlug["upper-body-strength-builder"], equipment: "Bodyweight, Dumbbells", goal_tags: ["build_muscle", "improve_fitness"] },
  { slug: "back-and-biceps-foundation", title: "Back and Biceps Foundation", category: "Strength", muscle_group: "Back", difficulty: "Beginner", duration_minutes: 30, description: "A clear pull-day session with rows, rear-delts, arms, and a core finisher.", thumbnail_url: localWorkoutMediaBySlug["back-and-biceps-foundation"], equipment: "Dumbbells", goal_tags: ["build_muscle", "improve_fitness"] },
  { slug: "lower-body-leg-day", title: "Lower Body Leg Day", category: "Strength", muscle_group: "Legs", difficulty: "Beginner", duration_minutes: 34, description: "Simple lower-body work for quads, glutes, hamstrings, and balance.", thumbnail_url: localWorkoutMediaBySlug["lower-body-leg-day"], equipment: "Bodyweight, Dumbbells", goal_tags: ["build_muscle", "lose_weight"] },
  { slug: "shoulder-shape-and-posture", title: "Shoulder Shape and Posture", category: "Strength", muscle_group: "Shoulders", difficulty: "Beginner", duration_minutes: 24, description: "Shoulder volume with controlled presses, raises, and upper-back support.", thumbnail_url: localWorkoutMediaBySlug["shoulder-shape-and-posture"], equipment: "Dumbbells", goal_tags: ["build_muscle", "maintain"] },
  { slug: "hiit-fat-burn-starter", title: "HIIT Fat Burn Starter", category: "Cardio", muscle_group: "Full body", difficulty: "Beginner", duration_minutes: 20, description: "Short conditioning intervals with scalable movements and simple rest.", thumbnail_url: localWorkoutMediaBySlug["hiit-fat-burn-starter"], equipment: "Bodyweight", goal_tags: ["lose_weight", "improve_fitness"] },
  { slug: "core-control-and-abs", title: "Core Control and Abs", category: "Core", muscle_group: "Core", difficulty: "Beginner", duration_minutes: 22, description: "A core session focused on bracing, balance, and clean movement.", thumbnail_url: localWorkoutMediaBySlug["core-control-and-abs"], equipment: "Bodyweight", goal_tags: ["improve_fitness", "maintain"] },
  { slug: "full-body-dumbbell-circuit", title: "Full Body Dumbbell Circuit", category: "Strength", muscle_group: "Full body", difficulty: "Intermediate", duration_minutes: 38, description: "A balanced circuit mixing legs, push, pull, and core without complicated setup.", thumbnail_url: localWorkoutMediaBySlug["full-body-dumbbell-circuit"], equipment: "Dumbbells", goal_tags: ["build_muscle", "lose_weight"] },
  { slug: "mobility-reset-flow", title: "Mobility Reset Flow", category: "Mobility", muscle_group: "Full body", difficulty: "Beginner", duration_minutes: 18, description: "A light recovery workout for hips, shoulders, back, and breathing.", thumbnail_url: localWorkoutMediaBySlug["mobility-reset-flow"], equipment: "Bodyweight", goal_tags: ["maintain", "improve_fitness"] },
];

export function fallbackVideoForExercise(name) {
  return fallbackExerciseVideos[normalizeText(name)] || null;
}

export function exerciseImageFor(name, workout = null) {
  const text = normalizeText(`${name || ""} ${workout?.title || ""} ${workout?.category || ""} ${workout?.muscle_group || ""}`);
  const hit = exerciseThumbnailRules.find((rule) => rule.match.some((word) => text.includes(word)));
  return hit?.url || null;
}

export function withExerciseMedia(exercise, workout = null) {
  const name = exercise?.name || exercise?.exercise_name || "";
  const imageUrl = exercise?.image_url || exercise?.imageUrl || exerciseImageFor(name, workout);
  const videoUrl = exercise?.video_url || exercise?.videoUrl || fallbackVideoForExercise(name);
  const instructions = exercise?.instructions || exercise?.notes || "";
  return {
    ...exercise,
    image_url: imageUrl,
    imageUrl,
    video_url: videoUrl,
    videoUrl,
    restSeconds: exercise?.restSeconds ?? exercise?.rest_seconds ?? null,
    instructions,
    targetMuscles: exercise?.targetMuscles || exercise?.muscle_group || workout?.muscle_group || "Full body",
  };
}

function dayNumberFromTitle(title) {
  const match = String(title || "").match(/day\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function representativeExerciseForWorkout(workout, exercises = []) {
  const list = exercises.filter(Boolean);
  if (!list.length) return null;
  const workoutText = normalizeText(`${workout?.slug || ""} ${workout?.title || ""} ${workout?.category || ""} ${workout?.muscle_group || ""}`);

  for (const rule of representativeExerciseRules) {
    if (!rule.workoutMatch.some((word) => workoutText.includes(word))) continue;
    const hit = list.find((exercise) => {
      const exerciseText = normalizeText(`${exercise?.name || ""} ${exercise?.muscle_group || ""}`);
      return rule.exerciseMatch.some((word) => exerciseText.includes(word));
    });
    if (hit) return hit;
  }

  const dayNumber = dayNumberFromTitle(workout?.title);
  if (dayNumber > 0 && list.length > 1) return list[(dayNumber - 1) % list.length];
  return list[0];
}

function shouldLeadWithRepresentativeExercise(workout, exercises = []) {
  if (exercises.length < 2) return false;
  const source = normalizeText(workout?.source);
  const title = normalizeText(workout?.title);
  const category = normalizeText(workout?.category);
  const isGeneratedDay = source === "ai_generated" && dayNumberFromTitle(title) > 0;
  const isGenericGeneratedFocus = ["strength foundation", "hypertrophy volume", "hybrid performance", "metabolic strength", "low-impact conditioning"].some((value) => title.includes(value) || category.includes(value));
  return isGeneratedDay && isGenericGeneratedFocus;
}

function orderExercisesForWorkout(workout, exercises = []) {
  const list = [...exercises];
  if (!shouldLeadWithRepresentativeExercise(workout, list)) return list;
  const lead = representativeExerciseForWorkout(workout, list);
  const leadIndex = list.findIndex((exercise) => exercise?.id === lead?.id && exercise?.name === lead?.name);
  if (leadIndex <= 0) return list;
  return [list[leadIndex], ...list.slice(0, leadIndex), ...list.slice(leadIndex + 1)];
}

function workoutThumbnailFor(workout, fallback = null, exercises = []) {
  const current = String(fallback || "");
  const isGenericLocal =
    !current ||
    current.includes("/pulse-assets/workout-strength.jpg") ||
    current.includes("/pulse-assets/workout-cardio.jpg") ||
    current.includes("/pulse-assets/workout-yoga.jpg") ||
    current.includes("/pulse-assets/workout-stretch.jpg");

  if (!workout?.is_local_catalog && !workout?.slug?.includes?.("starter") && !isGenericLocal) return fallback;

  const representativeExercise = shouldLeadWithRepresentativeExercise(workout, exercises)
    ? exercises[0]
    : representativeExerciseForWorkout(workout, exercises);
  const exerciseImage = representativeExercise
    ? exerciseImageFor(representativeExercise.name, {
        ...workout,
        title: representativeExercise.name,
        muscle_group: representativeExercise.muscle_group || workout?.muscle_group,
      })
    : null;

  if (exerciseImage) return exerciseImage;
  const text = normalizeText(`${workout?.slug || ""} ${workout?.title || ""} ${workout?.category || ""} ${workout?.muscle_group || ""}`);
  const hit = workoutThumbnailRules.find((rule) => rule.match.some((word) => text.includes(word)));
  return hit?.url || fallback || "/pulse-assets/workout-strength.jpg";
}

export function fallbackExercisesForWorkout(workout) {
  const haystack = normalizeText(`${workout.title} ${workout.category} ${workout.muscle_group}`);
  const key =
    (haystack.includes("shoulder") || haystack.includes("deltoid") ? "shoulders" : "") ||
    (haystack.includes("leg") || haystack.includes("lower") ? "legs" : "") ||
    (haystack.includes("hiit") || haystack.includes("fat") ? "cardio" : "") ||
    (haystack.includes("pull") ? "back" : "") ||
    Object.keys(fallbackExercisesByCategory).find((item) => haystack.includes(item)) ||
    "strength";

  return fallbackExercisesByCategory[key].map(([name, sets, reps, time_seconds, rest_seconds, notes], index) => {
    const imageUrl = exerciseImageFor(name, workout);
    const videoUrl = fallbackVideoForExercise(name);
    return {
      id: `${workout.id || workout.slug || "workout"}-fallback-${index + 1}`,
      name,
      sets,
      reps,
      time_seconds,
      rest_seconds,
      restSeconds: rest_seconds,
      notes,
      instructions: notes,
      order_index: index + 1,
      muscle_group: workout.muscle_group || "Full body",
      targetMuscles: workout.muscle_group || "Full body",
      equipment: workout.equipment || "Bodyweight",
      image_url: imageUrl,
      imageUrl,
      video_url: videoUrl,
      videoUrl,
      fallback: true,
    };
  });
}

export function withWorkoutSteps(workout, exercises) {
  return {
    ...workout,
    exercises,
    workout_steps: exercises.map((exercise, index) => ({
      id: exercise.id,
      title: exercise.name,
      description: [exercise.sets ? `${exercise.sets} sets` : "", exercise.reps || "", exercise.notes || exercise.instructions || ""].filter(Boolean).join(" - "),
      duration_seconds: exercise.rest_seconds || null,
      order_index: exercise.order_index || index + 1,
    })),
  };
}

function normalizeLocalCatalogWorkout(row) {
  const coverImage = localWorkoutMediaBySlug[row.slug] || row.cover_image || row.thumbnail_url;
  const workout = {
    id: `local-${row.slug}`,
    is_local_catalog: true,
    is_public: true,
    source: "local_catalog",
    workout_media: coverImage
      ? [{
          id: `local-${row.slug}-cover`,
          media_type: "image",
          media_url: coverImage,
          thumbnail_url: coverImage,
          alt_text: row.title,
          is_primary: true,
          order_index: 1,
        }]
      : [],
    cover_image: coverImage,
    coverImage,
    thumbnailUrl: coverImage,
    preview_video_url: row.preview_video_url || null,
    previewVideoUrl: row.preview_video_url || null,
    ...row,
  };
  const exercises = fallbackExercisesForWorkout(workout);
  workout.thumbnail_url = workoutThumbnailFor(workout, row.thumbnail_url, exercises);
  workout.thumbnailUrl = workout.thumbnail_url;
  workout.cover_image = workout.cover_image || workout.thumbnail_url;
  workout.coverImage = workout.cover_image;
  return withWorkoutSteps(workout, exercises);
}

export function localWorkoutById(workoutId) {
  const id = String(workoutId || "");
  if (!id.startsWith("local-")) return null;
  const slug = id.replace(/^local-/, "");
  const row = localWorkoutCatalog.find((item) => item.slug === slug);
  return row ? normalizeLocalCatalogWorkout(row) : null;
}

export function extendWorkoutLibrary(workouts) {
  const existingSlugs = new Set(workouts.map((workout) => workout.slug).filter(Boolean));
  const localWorkouts = localWorkoutCatalog.filter((workout) => !existingSlugs.has(workout.slug)).map(normalizeLocalCatalogWorkout);
  return [...workouts, ...localWorkouts];
}

export function normalizeWorkoutPreferenceRow(row) {
  return {
    ...row,
    is_favorite: true,
  };
}

export function normalizeWorkoutLibraryRow(row) {
  const media = [...(row.workout_media || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const slugCover = localWorkoutMediaBySlug[row.slug] || null;
  const linkedExercises = [...(row.workout_exercises || [])]
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map((item, index) => {
      const name = item.exercise_name || item.exercises?.name || "Exercise";
      return withExerciseMedia(
        {
          id: item.exercise_id || item.id,
          name,
          sets: item.sets,
          reps: item.reps,
          time_seconds: item.time_seconds,
          rest_seconds: item.rest_seconds,
          notes: item.notes || item.exercises?.instructions || item.exercises?.description || "",
          order_index: item.order_index || index + 1,
          muscle_group: item.exercises?.muscle_group || row.muscle_group,
          equipment: item.exercises?.equipment || row.equipment,
          image_url: item.image_url || item.exercises?.image_url || null,
          video_url: item.video_url || item.exercises?.video_url || null,
        },
        row,
      );
    });
  const directExercises = [...(row.exercises || [])]
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map((exercise, index) => withExerciseMedia({ ...exercise, order_index: exercise.order_index || index + 1 }, row));
  const exercises = orderExercisesForWorkout(row, linkedExercises.length ? linkedExercises : directExercises);
  const primaryMedia = media.find((item) => item.is_primary) || media[0] || null;
  const thumbnail = row.thumbnail_url || slugCover || primaryMedia?.thumbnail_url || (primaryMedia?.media_type === "image" ? primaryMedia.media_url : null);
  const coverImage = row.cover_image || slugCover || thumbnail;
  const previewVideoUrl =
    row.preview_video_url ||
    row.video_url ||
    (primaryMedia?.media_type === "video" ? primaryMedia.media_url : null);
  const normalizedThumbnail = workoutThumbnailFor(row, thumbnail, exercises);

  return {
    ...row,
    category: row.category || (row.user_id ? "Plan" : "General"),
    muscle_group: row.muscle_group || "Full body",
    difficulty: row.difficulty || "Beginner",
    duration_minutes: row.duration_minutes || null,
    thumbnail_url: normalizedThumbnail,
    thumbnailUrl: normalizedThumbnail,
    cover_image: coverImage || normalizedThumbnail,
    coverImage: coverImage || normalizedThumbnail,
    preview_video_url: previewVideoUrl,
    previewVideoUrl,
    goal_tags: Array.isArray(row.goal_tags) ? row.goal_tags : [],
    workout_media: media,
    workout_steps: exercises.map((exercise, index) => ({
      id: exercise.id,
      title: exercise.name,
      description: [exercise.sets ? `${exercise.sets} sets` : "", exercise.reps || "", exercise.notes || ""].filter(Boolean).join(" - "),
      duration_seconds: exercise.rest_seconds || null,
      order_index: exercise.order_index || index + 1,
    })),
    exercises,
  };
}

export { WORKOUT_SCHEMA_ERROR_MESSAGE };
