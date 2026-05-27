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

type ExerciseTotalInput = {
  label?: unknown;
  reps?: unknown;
  duration_seconds?: unknown;
  hold_seconds?: unknown;
  average_form_score?: unknown;
  issues?: unknown;
};

const DEFAULT_SUMMARY: PoseSummary = {
  headline: "Form session saved.",
  summary: "Use the latest cues to keep reps smooth before adding speed or load.",
  focus_next: "Tempo and control",
  cues: ["Keep the full body in frame.", "Move slowly enough to keep position clean."],
};

const ISSUE_LABELS: Record<string, string> = {
  "visibility ankles": "Keep ankles visible so stance and depth can be checked.",
  "visibility knees": "Keep knees visible through the full rep.",
  "visibility hips": "Keep hips in frame for better posture feedback.",
  "visibility shoulders": "Keep shoulders in frame and square to the camera.",
  "visibility elbows": "Keep elbows visible during arm movements.",
  "visibility wrists": "Keep wrists visible so reps count cleanly.",
  "lateral raise short range": "Raise arms closer to shoulder height before lowering.",
  "front raise short range": "Lift arms through the full front-raise range.",
  "squat knee cave": "Push knees out so they track over your toes.",
  "squat partial depth": "Sit lower and finish the full squat depth.",
  "deadlift short hinge": "Hinge hips farther back before standing tall.",
  "pushup shallow depth": "Lower with more control before pressing up.",
  "biceps curl short range": "Fully extend and curl through a complete range.",
  "russian twist short range": "Rotate farther to each side before switching.",
};

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function humanizeIssue(issue: string) {
  const normalized = issue.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return "";
  return ISSUE_LABELS[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDurationText(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  if (minutes <= 0) return `${seconds} seconds`;
  if (seconds === 0) return `${minutes} minutes`;
  return `${minutes} min ${seconds} sec`;
}

function issueList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => objectRecord(item))
    .map((item) => ({
      issue: humanizeIssue(cleanText(item.issue, "", 120)),
      count: cleanNumber(item.count),
    }))
    .filter((item) => item.issue)
    .slice(0, 8);
}

function summarizeTotals(totals: Record<string, unknown>) {
  return Object.entries(totals)
    .map(([exercise, raw]) => {
      const total = objectRecord(raw) as ExerciseTotalInput;
      const label = cleanText(total.label, exercise.replace(/_/g, " "), 60);
      const reps = cleanNumber(total.reps);
      const holdSeconds = cleanNumber(total.hold_seconds);
      const durationSeconds = cleanNumber(total.duration_seconds);
      const score = cleanNumber(total.average_form_score);
      const issues = issueList(total.issues);
      return {
        exercise,
        label,
        reps,
        hold_seconds: holdSeconds,
        duration_seconds: durationSeconds,
        average_form_score: score,
        issues,
      };
    })
    .filter((total) => total.reps > 0 || total.hold_seconds > 0 || total.duration_seconds > 0);
}

function totalsSentence(totals: ReturnType<typeof summarizeTotals>, fallbackReps: number) {
  const parts = totals.flatMap((total) => {
    if (total.exercise === "plank" && total.hold_seconds > 0) {
      return [`${Math.round(total.hold_seconds)} seconds of plank`];
    }
    if (total.reps > 0) return [`${total.reps} ${total.label}${total.reps === 1 ? "" : "s"}`];
    return [];
  });
  if (parts.length) return parts.join(" and ");
  return `${fallbackReps} reps`;
}

function localSummary(input: Record<string, unknown>, previousScore: number | null): PoseSummary {
  const score = cleanNumber(input.average_form_score ?? input.score);
  const reps = cleanNumber(input.reps);
  const durationSeconds = cleanNumber(input.duration_seconds);
  const durationText = durationSeconds > 0 ? ` in ${formatDurationText(durationSeconds)}` : "";
  const delta = previousScore !== null ? Math.round(score - previousScore) : null;
  const cues = Array.isArray(input.cues) ? input.cues.map((cue) => cleanText(cue, "", 120)).filter(Boolean) : [];
  const totals = summarizeTotals(objectRecord(input.exercise_totals));
  const issues = issueList(input.detected_issues);
  const completed = totalsSentence(totals, reps);
  const issueText = issues.length
    ? ` Main issue: ${issues[0].issue}.`
    : " No repeated form issue stood out.";

  return {
    headline:
      delta !== null && delta > 0
        ? `Form improved by ${delta} points.`
        : score >= 85
          ? "Strong automatic workout session."
          : "Automatic workout session saved.",
    summary:
      delta !== null
        ? `You completed ${completed}${durationText} with a ${score}/100 average form score. Compared with your last session, the trend changed by ${delta} points.${issueText}`
        : `You completed ${completed}${durationText} with a ${score}/100 average form score.${issueText}`,
    focus_next: issues[0]?.issue || (score >= 85 ? "Keep the same tempo next time" : "Slow down and finish each range of motion"),
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
    const exerciseName = cleanText(body.exercise_name, "AI Gym Tracker", 80);
    const exerciseType = cleanText(body.exercise_type || body.movement, "general", 60);
    const score = cleanNumber(body.average_form_score ?? body.score);
    const reps = cleanNumber(body.reps);
    const durationSeconds = cleanNumber(body.duration_seconds);
    const exerciseTotals = objectRecord(body.exercise_totals);
    const detectedIssues = issueList(body.detected_issues);
    const movementDurations = objectRecord(body.movement_durations);
    const bestReps = objectRecord(body.best_reps);
    const worstReps = objectRecord(body.worst_reps);
    const cues = Array.isArray(body.cues)
      ? body.cues.slice(0, 8).map((cue: unknown) => cleanText(cue, "", 140))
      : [];

    const { data: previous } = await supabase
      .from("pose_sessions")
      .select("score,average_form_score,summary,completed_at")
      .eq("user_id", user.id)
      .eq("exercise_name", exerciseName)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const context = {
      exercise_name: exerciseName,
      exercise_type: exerciseType,
      detected_exercises: Array.isArray(body.detected_exercises)
        ? body.detected_exercises.map((item: unknown) => cleanText(item, "", 60)).filter(Boolean)
        : [],
      exercise_totals: exerciseTotals,
      reps,
      average_form_score: score,
      duration_seconds: durationSeconds,
      movement_durations: movementDurations,
      detected_issues: detectedIssues,
      best_reps: bestReps,
      worst_reps: worstReps,
      cues,
      previous_score: previous?.average_form_score ?? previous?.score ?? null,
      previous_summary: previous?.summary ?? null,
    };
    const previousScore =
      previous?.average_form_score !== undefined && previous?.average_form_score !== null
        ? cleanNumber(previous.average_form_score)
        : previous?.score !== undefined && previous?.score !== null
          ? cleanNumber(previous.score)
          : null;
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
              "You summarize an automatic AI gym tracker session for a fitness app. Use only the structured metrics provided: detected exercises, reps, scores, issues, durations, and best/worst reps. Do not claim you saw images or video. Return only JSON with keys headline, summary, focus_next, cues. Keep it short, practical, and non-medical.",
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
