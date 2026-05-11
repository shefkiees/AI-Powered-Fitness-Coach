import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import {
  createFitnessAiClient,
  getCompletionTokenOptions,
  getFitnessAiProvider,
} from "@/lib/aiProvider";
import { enforceAiRateLimit, strictBackendFallbackResponse } from "@/lib/aiRouteGuards";
import { cleanNumber, cleanText, isoDateDaysAgo, parseJsonObject, stringList } from "@/lib/coachAiUtils";

type AdaptivePlan = {
  headline: string;
  adjustment: "deload" | "progress" | "maintain";
  reason: string;
  next_session_focus: string;
  changes: string[];
};

const DEFAULT_PLAN: AdaptivePlan = {
  headline: "Next workout adjusted.",
  adjustment: "maintain",
  reason: "Keep the next session steady and use your rating to guide progression.",
  next_session_focus: "Clean form and steady effort",
  changes: ["Keep the same planned session.", "Stop before form breaks.", "Log rating and notes again."],
};

function localAdaptive(context: Record<string, unknown>): AdaptivePlan {
  const rating = cleanNumber(context.last_rating, 4);
  const skipped = cleanNumber(context.skipped_recent);
  const notes = cleanText(context.last_notes, "", 160).toLowerCase();

  if (skipped >= 2 || rating <= 2 || notes.includes("hard") || notes.includes("difficult")) {
    return {
      headline: "Make the next session lighter.",
      adjustment: "deload",
      reason: "Recent feedback suggests the plan needs a lower-friction next step.",
      next_session_focus: "Shorter session, cleaner reps",
      changes: ["Reduce total sets by 1 per exercise.", "Use easier variations.", "Keep the session 15-25% shorter."],
    };
  }

  if (rating >= 5 && skipped === 0) {
    return {
      headline: "You can progress carefully.",
      adjustment: "progress",
      reason: "The last workout rating was strong and recent skips are low.",
      next_session_focus: "Small overload",
      changes: ["Add 1-2 reps per set or 5 seconds per timed set.", "Keep rest the same.", "Do not increase every exercise at once."],
    };
  }

  return {
    ...DEFAULT_PLAN,
    headline: "Keep the next session steady.",
    reason: "Your latest feedback supports consistency before changing intensity.",
  };
}

function normalizePlan(raw: Record<string, unknown>, fallback: AdaptivePlan): AdaptivePlan {
  const adjustment = String(raw.adjustment || fallback.adjustment);
  return {
    headline: cleanText(raw.headline, fallback.headline, 100),
    adjustment: ["deload", "progress", "maintain"].includes(adjustment)
      ? (adjustment as AdaptivePlan["adjustment"])
      : fallback.adjustment,
    reason: cleanText(raw.reason, fallback.reason, 220),
    next_session_focus: cleanText(raw.next_session_focus, fallback.next_session_focus, 120),
    changes: stringList(raw.changes, fallback.changes),
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
      routeKey: "api-coach-adaptive-plan",
      userId: user.id,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const completedWorkoutId = cleanText(body.completed_workout_id, "", 80);

    const [profileRes, lastWorkoutRes, skippedRes, nextSessionRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("goal,fitness_level,workout_days_per_week,equipment_available,injuries")
        .eq("id", user.id)
        .maybeSingle(),
      completedWorkoutId
        ? supabase
            .from("completed_workouts")
            .select("id,workout_title,duration_minutes,calories_burned,rating,notes,completed_at")
            .eq("user_id", user.id)
            .eq("id", completedWorkoutId)
            .maybeSingle()
        : supabase
            .from("completed_workouts")
            .select("id,workout_title,duration_minutes,calories_burned,rating,notes,completed_at")
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
      supabase
        .from("user_workout_sessions")
        .select("id,title,status,scheduled_for,duration_minutes,session_data")
        .eq("user_id", user.id)
        .eq("status", "skipped")
        .gte("scheduled_for", isoDateDaysAgo(14))
        .limit(10),
      supabase
        .from("user_workout_sessions")
        .select("id,title,status,scheduled_for,duration_minutes,session_data")
        .eq("user_id", user.id)
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_for", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const context = {
      profile: profileRes.data || {},
      last_workout: lastWorkoutRes.data || {},
      last_rating: lastWorkoutRes.data?.rating ?? null,
      last_notes: lastWorkoutRes.data?.notes || "",
      skipped_recent: skippedRes.data?.length || 0,
      next_session: nextSessionRes.data || null,
    };
    const fallback = localAdaptive(context);
    const provider = getFitnessAiProvider("chat");
    let plan = fallback;
    let source = "local";
    let model: string | undefined;

    if (provider) {
      try {
        const client = createFitnessAiClient(provider);
        const completion = await client.chat.completions.create({
          model: provider.model,
          ...getCompletionTokenOptions(provider, 500),
          response_format: { type: "json_object" },
          temperature: 0.25,
          messages: [
            {
              role: "system",
              content:
                "You adapt the next workout after a finished session. Return only JSON with keys headline, adjustment, reason, next_session_focus, changes. adjustment must be deload, progress, or maintain. Do not give medical advice.",
            },
            {
              role: "user",
              content: JSON.stringify({ context }),
            },
          ],
        });
        const raw = parseJsonObject(completion.choices[0]?.message?.content || "{}", fallback as unknown as Record<string, unknown>);
        plan = normalizePlan(raw, fallback);
        source = provider.name;
        model = provider.model;
      } catch {
        const strictResponse = strictBackendFallbackResponse(
          "STRICT_BACKEND_MODE is enabled, so adaptive planning cannot fall back to local output.",
        );
        if (strictResponse) return strictResponse;
        plan = fallback;
      }
    } else {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so adaptive planning requires a live AI provider.",
      );
      if (strictResponse) return strictResponse;
    }

    if (nextSessionRes.data?.id) {
      const currentData =
        typeof nextSessionRes.data.session_data === "object" && nextSessionRes.data.session_data
          ? (nextSessionRes.data.session_data as Record<string, unknown>)
          : {};
      await supabase
        .from("user_workout_sessions")
        .update({
          session_data: {
            ...currentData,
            ai_adaptation: {
              ...plan,
              generated_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", nextSessionRes.data.id)
        .eq("user_id", user.id);
    }

    await supabase.from("ai_coach_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: `${plan.headline}\n${plan.next_session_focus}`,
      category: "adaptive_plan",
      metadata: {
        source: "adaptive_plan",
        provider: source,
        model,
        completed_workout_id: lastWorkoutRes.data?.id || null,
        next_session_id: nextSessionRes.data?.id || null,
      },
    });

    return NextResponse.json({
      adaptation: plan,
      next_session_id: nextSessionRes.data?.id || null,
      source,
      model,
    });
  } catch (error) {
    console.error("[api/coach/adaptive-plan]", error);
    return NextResponse.json({ error: "Could not adapt the next workout." }, { status: 500 });
  }
}
