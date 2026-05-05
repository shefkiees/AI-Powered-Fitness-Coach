"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Save } from "lucide-react";
import {
  addProgressLog,
  createNutritionPlan,
  createWorkoutPlan,
  saveProfile,
} from "@/src/utils/supabaseData";

const goals = [
  ["lose_weight", "Lose weight"],
  ["build_muscle", "Build muscle"],
  ["maintain", "Maintain"],
  ["improve_fitness", "Improve fitness"],
];

const levels = [
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
];

const genders = [
  ["female", "Female"],
  ["male", "Male"],
  ["non_binary", "Non-binary"],
  ["prefer_not_say", "Prefer not to say"],
];

function initialValues(profile, user) {
  return {
    name: profile?.name || user?.user_metadata?.full_name || "",
    age: profile?.age || "",
    gender: profile?.gender || "prefer_not_say",
    height_cm: profile?.height_cm || "",
    weight_kg: profile?.weight_kg || "",
    goal: profile?.goal || "improve_fitness",
    fitness_level: profile?.fitness_level || "beginner",
    workout_days_per_week: profile?.workout_days_per_week || 3,
    dietary_preference: profile?.dietary_preference || "standard",
    injuries: profile?.injuries || "",
  };
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "pulse-input px-4 py-3.5";

export default function ProfileForm({
  user,
  profile,
  setup = false,
  submitLabel,
  onSaved,
}) {
  const [values, setValues] = useState(() => initialValues(profile, user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isNew = useMemo(() => !profile, [profile]);

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const age = Number(values.age);
    const height = Number(values.height_cm);
    const weight = Number(values.weight_kg);
    const days = Number(values.workout_days_per_week);

    if (values.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!Number.isFinite(age) || age < 13 || age > 100) return "Age must be between 13 and 100.";
    if (!Number.isFinite(height) || height < 100 || height > 250) return "Height must be between 100 and 250 cm.";
    if (!Number.isFinite(weight) || weight < 35 || weight > 350) return "Weight must be between 35 and 350 kg.";
    if (!Number.isFinite(days) || days < 1 || days > 6) return "Workout days must be between 1 and 6.";
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const savedProfile = await saveProfile(user.id, values);

      if (setup || isNew) {
        await createWorkoutPlan(user.id, savedProfile);
        await createNutritionPlan(user.id, savedProfile);
        await addProgressLog(user.id, {
          weight_kg: savedProfile.weight_kg,
          calories: "",
          steps: "",
          note: "Initial profile weight.",
        });
      }

      setSuccess(setup || isNew ? "Profile, workout plan, and first progress log created." : "Profile saved.");
      if (onSaved) onSaved(savedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input
            className={inputClass}
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            placeholder="Your full name"
          />
        </Field>
        <Field label="Age">
          <input
            className={inputClass}
            value={values.age}
            onChange={(event) => setValue("age", event.target.value)}
            type="number"
            min="13"
            max="100"
            placeholder="29"
          />
        </Field>
        <Field label="Gender">
          <select
            className={inputClass}
            value={values.gender}
            onChange={(event) => setValue("gender", event.target.value)}
          >
            {genders.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Height (cm)">
          <input
            className={inputClass}
            value={values.height_cm}
            onChange={(event) => setValue("height_cm", event.target.value)}
            type="number"
            min="100"
            max="250"
            step="0.5"
            placeholder="178"
          />
        </Field>
        <Field label="Weight (kg)">
          <input
            className={inputClass}
            value={values.weight_kg}
            onChange={(event) => setValue("weight_kg", event.target.value)}
            type="number"
            min="35"
            max="350"
            step="0.1"
            placeholder="78"
          />
        </Field>
        <Field label="Workout days per week">
          <input
            className={inputClass}
            value={values.workout_days_per_week}
            onChange={(event) => setValue("workout_days_per_week", event.target.value)}
            type="number"
            min="1"
            max="6"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Goal">
          <select
            className={inputClass}
            value={values.goal}
            onChange={(event) => setValue("goal", event.target.value)}
          >
            {goals.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fitness level">
          <select
            className={inputClass}
            value={values.fitness_level}
            onChange={(event) => setValue("fitness_level", event.target.value)}
          >
            {levels.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Dietary preference">
        <input
          className={inputClass}
          value={values.dietary_preference}
          onChange={(event) => setValue("dietary_preference", event.target.value)}
          placeholder="standard, vegetarian, vegan, pescatarian..."
        />
      </Field>

      <Field label="Injuries or limitations">
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          value={values.injuries}
          onChange={(event) => setValue("injuries", event.target.value)}
          placeholder="Example: knee pain, limited shoulder mobility, no jumping"
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--fc-accent)] px-5 py-3.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_18px_44px_rgba(184,245,61,0.18)] transition hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? "Saving..." : submitLabel || (setup ? "Create my plan" : "Save profile")}
        {!saving ? (setup ? <ArrowRight className="h-4 w-4" /> : <Save className="h-4 w-4" />) : null}
      </button>
    </form>
  );
}
