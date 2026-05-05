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

function cleanNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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

  return Array.from({ length: days }).map((_, index) => {
    const focus = strength
      ? index % 2 === 0
        ? "Strength foundation"
        : "Hypertrophy volume"
      : loss
        ? index % 2 === 0
          ? "Metabolic strength"
          : "Low-impact conditioning"
        : "Hybrid performance";

    const exercises: ExercisePlan[] = [
      {
        name: strength ? "Goblet squat" : "Bodyweight squat",
        sets: level === "beginner" ? 3 : 4,
        reps: level === "advanced" ? "8-10" : "10-12",
        rest_seconds: strength ? 90 : 60,
        notes: "Keep ribs stacked over hips and move with control.",
        muscle_group: "Legs",
        equipment,
      },
      {
        name: "Push-up",
        sets: 3,
        reps: level === "beginner" ? "6-10" : "10-15",
        rest_seconds: 60,
        notes: "Use an incline if form breaks. Stop before shoulder pain.",
        muscle_group: "Chest",
        equipment: "Bodyweight",
      },
      {
        name: equipment.toLowerCase().includes("dumbbell") ? "Dumbbell row" : "Towel row or band row",
        sets: 3,
        reps: "10-12 each side",
        rest_seconds: 60,
        notes: "Pull elbows toward hips and pause briefly.",
        muscle_group: "Back",
        equipment,
      },
      {
        name: loss ? "Marching intervals" : "Plank",
        sets: 3,
        reps: loss ? "45 sec steady / 30 sec easy" : "30-45 sec",
        time_seconds: loss ? 45 : 40,
        rest_seconds: 45,
        notes: loss ? "Choose low impact if joints feel irritated." : "Breathe steadily and keep hips level.",
        muscle_group: "Core",
        equipment: "Bodyweight",
      },
    ];

    return {
      title: `Day ${index + 1}: ${focus}`,
      description: `A ${duration}-minute ${level} session built around ${goal.replace(/_/g, " ")}. Warm up for 5 minutes and stop for sharp pain, dizziness, or chest symptoms.`,
      day_of_week: DAYS[index],
      difficulty: level === "advanced" ? "Advanced" : level === "intermediate" ? "Intermediate" : "Beginner",
      duration_minutes: duration,
      focus,
      exercises,
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

async function insertWorkout(supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>, userId: string, day: DayPlan, profile: Record<string, unknown>) {
  const fullPayload = {
    user_id: userId,
    title: day.title,
    description: day.description,
    day_of_week: day.day_of_week || null,
    category: day.focus || "AI Plan",
    muscle_group: "Full body",
    difficulty: day.difficulty,
    duration_minutes: cleanNumber(day.duration_minutes, 35),
    equipment: day.exercises?.map((e) => e.equipment).filter(Boolean).join(", ") || "Bodyweight",
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
      day_of_week: day.day_of_week || null,
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
    for (let index = 0; index < plan.length; index += 1) {
      const day = plan[index];
      const scheduled = new Date(now);
      scheduled.setDate(now.getDate() + index);

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
