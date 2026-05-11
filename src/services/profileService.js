import {
  PROFILE_SCHEMA_ERROR_MESSAGE,
  isProfileNotFoundError,
  throwProfileError,
  requireSupabase,
} from "@/src/services/serviceShared";

function profileNameFromUser(user, fallbackName = "") {
  return (
    fallbackName?.trim?.() ||
    user?.user_metadata?.full_name?.trim?.() ||
    user?.user_metadata?.name?.trim?.() ||
    user?.email?.split("@")?.[0]?.trim?.() ||
    ""
  );
}

function normalizeProfilePayload(formValues) {
  return {
    name: formValues.name.trim(),
    age: Number(formValues.age),
    gender: formValues.gender,
    height_cm: Number(formValues.height_cm),
    weight_kg: Number(formValues.weight_kg),
    goal: formValues.goal,
    fitness_level: formValues.fitness_level,
    workout_days_per_week: Number(formValues.workout_days_per_week),
    dietary_preference: formValues.dietary_preference.trim() || "standard",
    injuries: formValues.injuries.trim(),
    equipment_available: Array.isArray(formValues.equipment_available) ? formValues.equipment_available : [],
    profile_image: formValues.profile_image || null,
  };
}

async function upsertFitnessPreferences(profile) {
  const client = requireSupabase();
  const { data: existing } = await client
    .from("fitness_profiles")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    fitness_level: profile.fitness_level || "beginner",
    main_goal: profile.goal || "improve_fitness",
    weekly_workout_target: Number(profile.workout_days_per_week || 3),
    preferred_workout_days: profile.preferred_workout_days || [],
    equipment_available: profile.equipment_available || [],
    injuries_limitations: profile.injuries || "",
    coaching_style: "balanced",
  };

  if (existing?.id) {
    await client.from("fitness_profiles").update(payload).eq("id", existing.id);
    return;
  }

  await client.from("fitness_profiles").insert(payload);
}

export function isProfileComplete(profile) {
  if (!profile) return false;
  const hasName = String(profile.name || "").trim().length >= 2;
  const requiredNumbers = [profile.age, profile.height_cm, profile.weight_kg, profile.workout_days_per_week];

  return (
    hasName &&
    requiredNumbers.every((value) => Number.isFinite(Number(value)) && Number(value) > 0) &&
    Boolean(profile.gender) &&
    Boolean(profile.goal) &&
    Boolean(profile.fitness_level)
  );
}

export async function getProfile() {
  const client = requireSupabase();
  const { data, error } = await client.from("profiles").select("*").maybeSingle();
  if (error) {
    if (isProfileNotFoundError(error)) return null;
    throwProfileError(error);
  }
  return data;
}

export async function ensureProfile(user, fallbackName = "") {
  const existingProfile = await getProfile();
  if (existingProfile) return existingProfile;

  const payload = {};
  const name = profileNameFromUser(typeof user === "string" ? null : user, fallbackName);
  if (name) payload.name = name;

  const client = requireSupabase();
  const { data, error } = await client.from("profiles").insert(payload).select().maybeSingle();
  if (error) {
    if (error.code === "23505") return getProfile();
    throwProfileError(error);
  }
  if (!data) throw new Error("Profili nuk u krijua. Kontrollo RLS policies per public.profiles.");
  return data;
}

export async function saveProfile(_userId, formValues) {
  const client = requireSupabase();
  const payload = normalizeProfilePayload(formValues);
  const existingProfile = await getProfile();

  if (existingProfile?.id) {
    const { data, error } = await client.from("profiles").update(payload).eq("id", existingProfile.id).select().maybeSingle();
    if (error) throwProfileError(error);
    if (data) {
      await upsertFitnessPreferences(data);
      return data;
    }
  }

  const { data, error } = await client.from("profiles").insert(payload).select().maybeSingle();
  if (error) throwProfileError(error);
  if (!data) throw new Error("Profili nuk u ruajt. Kontrollo RLS policies per public.profiles.");
  await upsertFitnessPreferences(data);
  return data;
}

export { PROFILE_SCHEMA_ERROR_MESSAGE };
