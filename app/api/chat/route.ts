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
    const hint = profileHint(profile);

    const system =
      "You are a supportive AI fitness coach. Give concise, practical workout and nutrition tips in plain language. " +
      "Do not give medical advice or diagnose conditions. " +
      (hint ? `\n${hint}` : "");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      max_tokens: 400,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    if (!reply) {
      return NextResponse.json(
        { error: "No response from the model. Try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while contacting the coach." },
      { status: 500 },
    );
  }
}
