import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import {
  createFitnessAiClient,
  getCompletionTokenOptions,
  getFitnessAiProvider,
} from "@/lib/aiProvider";
import { enforceAiRateLimit, strictBackendFallbackResponse } from "@/lib/aiRouteGuards";
import { cleanNumber, cleanText, parseJsonObject } from "@/lib/coachAiUtils";

type Substitution = {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
  why: string;
  safety_note: string;
};

const DEFAULT_SUBSTITUTION: Substitution = {
  name: "Bodyweight squat to chair",
  sets: 3,
  reps: "8-10",
  rest_seconds: 60,
  notes: "Sit back to a stable chair, stand through the full foot, and keep the reps smooth.",
  why: "It keeps the same lower-body pattern while reducing load and complexity.",
  safety_note: "Stop for sharp pain, dizziness, or instability.",
};

function localSubstitution(exerciseName: string, reason: string): Substitution {
  const text = `${exerciseName} ${reason}`.toLowerCase();
  if (text.includes("dumbbell") || text.includes("equipment") || text.includes("pajis")) {
    return {
      name: "Bodyweight tempo squat",
      sets: 3,
      reps: "10-12",
      rest_seconds: 60,
      notes: "Lower for 3 seconds, pause briefly, then stand tall with control.",
      why: "It removes equipment while keeping useful leg strength work.",
      safety_note: DEFAULT_SUBSTITUTION.safety_note,
    };
  }
  if (text.includes("knee") || text.includes("gjuri") || text.includes("gju")) {
    return {
      name: "Glute bridge",
      sets: 3,
      reps: "12-15",
      rest_seconds: 45,
      notes: "Lie on your back, press through heels, and pause at the top without arching your back.",
      why: "It trains hips and glutes with less knee bend than many squat or lunge patterns.",
      safety_note: "Use this only if it feels comfortable; stop for sharp pain and consider a professional for persistent pain.",
    };
  }
  if (text.includes("easy") || text.includes("leht") || text.includes("hard") || text.includes("vesht")) {
    return {
      name: "Incline push-up",
      sets: 2,
      reps: "6-10",
      rest_seconds: 60,
      notes: "Use a wall, bench, or table. Keep a straight body line and stop before form breaks.",
      why: "The incline makes the movement easier while keeping the same push pattern.",
      safety_note: DEFAULT_SUBSTITUTION.safety_note,
    };
  }
  return DEFAULT_SUBSTITUTION;
}

function normalizeSubstitution(raw: Record<string, unknown>, fallback: Substitution): Substitution {
  return {
    name: cleanText(raw.name, fallback.name, 80),
    sets: Math.max(1, Math.min(6, Math.round(cleanNumber(raw.sets, fallback.sets)))),
    reps: cleanText(raw.reps, fallback.reps, 40),
    rest_seconds: Math.max(15, Math.min(180, Math.round(cleanNumber(raw.rest_seconds, fallback.rest_seconds)))),
    notes: cleanText(raw.notes, fallback.notes, 220),
    why: cleanText(raw.why, fallback.why, 220),
    safety_note: cleanText(raw.safety_note, fallback.safety_note, 180),
  };
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

    const rateLimitResponse = await enforceAiRateLimit({
      supabase,
      routeKey: "api-coach-exercise-substitution",
      userId: user.id,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const exercise = typeof body.exercise === "object" && body.exercise ? body.exercise : {};
    const workout = typeof body.workout === "object" && body.workout ? body.workout : {};
    const reason = cleanText(body.reason, "Need a safer or simpler alternative.", 240);
    const exerciseName = cleanText((exercise as Record<string, unknown>).name, "Current exercise", 80);
    const fallback = localSubstitution(exerciseName, reason);
    const provider = getFitnessAiProvider("chat");

    const { data: profile } = await supabase
      .from("profiles")
      .select("goal,fitness_level,equipment_available,injuries,age")
      .eq("id", user.id)
      .maybeSingle();

    if (!provider) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so exercise substitution requires a live AI provider.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({ substitution: fallback, source: "local" });
    }

    try {
      const client = createFitnessAiClient(provider);
      const completion = await client.chat.completions.create({
        model: provider.model,
        ...getCompletionTokenOptions(provider, 450),
        response_format: { type: "json_object" },
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content:
              "You are a careful fitness coach. Return only JSON with keys name, sets, reps, rest_seconds, notes, why, safety_note. Give a safe exercise alternative, not medical advice.",
          },
          {
            role: "user",
            content: JSON.stringify({
              current_exercise: {
                name: exerciseName,
                sets: (exercise as Record<string, unknown>).sets,
                reps: (exercise as Record<string, unknown>).reps,
                notes: cleanText((exercise as Record<string, unknown>).notes, "", 180),
              },
              workout: {
                title: cleanText((workout as Record<string, unknown>).title, "", 100),
                category: cleanText((workout as Record<string, unknown>).category, "", 80),
              },
              user_profile: profile || {},
              reason,
            }),
          },
        ],
      });
      const raw = parseJsonObject(completion.choices[0]?.message?.content || "{}", fallback as unknown as Record<string, unknown>);
      return NextResponse.json({
        substitution: normalizeSubstitution(raw, fallback),
        source: provider.name,
        model: provider.model,
      });
    } catch (error) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so exercise substitution cannot fall back to local output.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({
        substitution: fallback,
        source: "local",
        warning: error instanceof Error ? error.message : "AI substitution failed.",
      });
    }
  } catch (error) {
    console.error("[api/coach/exercise-substitution]", error);
    return NextResponse.json({ error: "Could not suggest an exercise substitution." }, { status: 500 });
  }
}
