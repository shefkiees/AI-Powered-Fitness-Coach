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
  profile_image: string | null;
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
  profile_image?: string | null;
};

function normalizeRow(data: Record<string, unknown>): FitnessProfileRow {
  const activity =
    data.activity_level != null && String(data.activity_level).trim() !== ""
      ? String(data.activity_level)
      : data.level != null && String(data.level).trim() !== ""
        ? String(data.level)
        : "moderate";

  const img = data.profile_image;
  const profile_image =
    img != null && String(img).trim() !== "" ? String(img).trim() : null;

  const wp = data.workout_preference;
  const workout_preference =
    wp != null && String(wp).trim() !== ""
      ? String(wp).trim()
      : "full_body";

  return {
    id: String(data.id),
    user_id: String(data.user_id),
    gender:
      data.gender != null && String(data.gender).trim() !== ""
        ? String(data.gender)
        : "prefer_not_say",
    age: Number(data.age),
    weight: Number(data.weight),
    height: Number(data.height),
    goal: String(data.goal),
    activity_level: activity,
    workout_preference,
    profile_image,
    created_at: String(data.created_at ?? ""),
  };
}

const PROFILE_COLUMNS =
  "id,user_id,gender,age,weight,height,goal,activity_level,workout_preference,profile_image,created_at";

export async function fetchFitnessProfile(
  userId: string,
  client?: SupabaseClient,
): Promise<{ data: FitnessProfileRow | null; error: string | null }> {
  const db = client ?? supabase;
  const { data, error } = await db
    .from("fitness_profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (
    error?.message?.includes("activity_level") ||
    error?.message?.includes("profile_image") ||
    error?.message?.includes("workout_preference") ||
    error?.message?.includes("schema cache")
  ) {
    const retry = await db
      .from("fitness_profiles")
      .select("id,user_id,gender,age,weight,height,goal,level,created_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (retry.error)
      return { data: null, error: retry.error.message };
    if (!retry.data) return { data: null, error: null };
    return {
      data: normalizeRow(retry.data as Record<string, unknown>),
      error: null,
    };
  }

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: normalizeRow(data as Record<string, unknown>), error: null };
}

export async function saveFitnessProfile(
  userId: string,
  input: FitnessProfileInput,
): Promise<{ error: string | null }> {
  const row: Record<string, unknown> = {
    user_id: userId,
    gender: input.gender,
    age: input.age,
    weight: input.weight,
    height: input.height,
    goal: input.goal,
    activity_level: input.activity_level,
  };
  if (input.workout_preference !== undefined) {
    row.workout_preference = input.workout_preference;
  }
  if (input.profile_image !== undefined) {
    row.profile_image = input.profile_image;
  }

  const { error } = await supabase.from("fitness_profiles").upsert(row, {
    onConflict: "user_id",
  });

  return { error: error ? error.message : null };
}

export async function deleteFitnessProfile(
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("fitness_profiles")
    .delete()
    .eq("user_id", userId);
  return { error: error ? error.message : null };
}
