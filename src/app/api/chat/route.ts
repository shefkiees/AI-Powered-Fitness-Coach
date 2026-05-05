import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import { fetchFitnessProfile, type FitnessProfileRow } from "@/lib/fitnessProfiles";
import { buildWorkoutPlan } from "@/lib/workoutPlan";

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const LOCAL_COACH_MODEL = "local-coach-fallback";

type CoachContext = {
  goals: Array<Record<string, unknown>>;
  recent_completed_workouts: Array<Record<string, unknown>>;
  recent_nutrition: Array<Record<string, unknown>>;
  recent_weight_logs: Array<Record<string, unknown>>;
};

function getOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey.includes("your_") || apiKey === "sk-your-key") {
    return null;
  }
  return apiKey;
}

function openAIStatus(error: unknown) {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : 502;
}

function openAIMessage(error: unknown) {
  const status = openAIStatus(error);
  if (status === 401) return "OpenAI API key is invalid or not authorized.";
  if (status === 403) return "OpenAI API key does not have access to this model.";
  if (status === 429) return "OpenAI rate limit or quota was reached. Try again later.";
  if (status >= 500) return "OpenAI service is temporarily unavailable. Try again later.";
  return error instanceof Error ? error.message : "OpenAI request failed.";
}

function shouldUseLocalCoach(status: number) {
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

function cleanLabel(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;
  return text.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function formatExercises(
  exercises: Array<{ name: string; sets: string; reps: string }>,
  limit: number,
) {
  return exercises
    .slice(0, limit)
    .map((exercise) => `${exercise.name}: ${exercise.sets} sets x ${exercise.reps}`);
}

function fallbackProfileLine(profile: FitnessProfileRow | null) {
  if (!profile) {
    return "I do not have your full profile yet, so keep this easy and update your profile when you can.";
  }

  return `I am basing this on your ${cleanLabel(profile.goal, "fitness")} goal, ${cleanLabel(
    profile.activity_level,
    "current",
  )} level, and ${cleanLabel(profile.workout_preference, "full body")} focus.`;
}

function buildLocalCoachReply(
  message: string,
  profile: FitnessProfileRow | null,
  context: CoachContext,
  reason: string,
) {
  const lower = message.toLowerCase();
  const intro = `${reason} Here is a practical backup answer.`;
  const profileLine = fallbackProfileLine(profile);

  if (includesAny(lower, ["motivation", "motivim", "tired", "stuck", "lazy"])) {
    return [
      intro,
      "",
      "### Quick reset",
      `- ${profileLine}`,
      "- Make the workout small enough that starting feels easy.",
      "- Do 5 minutes first. If you still feel low, stop there and count it as a win.",
      "- If you feel better after 5 minutes, add one simple round: squats, push-ups, and a plank.",
      "",
      "**Next step:** Set a 5-minute timer and start with slow bodyweight squats.",
    ].join("\n");
  }

  if (includesAny(lower, ["progress", "review", "check", "track", "progres"])) {
    const completed = context.recent_completed_workouts.length;
    const goals = context.goals.length;
    return [
      intro,
      "",
      "### Progress check",
      `- ${profileLine}`,
      `- Recent workouts saved: ${completed}. Active/recent goals saved: ${goals}.`,
      "- Track three simple things this week: workouts completed, energy before training, and how hard the session felt.",
      "- If your energy is low for two sessions in a row, make the next workout lighter.",
      "",
      "**Next step:** After your next workout, log a quick 1-5 rating.",
    ].join("\n");
  }

  if (includesAny(lower, ["plan", "workout", "exercise", "train", "week", "today", "ster", "ushtrim"])) {
    if (!profile) {
      return [
        intro,
        "",
        "### Starter session",
        `- ${profileLine}`,
        "- Warm-up: 3 minutes of easy marching, arm circles, and hip circles.",
        "- Main work: 2 rounds of 10 squats, 6 incline push-ups, 10 lunges, and a 20 second plank.",
        "- Cooldown: 2 minutes of slow breathing and gentle stretching.",
        "",
        "**Next step:** Finish your profile so the coach can tune the plan to your goal.",
      ].join("\n");
    }

    const plan = buildWorkoutPlan(profile, message.length);
    const warmUp = formatExercises(plan.sections[0]?.exercises ?? [], 2);
    const main = formatExercises(plan.sections[1]?.exercises ?? [], 4);
    const cooldown = formatExercises(plan.sections[2]?.exercises ?? [], 2);

    return [
      intro,
      "",
      "### Plan for today",
      `- ${profileLine}`,
      `- Keep this at a ${plan.difficulty.toLowerCase()} pace. You should feel challenged but in control.`,
      "",
      "### Session",
      ...warmUp.map((item) => `- Warm-up: ${item}`),
      ...main.map((item) => `- Main: ${item}`),
      ...cooldown.map((item) => `- Cooldown: ${item}`),
      "",
      "**Next step:** Start with the first warm-up and tell me how it felt.",
    ].join("\n");
  }

  return [
    intro,
    "",
    "### Coach answer",
    `- ${profileLine}`,
    "- Choose the smallest clear action that moves you toward your goal today.",
    "- If you are unsure, do a simple full-body session: squats, push-ups, rows or towel pulls, and a plank.",
    "- Stop and get professional help if you feel chest pain, dizziness, or sharp pain.",
    "",
    "**Next step:** Tell me your goal for today in one sentence, and I will turn it into a simple plan.",
  ].join("\n");
}

function profileHint(
  row: Awaited<ReturnType<typeof fetchFitnessProfile>>["data"],
): string {
  if (!row) return "";
  return [
    `User profile (for context only): goal=${row.goal}, activity=${row.activity_level},`,
    `workout_focus=${row.workout_preference}, age=${row.age}, weight_kg=${row.weight},`,
    `height_cm=${row.height}, gender=${row.gender}.`,
    "Tailor suggestions to these constraints when relevant. Do not diagnose or give medical advice.",
  ].join(" ");
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to use the coach chat." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 },
      );
    }

    const apiKey = getOpenAIKey();

    const { data: profile } = await fetchFitnessProfile(user.id, supabase);
    const [profileRes, goalsRes, completedRes, nutritionRes, weightRes, historyRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("goals")
          .select("title,current_value,target_value,unit,status,deadline")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("completed_workouts")
          .select("workout_title,duration_minutes,calories_burned,rating,completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(8),
        supabase
          .from("nutrition_logs")
          .select("log_date,target_calories,consumed_calories,target_protein_g,consumed_protein_g")
          .eq("user_id", user.id)
          .order("log_date", { ascending: false })
          .limit(3),
        supabase
          .from("weight_logs")
          .select("weight_kg,steps,calories_burned,logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false })
          .limit(5),
        supabase
          .from("ai_coach_messages")
          .select("role,content,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
    const hint = profileHint(profile);
    const context = {
      profile: profileRes.data,
      goals: (goalsRes.data || []) as Array<Record<string, unknown>>,
      recent_completed_workouts: (completedRes.data || []) as Array<Record<string, unknown>>,
      recent_nutrition: (nutritionRes.data || []) as Array<Record<string, unknown>>,
      recent_weight_logs: (weightRes.data || []) as Array<Record<string, unknown>>,
    };
    const history = [...(historyRes.data || [])].reverse().map((row) => ({
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
    })) as Array<{ role: "user" | "assistant"; content: string }>;

    const system =
      "You are a warm, professional personal trainer and AI fitness coach. " +
      "Speak in second person (you/your). Keep a motivating but grounded tone like a coach who respects the athlete. " +
      "Structure every reply for readability using this pattern when it fits: " +
      "1) One short opening line (encouragement or empathy). " +
      "2) A ### heading for the main section title (e.g. ### Plan for today). " +
      "3) Bullet points (- item) or numbered steps (1. item) for actions. " +
      "4) End with **Next step:** one tiny concrete action. " +
      "Use **bold** sparingly for emphasis. Avoid medical diagnosis, lab interpretation, or injury treatment; suggest seeing a professional for pain, dizziness, or chest symptoms. " +
      "Keep total length concise unless the user asks for detail. " +
      (hint ? `\n${hint}` : "");

    const saveWarnings: string[] = [];
    const responseWarnings: string[] = [];
    let reply = "";
    let assistantMetadata: Record<string, unknown> = {
      model: CHAT_MODEL,
      source: "coach_chat",
    };

    if (!apiKey) {
      responseWarnings.push("Live AI is not configured, so the built-in coach answered instead.");
      reply = buildLocalCoachReply(
        message,
        profile,
        context,
        "Live AI is not configured right now.",
      );
      assistantMetadata = {
        model: LOCAL_COACH_MODEL,
        source: "coach_chat",
        fallback_reason: "missing_api_key",
      };
    } else {
      try {
        const client = new OpenAI({ apiKey });
        const completion = await client.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: "system", content: system },
            {
              role: "system",
              content:
                "Current app context JSON. Use it for personalization, but do not expose private raw data unless the user asks for it: " +
                JSON.stringify(context),
            },
            ...history,
            { role: "user", content: message },
          ],
          max_tokens: 600,
        });
        reply = completion.choices[0]?.message?.content ?? "";
      } catch (error) {
        const status = openAIStatus(error);
        if (!shouldUseLocalCoach(status)) {
          return NextResponse.json(
            { error: openAIMessage(error) },
            { status: status === 401 ? 503 : status },
          );
        }

        responseWarnings.push(`${openAIMessage(error)} Showing a built-in coach response.`);
        reply = buildLocalCoachReply(
          message,
          profile,
          context,
          "Live AI is temporarily unavailable.",
        );
        assistantMetadata = {
          model: LOCAL_COACH_MODEL,
          source: "coach_chat",
          fallback_reason: `openai_${status}`,
        };
      }
    }

    if (!reply) {
      return NextResponse.json(
        { error: "No response from the model. Try again." },
        { status: 502 },
      );
    }

    const userMessageInsert = await supabase.from("ai_coach_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
      category: "chat",
      metadata: { source: "coach_chat" },
    });
    if (userMessageInsert.error) {
      saveWarnings.push(`Could not save user message: ${userMessageInsert.error.message}`);
    }

    const assistantMessageInsert = await supabase.from("ai_coach_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: reply,
      category: "chat",
      metadata: assistantMetadata,
    });
    if (assistantMessageInsert.error) {
      saveWarnings.push(`Could not save assistant reply: ${assistantMessageInsert.error.message}`);
    }

    return NextResponse.json({
      reply,
      warning: [...responseWarnings, ...saveWarnings].length
        ? [...responseWarnings, ...saveWarnings].join(" ")
        : undefined,
    });
  } catch (error) {
    console.error("[api/chat]", error);
    return NextResponse.json(
      { error: "Something went wrong while contacting the coach." },
      { status: 500 },
    );
  }
}
