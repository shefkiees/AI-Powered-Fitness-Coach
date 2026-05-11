import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import {
  createFitnessAiClient,
  getCompletionTokenOptions,
  getFitnessAiProvider,
} from "@/lib/aiProvider";
import { enforceAiRateLimit, strictBackendFallbackResponse } from "@/lib/aiRouteGuards";
import { cleanNumber, cleanText, parseJsonObject, stringList } from "@/lib/coachAiUtils";

type PoseSummary = {
  headline: string;
  summary: string;
  focus_next: string;
  cues: string[];
};

const DEFAULT_SUMMARY: PoseSummary = {
  headline: "Form session saved.",
  summary: "Use the latest cues to keep reps smooth before adding speed or load.",
  focus_next: "Tempo and control",
  cues: ["Keep the full body in frame.", "Move slowly enough to keep position clean."],
};

function localSummary(input: Record<string, unknown>, previousScore: number | null): PoseSummary {
  const score = cleanNumber(input.score);
  const reps = cleanNumber(input.reps);
  const durationSeconds = cleanNumber(input.duration_seconds);
  const durationText = durationSeconds > 0 ? ` in ${Math.round(durationSeconds)} seconds` : "";
  const delta = previousScore !== null ? Math.round(score - previousScore) : null;
  const cues = Array.isArray(input.cues) ? input.cues.map((cue) => cleanText(cue, "", 120)).filter(Boolean) : [];

  return {
    headline:
      delta !== null && delta > 0
        ? `Form improved by ${delta} points.`
        : score >= 85
          ? "Strong form quality."
          : "Good check-in. Keep technique simple.",
    summary:
      delta !== null
        ? `${reps} reps logged${durationText} with a ${score}/100 score. Compared with your last session, the trend changed by ${delta} points.`
        : `${reps} reps logged${durationText} with a ${score}/100 score.`,
    focus_next: score >= 85 ? "Keep the same tempo next time" : "Slow down and repeat the main cue",
    cues: cues.length ? cues.slice(0, 3) : DEFAULT_SUMMARY.cues,
  };
}

function normalizeSummary(raw: Record<string, unknown>, fallback: PoseSummary): PoseSummary {
  return {
    headline: cleanText(raw.headline, fallback.headline, 100),
    summary: cleanText(raw.summary, fallback.summary, 220),
    focus_next: cleanText(raw.focus_next, fallback.focus_next, 120),
    cues: stringList(raw.cues, fallback.cues),
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
      routeKey: "api-coach-pose-summary",
      userId: user.id,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const exerciseName = cleanText(body.exercise_name, "Movement check", 80);
    const exerciseType = cleanText(body.exercise_type || body.movement, "general", 60);
    const score = cleanNumber(body.score);
    const reps = cleanNumber(body.reps);
    const durationSeconds = cleanNumber(body.duration_seconds);
    const cues = Array.isArray(body.cues)
      ? body.cues.slice(0, 5).map((cue: unknown) => cleanText(cue, "", 120))
      : [];

    const { data: previous } = await supabase
      .from("pose_sessions")
      .select("score,summary,completed_at")
      .eq("user_id", user.id)
      .eq("exercise_name", exerciseName)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const context = {
      exercise_name: exerciseName,
      exercise_type: exerciseType,
      reps,
      score,
      duration_seconds: durationSeconds,
      cues,
      previous_score: previous?.score ?? null,
      previous_summary: previous?.summary ?? null,
    };
    const previousScore = previous?.score !== undefined && previous?.score !== null ? cleanNumber(previous.score) : null;
    const fallback = localSummary(context, previousScore);
    const provider = getFitnessAiProvider("chat");

    if (!provider) {
      const strictResponse = strictBackendFallbackResponse(
        "STRICT_BACKEND_MODE is enabled, so pose summaries require a live AI provider.",
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
              "You summarize pose/form check data for a fitness app. Return only JSON with keys headline, summary, focus_next, cues. Do not diagnose injuries or give medical advice.",
          },
          {
            role: "user",
            content: JSON.stringify({ context }),
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
        "STRICT_BACKEND_MODE is enabled, so pose summaries cannot fall back to local output.",
      );
      if (strictResponse) return strictResponse;
      return NextResponse.json({
        summary: fallback,
        source: "local",
        warning: error instanceof Error ? error.message : "AI pose summary failed.",
      });
    }
  } catch (error) {
    console.error("[api/coach/pose-summary]", error);
    return NextResponse.json({ error: "Could not summarize pose session." }, { status: 500 });
  }
}
