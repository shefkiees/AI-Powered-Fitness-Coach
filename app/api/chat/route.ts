import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Mesazhi është i zbrazët" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional AI fitness coach. Give short workout and nutrition advice.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 300,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      { error: "Gabim gjatë komunikimit me AI" },
      { status: 500 }
    );
  }
}