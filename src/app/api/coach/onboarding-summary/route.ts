import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import {
  createFitnessAiClient,
  getCompletionTokenOptions,
  getFitnessAiProvider,
} from "@/lib/aiProvider";
import { enforceAiRateLimit, strictBackendFallbackResponse } from "@/lib/aiRouteGuards";
import { cleanText, parseJsonObject, stringList } from "@/lib/coachAiUtils";

type OnboardingSummary = {
  headline: string;
  summary: string;
  starting_strategy: string[];
  first_week_focus: string;
};

function localSummary(payload: Record<string, unknown>): OnboardingSummary {
  const goal = cleanText(payload.fitnessGoal, "fitness").replace(/_/g, " ");
  const level = cleanText(payload.fitnessLevel, "beginner").replace(/_/g, " ");
  const days = payload.workoutDaysPerWeek || 3;
  const equipment = Array.isArray(payload.equipment) && payload.equipment.length ? payload.equipment.join(", ") : "bodyweight";

  return {
    headline: "Your profile is ready for coaching.",
    summary: `You are starting as ${level}, focused on ${goal}, with ${days} training days per week and ${equipment}.`,
    starting_strategy: [
      "Use full-body workouts first so every session has value.",
      "Keep the first week comfortable enough to repeat.",
      "Log rating and notes so the coach can adapt the next plan.",
    ],
    first_week_focus: "Finish the first two sessions with clean form and steady energy.",
  };
}

function normalizeSummary(raw: Record<string, unknown>, fallback: OnboardingSummary): OnboardingSummary {
  return {
    headline: cleanText(raw.headline, fallback.headline, 100),
    summary: cleanText(raw.summary, fallback.summary, 260),
    starting_strategy: stringList(raw.starting_strategy, fallback.starting_strategy),
    first_week_focus: cleanText(raw.first_week_focus, fallback.first_week_focus, 140),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      const rateLimitResponse = await enforceAiRateLimit({
        supabase,
        routeKey: "api-coach-onboarding-summary",
        userId: user.id,
      });
      if (rateLimitResponse) return rateLimitResponse;
    }

    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fallback = localSummary(payload);
    const provider = getFitnessAiProvider("chat");

    if (!provider) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so onboarding summaries require a live AI provider.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({ summary: fallback, source: "local" });
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
              "You summarize a fitness onboarding form. Return only JSON with keys headline, summary, starting_strategy, first_week_focus. Keep it simple, motivating, and non-medical.",
          },
          {
            role: "user",
            content: JSON.stringify({ profile: payload }),
          },
        ],
      });
      const raw = parseJsonObject(completion.choices[0]?.message?.content || "{}", fallback as unknown as Record<string, unknown>);
      return NextResponse.json({
        summary: normalizeSummary(raw, fallback),
        source: provider.name,
        model: provider.model,
      });
    } catch (error) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so onboarding summaries cannot fall back to local output.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({
        summary: fallback,
        source: "local",
        warning: error instanceof Error ? error.message : "AI onboarding summary failed.",
      });
    }
  } catch (error) {
    console.error("[api/coach/onboarding-summary]", error);
    return NextResponse.json({ error: "Could not create onboarding summary." }, { status: 500 });
  }
}
