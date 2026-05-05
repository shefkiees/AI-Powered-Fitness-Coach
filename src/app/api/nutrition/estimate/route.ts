import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "meal";

type NutritionEstimate = {
  title: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  confidence: "low" | "medium" | "high";
  notes: string;
};

type AiProvider = {
  name: "groq" | "openai";
  apiKey: string;
  baseURL?: string;
  model: string;
};

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const FOOD_ESTIMATES = [
  {
    patterns: ["egg", "eggs", "veze", "vezeve"],
    title: "Eggs",
    calories: 72,
    protein_g: 6,
    carbs_g: 0,
    fat_g: 5,
  },
  {
    patterns: ["banana", "banane"],
    title: "Banana",
    calories: 105,
    protein_g: 1,
    carbs_g: 27,
    fat_g: 0,
  },
  {
    patterns: ["apple", "molle"],
    title: "Apple",
    calories: 95,
    protein_g: 0,
    carbs_g: 25,
    fat_g: 0,
  },
  {
    patterns: ["chicken", "pule", "gjoks pule"],
    title: "Chicken breast",
    calories: 165,
    protein_g: 31,
    carbs_g: 0,
    fat_g: 4,
  },
  {
    patterns: ["rice", "oriz"],
    title: "Rice",
    calories: 205,
    protein_g: 4,
    carbs_g: 45,
    fat_g: 0,
  },
  {
    patterns: ["oats", "oatmeal", "tershere"],
    title: "Oats",
    calories: 150,
    protein_g: 5,
    carbs_g: 27,
    fat_g: 3,
  },
  {
    patterns: ["greek yogurt", "yogurt", "kos"],
    title: "Greek yogurt",
    calories: 130,
    protein_g: 17,
    carbs_g: 8,
    fat_g: 4,
  },
  {
    patterns: ["protein shake", "whey", "protein"],
    title: "Protein shake",
    calories: 130,
    protein_g: 24,
    carbs_g: 4,
    fat_g: 2,
  },
  {
    patterns: ["bread", "toast", "buke"],
    title: "Bread",
    calories: 80,
    protein_g: 3,
    carbs_g: 15,
    fat_g: 1,
  },
  {
    patterns: ["tuna", "tun"],
    title: "Tuna",
    calories: 120,
    protein_g: 26,
    carbs_g: 0,
    fat_g: 1,
  },
  {
    patterns: ["salmon"],
    title: "Salmon",
    calories: 230,
    protein_g: 25,
    carbs_g: 0,
    fat_g: 14,
  },
  {
    patterns: ["milk", "qumesht"],
    title: "Milk",
    calories: 120,
    protein_g: 8,
    carbs_g: 12,
    fat_g: 5,
  },
  {
    patterns: ["avocado"],
    title: "Avocado",
    calories: 240,
    protein_g: 3,
    carbs_g: 13,
    fat_g: 22,
  },
];

function cleanApiKey(value: string | undefined) {
  const apiKey = value?.trim();
  if (!apiKey || apiKey.includes("your_") || apiKey === "sk-your-key") return null;
  return apiKey;
}

function getProvider(): AiProvider | null {
  const groqKey = cleanApiKey(process.env.GROQ_API_KEY);
  if (groqKey) {
    return {
      name: "groq",
      apiKey: groqKey,
      baseURL: GROQ_BASE_URL,
      model:
        process.env.GROQ_NUTRITION_MODEL ||
        process.env.GROQ_MODEL ||
        DEFAULT_GROQ_MODEL,
    };
  }

  const openAiKey = cleanApiKey(process.env.OPENAI_API_KEY);
  if (openAiKey) {
    return {
      name: "openai",
      apiKey: openAiKey,
      model:
        process.env.OPENAI_NUTRITION_MODEL ||
        process.env.OPENAI_CHAT_MODEL ||
        DEFAULT_OPENAI_MODEL,
    };
  }

  return null;
}

function clampNumber(value: unknown, max: number) {
  const n = Math.round(Number(value || 0));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function mealTypeFromText(text: string): MealType {
  const lower = text.toLowerCase();
  if (lower.includes("breakfast") || lower.includes("mengjes")) return "breakfast";
  if (lower.includes("lunch") || lower.includes("dreke")) return "lunch";
  if (lower.includes("dinner") || lower.includes("darke")) return "dinner";
  if (lower.includes("snack") || lower.includes("zemre")) return "snack";
  return "meal";
}

function quantityNear(text: string, pattern: string) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:x\\s*)?${escaped}`, "i");
  const after = new RegExp(`${escaped}\\s*(?:x\\s*)?(\\d+(?:[.,]\\d+)?)`, "i");
  const match = text.match(before) || text.match(after);
  const value = Number(String(match?.[1] || "1").replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.min(value, 12) : 1;
}

function estimateWater(text: string) {
  const lower = text.toLowerCase();
  if (!/(water|uje|uj|uji|ml|liter|litre|\bl\b)/i.test(lower)) return 0;

  let total = 0;
  const unitMatches = lower.matchAll(/(\d+(?:[.,]\d+)?)\s*(ml|milliliter|millilitre|l|liter|litre)\b/g);
  for (const match of unitMatches) {
    const amount = Number(match[1].replace(",", "."));
    const unit = match[2];
    if (!Number.isFinite(amount)) continue;
    total += unit === "ml" || unit.startsWith("milli") ? amount : amount * 1000;
  }

  if (total === 0 && /(water|uje|uji|\buj\b)/i.test(lower)) {
    total = 250;
  }

  return clampNumber(total, 6000);
}

function estimateLocally(text: string): NutritionEstimate {
  const lower = text.toLowerCase();
  const found: string[] = [];
  const totals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };

  for (const food of FOOD_ESTIMATES) {
    const pattern = food.patterns.find((item) => lower.includes(item));
    if (!pattern) continue;
    const qty = quantityNear(lower, pattern);
    found.push(qty > 1 ? `${qty} ${food.title}` : food.title);
    totals.calories += food.calories * qty;
    totals.protein_g += food.protein_g * qty;
    totals.carbs_g += food.carbs_g * qty;
    totals.fat_g += food.fat_g * qty;
  }

  const waterMl = estimateWater(text);
  const hasFood = totals.calories > 0 || totals.protein_g > 0 || totals.carbs_g > 0 || totals.fat_g > 0;

  return {
    title: hasFood ? found.slice(0, 3).join(", ") : "",
    meal_type: mealTypeFromText(text),
    calories: clampNumber(totals.calories, 5000),
    protein_g: clampNumber(totals.protein_g, 300),
    carbs_g: clampNumber(totals.carbs_g, 700),
    fat_g: clampNumber(totals.fat_g, 300),
    water_ml: waterMl,
    confidence: hasFood ? "medium" : waterMl ? "high" : "low",
    notes: hasFood
      ? "Estimated from common serving sizes. Adjust manually if your portion was different."
      : "Could not identify a clear food item. Add the meal manually for better accuracy.",
  };
}

function normalizeEstimate(raw: Record<string, unknown>, input: string): NutritionEstimate {
  const mealType = String(raw.meal_type || mealTypeFromText(input));
  const confidence = String(raw.confidence || "medium");
  return {
    title: String(raw.title || "").trim().slice(0, 80),
    meal_type: ["breakfast", "lunch", "dinner", "snack", "meal"].includes(mealType)
      ? (mealType as MealType)
      : "meal",
    calories: clampNumber(raw.calories, 5000),
    protein_g: clampNumber(raw.protein_g, 300),
    carbs_g: clampNumber(raw.carbs_g, 700),
    fat_g: clampNumber(raw.fat_g, 300),
    water_ml: clampNumber(raw.water_ml, 6000),
    confidence: ["low", "medium", "high"].includes(confidence)
      ? (confidence as NutritionEstimate["confidence"])
      : "medium",
    notes: String(raw.notes || "").trim().slice(0, 240),
  };
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned an invalid nutrition estimate.");
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

async function estimateWithAi(input: string, provider: AiProvider) {
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });

  const completion = await client.chat.completions.create({
    model: provider.model,
    messages: [
      {
        role: "system",
        content:
          "You estimate meal nutrition for a fitness tracker. Return only JSON with keys: title, meal_type, calories, protein_g, carbs_g, fat_g, water_ml, confidence, notes. Use integers. meal_type must be breakfast, lunch, dinner, snack, or meal. confidence must be low, medium, or high. If the input is only water, set food macros to 0 and title to an empty string. Do not give medical advice.",
      },
      {
        role: "user",
        content: `Estimate this food or drink log: ${input}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 450,
  });

  const content = completion.choices[0]?.message?.content || "{}";
  return normalizeEstimate(parseJsonObject(content), input);
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
        { error: "You must be signed in to estimate nutrition." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const input = typeof body?.input === "string" ? body.input.trim() : "";

    if (!input) {
      return NextResponse.json(
        { error: "Food or drink text is required." },
        { status: 400 },
      );
    }

    if (input.length > 500) {
      return NextResponse.json(
        { error: "Keep the food log under 500 characters." },
        { status: 400 },
      );
    }

    const provider = getProvider();
    if (!provider) {
      return NextResponse.json({
        estimate: estimateLocally(input),
        source: "local",
        warning: "No AI key is configured, so a local estimate was used.",
      });
    }

    try {
      return NextResponse.json({
        estimate: await estimateWithAi(input, provider),
        source: provider.name,
        model: provider.model,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI estimate failed.";
      return NextResponse.json({
        estimate: estimateLocally(input),
        source: "local",
        warning: `${provider.name} estimate failed: ${message}. A local estimate was used.`,
      });
    }
  } catch (error) {
    console.error("[api/nutrition/estimate]", error);
    return NextResponse.json(
      { error: "Something went wrong while estimating nutrition." },
      { status: 500 },
    );
  }
}
