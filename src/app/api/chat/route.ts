import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import { fetchFitnessProfile } from "@/lib/fitnessProfiles";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Coach chat is not configured (missing API key)." },
        { status: 503 },
      );
    }

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
      goals: goalsRes.data || [],
      recent_completed_workouts: completedRes.data || [],
      recent_nutrition: nutritionRes.data || [],
      recent_weight_logs: weightRes.data || [],
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

    await supabase.from("ai_coach_messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
      category: "chat",
      metadata: { source: "coach_chat" },
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
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

    const reply = completion.choices[0]?.message?.content ?? "";
    if (!reply) {
      return NextResponse.json(
        { error: "No response from the model. Try again." },
        { status: 502 },
      );
    }

    await supabase.from("ai_coach_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: reply,
      category: "chat",
      metadata: { model: "gpt-4o-mini", source: "coach_chat" },
    });

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while contacting the coach." },
      { status: 500 },
    );
  }
}
