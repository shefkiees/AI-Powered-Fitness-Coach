import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRoute";
import { fitnessProfileRequestSchema, formatZodError } from "@/lib/apiValidation";

function toProfilePayload(body: Record<string, unknown>) {
  return {
    age: body.age,
    weight_kg: body.weight_kg ?? body.weight,
    height_cm: body.height_cm ?? body.height,
    gender: body.gender,
    goal: body.goal,
    fitness_level: body.fitness_level ?? body.level ?? body.activity_level ?? "beginner",
    workout_days_per_week: body.workout_days_per_week ?? 3,
    dietary_preference: body.dietary_preference ?? "standard",
    injuries: body.injuries ?? "",
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

    const rawBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = fitnessProfileRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const payload = toProfilePayload(parsed.data);
    const existing = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

    const result = existing.data?.id
      ? await supabase.from("profiles").update(payload).eq("id", user.id)
      : await supabase.from("profiles").insert({ id: user.id, ...payload });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
