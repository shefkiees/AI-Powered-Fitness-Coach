import { requireSupabase } from "@/src/lib/supabaseClient";

export const PROFILE_SCHEMA_ERROR_MESSAGE =
  "Tabela public.profiles nuk ekziston ose schema cache nuk eshte rifreskuar. Apliko supabase-schema.sql ne Supabase SQL Editor, pastaj provo perseri.";

export const WORKOUT_SCHEMA_ERROR_MESSAGE =
  "Workout schema mungon ose Supabase schema cache nuk eshte rifreskuar. Apliko supabase-schema.sql finale ne Supabase SQL Editor, pastaj provo perseri.";

export const emptyUuid = "00000000-0000-0000-0000-000000000000";

export { requireSupabase };

export function textFromError(error) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
}

export function isMissingRelationError(error, tableName = "") {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  const table = tableName.toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    (table && message.includes(`relation "public.${table}"`))
  );
}

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function isProfileNotFoundError(error) {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  return (
    error.code === "PGRST116" ||
    (error.status === 406 && message.includes("0 rows")) ||
    message.includes("0 rows")
  );
}

export function isProfilesTableMissingError(error) {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.status === 404 && message.includes("profiles")) ||
    (message.includes("schema cache") && message.includes("profiles")) ||
    (message.includes('relation "public.profiles"') && message.includes("does not exist"))
  );
}

export function throwProfileError(error) {
  if (isProfilesTableMissingError(error)) {
    throw new Error(PROFILE_SCHEMA_ERROR_MESSAGE);
  }

  throw error;
}

export function nullableNumber(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isMissingColumnError(error) {
  if (!error) return false;
  const message = textFromError(error).toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.code === "23502" ||
    message.includes("schema cache") ||
    message.includes("column") ||
    message.includes("null value")
  );
}

export function estimateCalories(minutes, intensity = "moderate") {
  const mins = Number(minutes || 30);
  const multiplier = intensity === "hard" ? 9 : intensity === "easy" ? 5 : 7;
  return Math.max(40, Math.round(mins * multiplier));
}

export function workoutSchemaError(error) {
  if (
    isMissingRelationError(error, "workout_steps") ||
    isMissingRelationError(error, "workout_media") ||
    isMissingRelationError(error, "favorite_workouts") ||
    isMissingRelationError(error, "completed_workouts")
  ) {
    return new Error(WORKOUT_SCHEMA_ERROR_MESSAGE);
  }

  return error;
}
