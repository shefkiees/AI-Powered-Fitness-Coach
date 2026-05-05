import { createSupabaseDataClient } from "@/lib/supabaseDataClient";

type DashboardProfileRecord = {
  age: number | null;
  weight: number | null;
  height: number | null;
  gender: string | null;
  goal: string | null;
  level: string | null;
  equipment: unknown | null;
  activity_level: string | null;
  workout_preference: string | null;
  created_at: string | null;
};

export type DashboardFitnessProfile = DashboardProfileRecord;

type DashboardProfileResult = {
  data: DashboardFitnessProfile | null;
  error: string | null;
};

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const valueNumber = Number(value);
  return Number.isFinite(valueNumber) ? valueNumber : null;
}

function normalizeProfileRow(row: Record<string, unknown>): DashboardFitnessProfile {
  return {
    age: toNullableNumber(row.age),
    weight: toNullableNumber(row.weight_kg ?? row.weight),
    height: toNullableNumber(row.height_cm ?? row.height),
    gender: toNullableString(row.gender),
    goal: toNullableString(row.goal),
    level: toNullableString(row.fitness_level ?? row.level),
    equipment: row.equipment ?? null,
    activity_level: toNullableString(row.activity_level),
    workout_preference: toNullableString(row.workout_preference),
    created_at: toNullableString(row.created_at),
  };
}

function isSchemaMismatch(message: string) {
  return (
    message.includes("schema cache") ||
    message.includes("equipment") ||
    message.includes("level") ||
    message.includes("workout_preference") ||
    message.includes("activity_level")
  );
}

export async function fetchDashboardFitnessProfile(
  _userId: string,
): Promise<DashboardProfileResult> {
  void _userId;
  const supabase = createSupabaseDataClient();
  const query = () =>
    supabase
      .from("profiles")
      .select(
        "age,weight_kg,height_cm,gender,goal,fitness_level,dietary_preference,created_at",
      )
      .maybeSingle();

  try {
    const { data, error } = await query();

    if (error) {
      if (isSchemaMismatch(error.message)) {
        const fallback = await supabase
          .from("profiles")
          .select(
            "age,weight_kg,height_cm,gender,goal,fitness_level,created_at",
          )
          .maybeSingle();

        if (fallback.error) {
          return { data: null, error: fallback.error.message };
        }

        if (!fallback.data) {
          return { data: null, error: null };
        }

        return {
          data: normalizeProfileRow(fallback.data as Record<string, unknown>),
          error: null,
        };
      }

      return { data: null, error: error.message };
    }

    if (!data) return { data: null, error: null };

    return { data: normalizeProfileRow(data as Record<string, unknown>), error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { data: null, error: errorMessage };
  }
}
