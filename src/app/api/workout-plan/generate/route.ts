import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";

type ExercisePlan = {
  name: string;
  sets: number;
  reps: string;
  time_seconds?: number | null;
  rest_seconds: number;
  notes: string;
  muscle_group?: string;
  equipment?: string;
};

type DayPlan = {
  title: string;
  description: string;
  day_of_week: string;
  difficulty: string;
  duration_minutes: number;
  focus: string;
  exercises: ExercisePlan[];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const JS_DAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function cleanNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function dayKey(value: unknown) {
  return String(value || "").trim().slice(0, 3).toLowerCase();
}

function scheduleDates(now: Date, count: number, profile: Record<string, unknown>, plan: DayPlan[]) {
  const preferredDays = Array.isArray(profile.preferred_workout_days)
    ? profile.preferred_workout_days.map(dayKey)
    : [];
  const planDays = plan.map((day) => dayKey(day.day_of_week));
  const dayIndexes = [...preferredDays, ...planDays]
    .map((day) => JS_DAY_INDEX[day])
    .filter((day): day is number => Number.isInteger(day));

  if (!dayIndexes.length) {
    return Array.from({ length: count }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      return date;
    });
  }

  const wanted = new Set(dayIndexes);
  const dates: Date[] = [];
  const cursor = new Date(now);
  cursor.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  for (let guard = 0; dates.length < count && guard < 90; guard += 1) {
    if (wanted.has(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function fallbackPlan(profile: Record<string, unknown>): DayPlan[] {
  const goal = String(profile?.goal || "improve_fitness");
  const level = String(profile?.fitness_level || "beginner");
  const days = Math.min(6, Math.max(1, cleanNumber(profile?.workout_days_per_week, 3)));
  const duration = cleanNumber(profile?.workout_duration_minutes, level === "advanced" ? 55 : level === "intermediate" ? 45 : 32);
  const equipment = Array.isArray(profile?.equipment_available)
    ? profile.equipment_available.join(", ")
    : String(profile?.equipment_available || "Bodyweight");
  const strength = goal === "build_muscle";
  const loss = goal === "lose_weight";
  const hasDumbbells = equipment.toLowerCase().includes("dumbbell");
  const rowName = hasDumbbells ? "Dumbbell row" : "Towel row or band row";
  const squatName = hasDumbbells || strength ? "Goblet squat" : "Bodyweight squat";

  const templates: Array<{ focus: string; exercises: ExercisePlan[] }> = strength
    ? [
        {
          focus: "Squat strength",
          exercises: [
            {
              name: squatName,
              sets: level === "beginner" ? 3 : 4,
              reps: level === "advanced" ? "8-10" : "10-12",
              rest_seconds: 90,
              notes: "Keep your chest tall, sit hips back, and stand through the full foot.",
              muscle_group: "Legs",
              equipment,
            },
            {
              name: "Reverse lunge",
              sets: 3,
              reps: "8 each side",
              rest_seconds: 60,
              notes: "Step back softly, lower with control, then push through the front foot.",
              muscle_group: "Legs",
              equipment: "Bodyweight",
            },
            {
              name: "Romanian deadlift",
              sets: 3,
              reps: "10-12",
              rest_seconds: 75,
              notes: "Hinge at your hips and keep the weight close to your legs.",
              muscle_group: "Hamstrings",
              equipment,
            },
            {
              name: "Glute bridge",
              sets: 3,
              reps: "12-15",
              rest_seconds: 45,
              notes: "Pause at the top and squeeze your glutes without arching your back.",
              muscle_group: "Glutes",
              equipment: "Bodyweight",
            },
          ],
        },
        {
          focus: "Push strength",
          exercises: [
            {
              name: "Incline push-up",
              sets: 3,
              reps: level === "beginner" ? "6-10" : "10-15",
              rest_seconds: 60,
              notes: "Use a bench or wall if needed and keep a straight body line.",
              muscle_group: "Chest",
              equipment: "Bodyweight",
            },
            {
              name: "Dumbbell floor press",
              sets: 3,
              reps: "10-12",
              rest_seconds: 75,
              notes: "Press up smoothly and keep shoulders relaxed on the floor.",
              muscle_group: "Chest",
              equipment,
            },
            {
              name: "Shoulder press",
              sets: 3,
              reps: "8-12",
              rest_seconds: 60,
              notes: "Brace your core and press overhead without shrugging.",
              muscle_group: "Shoulders",
              equipment,
            },
            {
              name: "Plank shoulder tap",
              sets: 3,
              reps: "20 taps",
              time_seconds: 40,
              rest_seconds: 45,
              notes: "Move slowly and keep your hips as still as possible.",
              muscle_group: "Core",
              equipment: "Bodyweight",
            },
          ],
        },
        {
          focus: "Pull foundation",
          exercises: [
            {
              name: rowName,
              sets: 3,
              reps: "10-12 each side",
              rest_seconds: 60,
              notes: "Pull your elbow toward your hip and pause briefly at the top.",
              muscle_group: "Back",
              equipment,
            },
            {
              name: "Reverse fly",
              sets: 3,
              reps: "10-12",
              rest_seconds: 60,
              notes: "Use light weight and squeeze your shoulder blades together.",
              muscle_group: "Back",
              equipment,
            },
            {
              name: "Biceps curl",
              sets: 3,
              reps: "10-12",
              rest_seconds: 45,
              notes: "Keep elbows close and avoid swinging the weight.",
              muscle_group: "Arms",
              equipment,
            },
            {
              name: "Dead bug",
              sets: 3,
              reps: "8 each side",
              time_seconds: 40,
              rest_seconds: 45,
              notes: "Move opposite arm and leg while keeping your lower back steady.",
              muscle_group: "Core",
              equipment: "Bodyweight",
            },
          ],
        },
        {
          focus: "Full body volume",
          exercises: [
            {
              name: squatName,
              sets: 3,
              reps: "12 reps",
              rest_seconds: 60,
              notes: "Move smoothly and keep your knees tracking over your toes.",
              muscle_group: "Legs",
              equipment,
            },
            {
              name: "Push-up",
              sets: 3,
              reps: "8-12",
              rest_seconds: 60,
              notes: "Use an incline if form breaks and stop before shoulder pain.",
              muscle_group: "Chest",
              equipment: "Bodyweight",
            },
            {
              name: rowName,
              sets: 3,
              reps: "10-12 each side",
              rest_seconds: 60,
              notes: "Keep your torso steady and pull toward the hip.",
              muscle_group: "Back",
              equipment,
            },
            {
              name: "Side plank",
              sets: 2,
              reps: "25 sec each side",
              time_seconds: 35,
              rest_seconds: 45,
              notes: "Keep hips lifted and shoulders stacked.",
              muscle_group: "Core",
              equipment: "Bodyweight",
            },
          ],
        },
      ]
    : loss
      ? [
          {
            focus: "Low-impact conditioning",
            exercises: [
              {
                name: "Marching intervals",
                sets: 4,
                reps: "45 sec steady / 30 sec easy",
                time_seconds: 45,
                rest_seconds: 30,
                notes: "Stay tall and choose a pace where breathing stays controlled.",
                muscle_group: "Cardio",
                equipment: "Bodyweight",
              },
              {
                name: "Bodyweight squat",
                sets: 3,
                reps: "12 reps",
                rest_seconds: 45,
                notes: "Sit hips back and drive through your feet.",
                muscle_group: "Legs",
                equipment: "Bodyweight",
              },
              {
                name: "Step-up",
                sets: 3,
                reps: "8 each side",
                rest_seconds: 45,
                notes: "Use a stable step and place the whole foot down.",
                muscle_group: "Legs",
                equipment: "Bench",
              },
              {
                name: "Plank",
                sets: 2,
                reps: "30-45 sec",
                time_seconds: 40,
                rest_seconds: 45,
                notes: "Brace your core and breathe steadily.",
                muscle_group: "Core",
                equipment: "Bodyweight",
              },
            ],
          },
          {
            focus: "HIIT starter",
            exercises: [
              {
                name: "Jumping jacks",
                sets: 3,
                reps: "35 sec",
                time_seconds: 35,
                rest_seconds: 30,
                notes: "Land softly and keep a smooth rhythm.",
                muscle_group: "Cardio",
                equipment: "Bodyweight",
              },
              {
                name: "Mountain climber",
                sets: 3,
                reps: "30 sec",
                time_seconds: 30,
                rest_seconds: 45,
                notes: "Keep shoulders over wrists and move with control.",
                muscle_group: "Core",
                equipment: "Bodyweight",
              },
              {
                name: "Reverse lunge",
                sets: 3,
                reps: "8 each side",
                rest_seconds: 45,
                notes: "Step back softly and stand tall each rep.",
                muscle_group: "Legs",
                equipment: "Bodyweight",
              },
              {
                name: "High knees",
                sets: 3,
                reps: "25 sec",
                time_seconds: 25,
                rest_seconds: 40,
                notes: "Pick a low-impact march if jumping feels uncomfortable.",
                muscle_group: "Cardio",
                equipment: "Bodyweight",
              },
            ],
          },
          {
            focus: "Metabolic strength",
            exercises: [
              {
                name: "Bodyweight squat",
                sets: 3,
                reps: "12 reps",
                rest_seconds: 45,
                notes: "Keep chest tall and stand with control.",
                muscle_group: "Legs",
                equipment: "Bodyweight",
              },
              {
                name: "Push-up",
                sets: 3,
                reps: "6-10",
                rest_seconds: 60,
                notes: "Use an incline if needed and keep your body straight.",
                muscle_group: "Chest",
                equipment: "Bodyweight",
              },
              {
                name: rowName,
                sets: 3,
                reps: "10 each side",
                rest_seconds: 60,
                notes: "Pull toward the hip and lower slowly.",
                muscle_group: "Back",
                equipment,
              },
              {
                name: "Burpee",
                sets: 2,
                reps: "6-8",
                time_seconds: 35,
                rest_seconds: 60,
                notes: "Step back instead of jumping if that keeps form cleaner.",
                muscle_group: "Cardio",
                equipment: "Bodyweight",
              },
            ],
          },
        ]
      : [
          {
            focus: "Squat and core control",
            exercises: [
              {
                name: "Bodyweight squat",
                sets: 3,
                reps: "10-12",
                rest_seconds: 60,
                notes: "Sit hips back, keep chest tall, then stand strong.",
                muscle_group: "Legs",
                equipment: "Bodyweight",
              },
              {
                name: "Reverse lunge",
                sets: 3,
                reps: "8 each side",
                rest_seconds: 60,
                notes: "Lower with control and keep the front knee steady.",
                muscle_group: "Legs",
                equipment: "Bodyweight",
              },
              {
                name: "Plank",
                sets: 2,
                reps: "30-45 sec",
                time_seconds: 40,
                rest_seconds: 45,
                notes: "Keep ribs down and breathe steadily.",
                muscle_group: "Core",
                equipment: "Bodyweight",
              },
            ],
          },
          {
            focus: "Push and pull basics",
            exercises: [
              {
                name: "Push-up",
                sets: 3,
                reps: "6-12",
                rest_seconds: 60,
                notes: "Use an incline if needed and stop before form breaks.",
                muscle_group: "Chest",
                equipment: "Bodyweight",
              },
              {
                name: rowName,
                sets: 3,
                reps: "10-12 each side",
                rest_seconds: 60,
                notes: "Pull toward your hip and lower slowly.",
                muscle_group: "Back",
                equipment,
              },
              {
                name: "Dead bug",
                sets: 3,
                reps: "8 each side",
                time_seconds: 40,
                rest_seconds: 45,
                notes: "Move slowly and keep your lower back steady.",
                muscle_group: "Core",
                equipment: "Bodyweight",
              },
            ],
          },
          {
            focus: "Cardio stability",
            exercises: [
              {
                name: "Marching intervals",
                sets: 4,
                reps: "45 sec",
                time_seconds: 45,
                rest_seconds: 30,
                notes: "Stay tall and keep the pace comfortable.",
                muscle_group: "Cardio",
                equipment: "Bodyweight",
              },
              {
                name: "Mountain climber",
                sets: 3,
                reps: "30 sec",
                time_seconds: 30,
                rest_seconds: 45,
                notes: "Keep shoulders over wrists and move smoothly.",
                muscle_group: "Core",
                equipment: "Bodyweight",
              },
              {
                name: "Side plank",
                sets: 2,
                reps: "25 sec each side",
                time_seconds: 35,
                rest_seconds: 45,
                notes: "Keep hips lifted and shoulders stacked.",
                muscle_group: "Core",
                equipment: "Bodyweight",
              },
            ],
          },
        ];

  return Array.from({ length: days }).map((_, index) => {
    const template = templates[index % templates.length];

    return {
      title: `Day ${index + 1}: ${template.focus}`,
      description: `A ${duration}-minute ${level} session for ${goal.replace(/_/g, " ")} with a clear ${template.focus.toLowerCase()} focus. Warm up for 5 minutes and stop for sharp pain, dizziness, or chest symptoms.`,
      day_of_week: DAYS[index],
      difficulty: level === "advanced" ? "Advanced" : level === "intermediate" ? "Intermediate" : "Beginner",
      duration_minutes: duration,
      focus: template.focus,
      exercises: template.exercises,
    };
  });
}

function extractJson(text: string): DayPlan[] | null {
  try {
    return JSON.parse(text) as DayPlan[];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as DayPlan[];
    } catch {
      return null;
    }
  }
}

function isColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || "");
  return (
    (error as { code?: string })?.code === "PGRST204" ||
    message.toLowerCase().includes("schema cache") ||
    message.toLowerCase().includes("column")
  );
}

function primaryMuscleGroup(day: DayPlan) {
  const groups = (day.exercises || [])
    .map((exercise) => exercise.muscle_group)
    .filter((group): group is string => Boolean(group));
  return groups[0] || day.focus || "Full body";
}

async function insertWorkout(supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>, userId: string, day: DayPlan, profile: Record<string, unknown>) {
  const fullPayload = {
    user_id: userId,
    title: day.title,
    description: day.description,
    category: day.focus || "AI Plan",
    muscle_group: primaryMuscleGroup(day),
    difficulty: day.difficulty,
    duration_minutes: cleanNumber(day.duration_minutes, 35),
    equipment: Array.from(new Set(day.exercises?.map((e) => e.equipment).filter(Boolean))).join(", ") || "Bodyweight",
    is_public: false,
    source: "ai_generated",
    goal_tags: [String(profile.goal || profile.main_goal || "improve_fitness")],
  };

  const first = await supabase.from("workouts").insert(fullPayload).select().single();
  if (!first.error) return first;
  if (!isColumnError(first.error)) return first;

  return supabase
    .from("workouts")
    .insert({
      user_id: userId,
      title: day.title,
      description: day.description,
      difficulty: day.difficulty,
      duration_minutes: cleanNumber(day.duration_minutes, 35),
    })
    .select()
    .single();
}

async function insertPlan(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>,
  userId: string,
  profile: Record<string, unknown>,
  plan: DayPlan[],
  now: Date,
  end: Date,
) {
  const fullPayload = {
    user_id: userId,
    title: "AI 4-week coaching block",
    description: "Generated from your profile, constraints, equipment, and recent training history.",
    goal: String(profile.goal || profile.main_goal || "improve_fitness"),
    difficulty: String(profile.fitness_level || "beginner"),
    start_date: now.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    status: "active",
    plan_data: { source: "ai", generated_at: now.toISOString(), days: plan },
  };

  const first = await supabase.from("user_workout_plans").insert(fullPayload).select().single();
  if (!first.error) return first;
  if (!isColumnError(first.error)) return first;

  const minimalPayload = {
    user_id: userId,
    title: "AI 4-week coaching block",
    description: "Generated from your profile and recent training history.",
    status: "active",
  };
  const second = await supabase.from("user_workout_plans").insert(minimalPayload).select().single();
  if (!second.error) return second;
  if (!isColumnError(second.error)) return second;

  return supabase
    .from("user_workout_plans")
    .insert({
      user_id: userId,
      title: "AI 4-week coaching block",
    })
    .select()
    .single();
}

async function insertWorkoutSteps(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>,
  userId: string,
  workoutId: string,
  day: DayPlan,
) {
  const rows = (day.exercises || []).map((exercise, order) => ({
    user_id: userId,
    workout_id: workoutId,
    exercise_name: exercise.name,
    sets: cleanNumber(exercise.sets, 3),
    reps: exercise.reps || "8-12",
    time_seconds: exercise.time_seconds ?? null,
    rest_seconds: cleanNumber(exercise.rest_seconds, 60),
    notes: exercise.notes,
    order_index: order + 1,
  }));

  if (!rows.length) return { inserted: 0, error: null as string | null };

  const first = await supabase.from("workout_exercises").insert(rows);
  if (!first.error) return { inserted: rows.length, error: null };

  if (isColumnError(first.error)) {
    const minimalRows = rows.map(({ workout_id, exercise_name, sets, reps, rest_seconds, notes, order_index }) => ({
      workout_id,
      exercise_name,
      sets,
      reps,
      rest_seconds,
      notes,
      order_index,
    }));
    const retry = await supabase.from("workout_exercises").insert(minimalRows);
    if (!retry.error) return { inserted: minimalRows.length, error: null };
    return { inserted: 0, error: retry.error.message };
  }

  return { inserted: 0, error: first.error.message };
}

async function generateWithOpenAI(profile: Record<string, unknown>, history: unknown[]) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_WORKOUT_MODEL || "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: 1800,
    messages: [
      {
        role: "system",
        content:
          "You are a certified-style fitness programming assistant. Return only valid JSON: an array of workout days. Avoid medical advice; for pain/injury risk, add conservative notes and suggest a professional. Each day must include title, description, day_of_week, difficulty, duration_minutes, focus, exercises[]. Each exercise needs name, sets, reps, rest_seconds, notes, muscle_group, equipment.",
      },
      {
        role: "user",
        content: JSON.stringify({
          profile,
          recent_completed_workouts: history,
          requirements: {
            realistic_progression: true,
            beginner_friendly_language: true,
            no_medical_diagnosis: true,
          },
        }),
      },
    ],
  });
  const text = completion.choices[0]?.message?.content || "";
  return extractJson(text);
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { profile?: Record<string, unknown> };
    const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    const { data: fitnessRow } = await supabase
      .from("fitness_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const profile = { ...(profileRow || {}), ...(fitnessRow || {}), ...(body.profile || {}) };
    const { data: history } = await supabase
      .from("completed_workouts")
      .select("workout_title,duration_minutes,calories_burned,rating,completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(12);

    let plan = await generateWithOpenAI(profile, history || []).catch(() => null);
    if (!Array.isArray(plan) || plan.length === 0) {
      plan = fallbackPlan(profile);
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 27);

    await supabase
      .from("user_workout_plans")
      .update({ status: "archived" })
      .eq("user_id", user.id)
      .eq("status", "active");

    const { data: savedPlan, error: planError } = await insertPlan(supabase, user.id, profile, plan, now, end);

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    const sessions = [];
    const workouts = [];
    const warnings: string[] = [];
    const plannedDates = scheduleDates(now, plan.length, profile, plan);
    for (let index = 0; index < plan.length; index += 1) {
      const day = plan[index];
      const scheduled = plannedDates[index] || new Date(now);

      const { data: workout, error: workoutError } = await insertWorkout(supabase, user.id, day, profile);

      if (workoutError || !workout) {
        warnings.push(`Workout "${day.title}" could not be saved: ${workoutError?.message || "Unknown error"}`);
        continue;
      }

      workouts.push(workout);
      const stepResult = await insertWorkoutSteps(supabase, user.id, workout.id, day);
      if (stepResult.error) warnings.push(`Exercises for "${day.title}" could not be linked: ${stepResult.error}`);

      const { data: session } = await supabase
        .from("user_workout_sessions")
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          plan_id: savedPlan.id,
          title: day.title,
          scheduled_for: scheduled.toISOString(),
          status: "scheduled",
          duration_minutes: cleanNumber(day.duration_minutes, 35),
          session_data: day,
        })
        .select()
        .single();
      if (session) sessions.push(session);
    }

    if (!workouts.length) {
      return NextResponse.json(
        {
          error: warnings[0] || "The plan was generated but no workouts could be saved.",
          warnings,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ plan: savedPlan, sessions, workouts, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
