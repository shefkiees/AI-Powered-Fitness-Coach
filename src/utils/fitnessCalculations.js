const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const exercisePools = {
  lose_weight: [
    ["Incline walk intervals", "3", "8 min", 60, "Keep a pace where talking is possible but effort is clear."],
    ["Goblet squat", "3", "12 reps", 75, "Sit hips back and keep chest tall."],
    ["Push-up", "3", "8-12 reps", 60, "Use knees or an incline if needed."],
    ["Dumbbell row", "3", "12 reps each side", 60, "Pull elbow toward your hip."],
    ["Plank", "3", "30-45 sec", 45, "Keep ribs down and breathe steadily."],
  ],
  build_muscle: [
    ["Squat", "4", "6-10 reps", 120, "Use a load you can control with good depth."],
    ["Bench press or push-up", "4", "6-10 reps", 120, "Press smoothly and keep shoulders stable."],
    ["Romanian deadlift", "3", "8-10 reps", 120, "Hinge from hips and keep back neutral."],
    ["Lat pulldown or row", "4", "8-12 reps", 90, "Lead with elbows and pause at the squeeze."],
    ["Shoulder press", "3", "8-10 reps", 90, "Brace core before each press."],
  ],
  maintain: [
    ["Bodyweight squat", "3", "10-12 reps", 75, "Move smoothly through the full range."],
    ["Reverse lunge", "3", "10 reps each side", 75, "Keep front foot planted."],
    ["Dumbbell press", "3", "10 reps", 75, "Press without shrugging shoulders."],
    ["Cable or band row", "3", "12 reps", 75, "Pause briefly at the back."],
    ["Dead bug", "3", "8 reps each side", 45, "Move slowly and keep lower back steady."],
  ],
  improve_fitness: [
    ["Jumping jacks", "3", "45 sec", 45, "Use step jacks for lower impact."],
    ["Kettlebell deadlift", "3", "12 reps", 75, "Push floor away and stand tall."],
    ["Mountain climber", "3", "30 sec", 45, "Keep shoulders over wrists."],
    ["Step-up", "3", "10 reps each side", 60, "Drive through the full foot."],
    ["Side plank", "3", "25 sec each side", 45, "Keep hips lifted and neck relaxed."],
  ],
};

const levelAdjustments = {
  beginner: { duration: 32, difficulty: "Beginner", extra: "Focus on steady technique and full rest." },
  intermediate: { duration: 45, difficulty: "Intermediate", extra: "Add load when the last reps stay controlled." },
  advanced: { duration: 58, difficulty: "Advanced", extra: "Push intensity while keeping clean form." },
};

const mealTemplates = {
  standard: [
    ["Protein oats", "Oats with Greek yogurt, berries, and chia seeds."],
    ["Chicken power bowl", "Chicken, rice, roasted vegetables, and avocado."],
    ["Salmon dinner", "Salmon with potatoes and a green salad."],
  ],
  vegetarian: [
    ["Tofu scramble", "Tofu, spinach, tomatoes, and whole-grain toast."],
    ["Lentil bowl", "Lentils, quinoa, vegetables, and tahini sauce."],
    ["Greek yogurt plate", "Greek yogurt, fruit, nuts, and honey."],
  ],
  vegan: [
    ["Overnight oats", "Oats, soy milk, banana, peanut butter, and seeds."],
    ["Chickpea bowl", "Chickpeas, rice, vegetables, and lemon tahini."],
    ["Tofu stir fry", "Tofu, noodles, broccoli, peppers, and edamame."],
  ],
  pescatarian: [
    ["Egg toast", "Eggs, avocado, and whole-grain toast."],
    ["Tuna rice bowl", "Tuna, rice, cucumber, greens, and olive oil dressing."],
    ["Shrimp pasta", "Shrimp, pasta, tomato sauce, and vegetables."],
  ],
};

export function calculateNutritionTargets(profile) {
  const weight = Number(profile?.weight_kg || 75);
  const height = Number(profile?.height_cm || 175);
  const age = Number(profile?.age || 30);
  const gender = profile?.gender;
  const days = Number(profile?.workout_days_per_week || 3);

  const base =
    gender === "female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

  const activityMultiplier = days >= 5 ? 1.55 : days >= 3 ? 1.4 : 1.28;
  let calories = Math.round(base * activityMultiplier);

  if (profile?.goal === "lose_weight") calories -= 350;
  if (profile?.goal === "build_muscle") calories += 250;
  if (profile?.goal === "improve_fitness") calories += 100;

  calories = Math.max(1400, Math.round(calories / 25) * 25);

  const proteinRatio = profile?.goal === "build_muscle" ? 2.0 : 1.7;
  const protein_g = Math.round(weight * proteinRatio);
  const fat_g = Math.round((calories * 0.25) / 9);
  const carbs_g = Math.max(80, Math.round((calories - protein_g * 4 - fat_g * 9) / 4));

  return {
    calories,
    protein_g,
    carbs_g,
    fat_g,
    notes:
      "Estimated daily targets based on your profile. Adjust with your real progress and energy levels.",
  };
}

export function generateMeals(profile, targets) {
  const preference = String(profile?.dietary_preference || "standard").toLowerCase();
  const template =
    mealTemplates[preference] ||
    (preference.includes("vegan")
      ? mealTemplates.vegan
      : preference.includes("vegetarian")
        ? mealTemplates.vegetarian
        : mealTemplates.standard);

  const splits = [0.28, 0.38, 0.34];

  return template.map(([title, description], index) => ({
    title,
    description,
    calories: Math.round(targets.calories * splits[index]),
    protein_g: Math.round(targets.protein_g * splits[index]),
    carbs_g: Math.round(targets.carbs_g * splits[index]),
    fat_g: Math.round(targets.fat_g * splits[index]),
  }));
}

export function generateWorkoutPlan(profile) {
  const goal = profile?.goal || "improve_fitness";
  const level = profile?.fitness_level || "beginner";
  const days = Math.min(Math.max(Number(profile?.workout_days_per_week || 3), 1), 6);
  const pool = exercisePools[goal] || exercisePools.improve_fitness;
  const adjustment = levelAdjustments[level] || levelAdjustments.beginner;

  return Array.from({ length: days }).map((_, index) => {
    const rotation = pool.slice(index).concat(pool.slice(0, index));
    const exercises = rotation.slice(0, level === "beginner" ? 4 : 5).map((entry, orderIndex) => ({
      name: entry[0],
      sets: Number(entry[1]),
      reps: entry[2],
      rest_seconds: entry[3],
      notes: entry[4],
      order_index: orderIndex + 1,
    }));

    const focus =
      goal === "build_muscle"
        ? index % 2 === 0
          ? "Strength focus"
          : "Hypertrophy focus"
        : goal === "lose_weight"
          ? index % 2 === 0
            ? "Conditioning focus"
            : "Full-body burn"
          : goal === "maintain"
            ? "Balanced full-body"
            : "Performance circuit";

    return {
      title: `Day ${index + 1}: ${focus}`,
      description: `${adjustment.extra} Warm up for 5 minutes before starting and cool down after the session.`,
      day_of_week: dayNames[index],
      difficulty: adjustment.difficulty,
      duration_minutes: adjustment.duration + index * 3,
      exercises,
    };
  });
}

