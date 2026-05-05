import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type FitnessProfileRow = {
  id: string;
  user_id: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  activity_level: string;
  workout_preference: string;
  profile_image?: string | null;
  created_at: string;
};

export type FitnessProfileInput = {
  gender: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  activity_level: string;
  workout_preference?: string;
};

function normalizeRow(data: Record<string, unknown>): FitnessProfileRow {
  const id = String(data.id ?? "");
  return {
    id,
    user_id: id,
    gender:
      data.gender != null && String(data.gender).trim() !== ""
        ? String(data.gender)
        : "prefer_not_say",
    age: Number(data.age),
    weight: Number(data.weight_kg ?? data.weight),
    height: Number(data.height_cm ?? data.height),
    goal: String(data.goal ?? "improve_fitness"),
    activity_level: String(data.fitness_level ?? data.activity_level ?? "beginner"),
    workout_preference: String(data.workout_preference ?? "full_body"),
    created_at: String(data.created_at ?? ""),
  };
}

function isLockError(message: string) {
  return message.includes("Lock broken by another request");
}

export async function fetchFitnessProfile(
  _userId: string,
  client?: SupabaseClient,
): Promise<{ data: FitnessProfileRow | null; error: string | null }> {
  void _userId;
  const db = client ?? supabase;

  try {
    const { data, error } = await db.from("profiles").select("*").maybeSingle();

    if (error && isLockError(error.message)) {
      return { data: null, error: null };
    }

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return {
      data: normalizeRow(data as Record<string, unknown>),
      error: null,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (isLockError(errorMsg)) {
      return { data: null, error: null };
    }
    return { data: null, error: errorMsg };
  }
}

export async function saveFitnessProfile(
  _userId: string,
  input: FitnessProfileInput,
): Promise<{ error: string | null }> {
  void _userId;
  const row: Record<string, unknown> = {
    gender: input.gender,
    age: input.age,
    weight_kg: input.weight,
    height_cm: input.height,
    goal: input.goal,
    fitness_level: input.activity_level,
  };

  try {
    const existing = await supabase.from("profiles").select("id").maybeSingle();
    const result = existing.data?.id
      ? await supabase.from("profiles").update(row).eq("id", existing.data.id)
      : await supabase.from("profiles").insert(row);

    if (result.error) {
      if (isLockError(result.error.message)) {
        return { error: null };
      }
      return { error: result.error.message };
    }

    return { error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (isLockError(errorMsg)) {
      return { error: null };
    }
    return { error: errorMsg };
  }
}

export async function deleteFitnessProfile(
  _userId: string,
): Promise<{ error: string | null }> {
  void _userId;
  try {
    const existing = await supabase.from("profiles").select("id").maybeSingle();
    if (!existing.data?.id) return { error: existing.error?.message ?? null };

    const { error } = await supabase.from("profiles").delete().eq("id", existing.data.id);

    if (error) {
      if (isLockError(error.message)) {
        return { error: null };
      }
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (isLockError(errorMsg)) {
      return { error: null };
    }
    return { error: errorMsg };
  }
}
