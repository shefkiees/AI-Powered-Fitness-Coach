"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Camera, ImagePlus, Save, Trash2 } from "lucide-react";
import {
  addProgressLog,
  createNutritionPlan,
  createWorkoutPlan,
  saveProfile,
} from "@/src/utils/supabaseData";
import {
  compressProfileImageToDataUrl,
  removeProfileImageFromStorage,
  uploadProfileImage,
} from "@/lib/profileImageStorage";

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

const equipmentOptions = [
  "Bodyweight",
  "Dumbbells",
  "Resistance bands",
  "Gym machines",
  "Treadmill",
  "Yoga mat",
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
    equipment_available:
      Array.isArray(profile?.equipment_available) && profile.equipment_available.length
        ? profile.equipment_available
        : ["Bodyweight"],
    profile_image: profile?.profile_image || "",
  };
}

function fieldLabelClass(surface) {
  return surface === "light"
    ? "text-[#374151]"
    : "text-white";
}

function inputClass(surface) {
  return surface === "light"
    ? "w-full rounded-2xl border border-[#dfe3e8] bg-white px-4 py-3.5 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/10"
    : "pulse-input px-4 py-3.5";
}

function Field({ label, hint, children, surface }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold ${fieldLabelClass(surface)}`}>
      <span>{label}</span>
      {children}
      {hint ? (
        <span className={surface === "light" ? "text-xs text-[#6b7280]" : "text-xs text-[var(--fc-muted)]"}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function FormSection({ title, description, children, surface }) {
  const className =
    surface === "light"
      ? "grid gap-4 border-t border-[#e5e7eb] pt-5 first:border-t-0 first:pt-0"
      : "grid gap-4 rounded-[1.25rem] border border-[var(--fc-border)] bg-black/18 p-4";

  return (
    <section className={className}>
      <div>
        <h3 className={surface === "light" ? "text-base font-black text-[#111827]" : "text-base font-black text-white"}>
          {title}
        </h3>
        {description ? (
          <p className={surface === "light" ? "mt-1 text-sm text-[#6b7280]" : "mt-1 text-sm text-[var(--fc-muted)]"}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ToggleChip({ active, children, onClick, surface }) {
  const activeClass =
    surface === "light"
      ? "border-[#22c55e] bg-[#dcfce7] text-[#14532d]"
      : "border-[var(--fc-accent)] bg-[var(--fc-accent)]/14 text-[var(--fc-accent)]";
  const inactiveClass =
    surface === "light"
      ? "border-[#dfe3e8] bg-white text-[#374151] hover:border-[#22c55e]/50"
      : "border-[var(--fc-border)] bg-white/[0.04] text-white hover:bg-white/[0.08]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${active ? activeClass : inactiveClass}`}
    >
      {children}
    </button>
  );
}

export default function ProfileForm({
  user,
  profile,
  setup = false,
  submitLabel,
  onSaved,
  surface = "dark",
  compact = false,
  minimal = false,
}) {
  const [values, setValues] = useState(() => initialValues(profile, user));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isNew = useMemo(() => !profile, [profile]);
  const avatarSrc = imagePreview || values.profile_image;
  const initials = (values.name || user?.email || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const toggleEquipment = (item) => {
    setValues((current) => {
      const existing = Array.isArray(current.equipment_available)
        ? current.equipment_available
        : [];
      const next = existing.includes(item)
        ? existing.filter((value) => value !== item)
        : [...existing, item];
      return { ...current, equipment_available: next.length ? next : ["Bodyweight"] };
    });
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setValue("profile_image", "");
  };

  const validate = () => {
    const age = Number(values.age);
    const height = Number(values.height_cm);
    const weight = Number(values.weight_kg);
    const days = Number(values.workout_days_per_week);

    if (values.name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!Number.isFinite(age) || age < 13 || age > 100) return "Age must be between 13 and 100.";
    if (!Number.isFinite(height) || height < 80 || height > 260) return "Height must be between 80 and 260 cm.";
    if (!Number.isFinite(weight) || weight < 25 || weight > 400) return "Weight must be between 25 and 400 kg.";
    if (!Number.isFinite(days) || days < 1 || days > 7) return "Workout days must be between 1 and 7.";
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
    let uploadedUrl = "";
    let usedInlineImageFallback = false;
    try {
      const nextValues = { ...values };
      const previousImage = profile?.profile_image || "";

      if (imageFile) {
        const upload = await uploadProfileImage(user.id, imageFile);
        if (upload.publicUrl) {
          uploadedUrl = upload.publicUrl;
          nextValues.profile_image = upload.publicUrl;
        } else {
          const fallback = await compressProfileImageToDataUrl(imageFile);
          if (!fallback.dataUrl) {
            throw new Error(upload.error || fallback.error || "Profile image could not be saved.");
          }
          usedInlineImageFallback = true;
          nextValues.profile_image = fallback.dataUrl;
        }
      }

      const savedProfile = await saveProfile(user.id, nextValues);

      if (previousImage && previousImage !== nextValues.profile_image) {
        void removeProfileImageFromStorage(previousImage);
      }

      setValues(initialValues(savedProfile, user));
      setImageFile(null);
      setImagePreview("");

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

      setSuccess(
        usedInlineImageFallback
          ? "Profile saved. Photo was saved directly to your profile because Supabase Storage upload is not enabled yet."
          : setup || isNew
            ? "Profile, workout plan, and first progress log created."
            : "Profile saved.",
      );
      if (onSaved) onSaved(savedProfile);
    } catch (err) {
      if (uploadedUrl) void removeProfileImageFromStorage(uploadedUrl);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    const darkCompact = surface === "dark";
    const compactInputClass = darkCompact
      ? "w-full rounded-lg border border-white/[0.12] bg-black/25 px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-emerald-300/10"
      : inputClass("light");
    const compactSubmitClass = darkCompact
      ? "inline-flex items-center justify-center gap-3 rounded-lg bg-emerald-400 px-5 py-3.5 text-sm font-black text-emerald-950 shadow-[0_18px_50px_rgba(52,211,153,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
      : "inline-flex items-center justify-center gap-3 rounded-full bg-[var(--fc-accent)] px-5 py-3.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_18px_44px_rgba(34,197,94,0.18)] transition hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70";

    return (
      <form onSubmit={submit} className={darkCompact ? "grid gap-4 text-white" : "grid gap-4 text-[#111827]"}>
        {error ? (
          <div className={darkCompact ? "rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-50" : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"}>
            {error}
          </div>
        ) : null}
        {success ? (
          <div className={darkCompact ? "rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-50" : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"}>
            {success}
          </div>
        ) : null}

        {!minimal ? (
          <div className="flex flex-col gap-4 rounded-[1.25rem] border border-[#e5e7eb] bg-[#f9fafb] p-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[#dfe3e8] bg-[#dcfce7]">
              {avatarSrc ? (
                <span
                  role="img"
                  aria-label="Profile preview"
                  className="block h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatarSrc})` }}
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-black text-[#15803d]">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1f2937]">
                <ImagePlus className="h-4 w-4" />
                Change photo
                <input type="file" accept="image/*" className="sr-only" onChange={chooseImage} />
              </label>
              {avatarSrc ? (
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" surface={surface}>
            <input
              className={compactInputClass}
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Age" surface={surface}>
            <input
              className={compactInputClass}
              value={values.age}
              onChange={(event) => setValue("age", event.target.value)}
              type="number"
              min="13"
              max="100"
            />
          </Field>
          {!minimal ? (
            <Field label="Gender" surface={surface}>
              <select
                className={compactInputClass}
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
          ) : null}
          <Field label="Goal" surface={surface}>
            <select
              className={compactInputClass}
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
          <Field label="Height (cm)" surface={surface}>
            <input
              className={compactInputClass}
              value={values.height_cm}
              onChange={(event) => setValue("height_cm", event.target.value)}
              type="number"
              min="80"
              max="260"
              step="0.5"
            />
          </Field>
          <Field label="Weight (kg)" surface={surface}>
            <input
              className={compactInputClass}
              value={values.weight_kg}
              onChange={(event) => setValue("weight_kg", event.target.value)}
              type="number"
              min="25"
              max="400"
              step="0.1"
            />
          </Field>
          <Field label="Days/week" surface={surface}>
            <input
              className={compactInputClass}
              value={values.workout_days_per_week}
              onChange={(event) => setValue("workout_days_per_week", event.target.value)}
              type="number"
              min="1"
              max="7"
            />
          </Field>
          <Field label="Level" surface={surface}>
            <select
              className={compactInputClass}
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

        {!minimal ? (
          <div className="grid gap-3">
            <Field label="Equipment" surface={surface}>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((item) => (
                  <ToggleChip
                    key={item}
                    active={values.equipment_available?.includes(item)}
                    onClick={() => toggleEquipment(item)}
                    surface={surface}
                  >
                    {item}
                  </ToggleChip>
                ))}
              </div>
            </Field>
            <Field label="Diet" surface={surface}>
              <input
                className={compactInputClass}
                value={values.dietary_preference}
                onChange={(event) => setValue("dietary_preference", event.target.value)}
                placeholder="standard"
              />
            </Field>
            <Field label="Limitations" surface={surface}>
              <textarea
                className={`${compactInputClass} min-h-24 resize-y`}
                value={values.injuries}
                onChange={(event) => setValue("injuries", event.target.value)}
                placeholder="knee pain, no jumping..."
              />
            </Field>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className={compactSubmitClass}
        >
          {saving ? "Saving..." : submitLabel || "Save profile"}
          {!saving ? <Save className="h-4 w-4" /> : null}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className={surface === "light" ? "grid gap-6 text-[#111827]" : "grid gap-5"}>
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/12 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-100">
          {success}
        </div>
      ) : null}

      <FormSection
        title="Profile photo"
        description="Upload a clear photo so your account feels personal across the coach app."
        surface={surface}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[#dfe3e8] bg-[#dcfce7]">
            {avatarSrc ? (
              <span
                role="img"
                aria-label="Profile preview"
                className="block h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatarSrc})` }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-black text-[#15803d]">
                {initials}
              </div>
            )}
            <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-white shadow-lg">
              <Camera className="h-4 w-4" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1f2937]">
                <ImagePlus className="h-4 w-4" />
                Choose photo
                <input type="file" accept="image/*" className="sr-only" onChange={chooseImage} />
              </label>
              {avatarSrc ? (
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              ) : null}
            </div>
            <p className={surface === "light" ? "mt-2 text-xs text-[#6b7280]" : "mt-2 text-xs text-[var(--fc-muted)]"}>
              JPG, PNG, or WebP. Max 5MB. The image is saved when you save the profile.
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Basic details" description="The coach uses these basics to personalize your plans." surface={surface}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" surface={surface}>
            <input
              className={inputClass(surface)}
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Age" surface={surface}>
            <input
              className={inputClass(surface)}
              value={values.age}
              onChange={(event) => setValue("age", event.target.value)}
              type="number"
              min="13"
              max="100"
              placeholder="29"
            />
          </Field>
          <Field label="Gender" surface={surface}>
            <select
              className={inputClass(surface)}
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
        </div>
      </FormSection>

      <FormSection title="Body profile" description="Used for targets and progress tracking." surface={surface}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Height (cm)" surface={surface}>
            <input
              className={inputClass(surface)}
              value={values.height_cm}
              onChange={(event) => setValue("height_cm", event.target.value)}
              type="number"
              min="80"
              max="260"
              step="0.5"
              placeholder="178"
            />
          </Field>
          <Field label="Weight (kg)" surface={surface}>
            <input
              className={inputClass(surface)}
              value={values.weight_kg}
              onChange={(event) => setValue("weight_kg", event.target.value)}
              type="number"
              min="25"
              max="400"
              step="0.1"
              placeholder="78"
            />
          </Field>
          <Field label="Workout days per week" surface={surface}>
            <input
              className={inputClass(surface)}
              value={values.workout_days_per_week}
              onChange={(event) => setValue("workout_days_per_week", event.target.value)}
              type="number"
              min="1"
              max="7"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Training setup" description="Pick the goal, level, and equipment the coach should respect." surface={surface}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Goal" surface={surface}>
            <select
              className={inputClass(surface)}
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
          <Field label="Fitness level" surface={surface}>
            <select
              className={inputClass(surface)}
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
        <div>
          <p className={`mb-2 text-sm font-semibold ${fieldLabelClass(surface)}`}>Equipment</p>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((item) => (
              <ToggleChip
                key={item}
                active={values.equipment_available?.includes(item)}
                onClick={() => toggleEquipment(item)}
                surface={surface}
              >
                {item}
              </ToggleChip>
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection title="Nutrition and limitations" description="Keep this simple and practical." surface={surface}>
        <Field label="Dietary preference" surface={surface}>
          <input
            className={inputClass(surface)}
            value={values.dietary_preference}
            onChange={(event) => setValue("dietary_preference", event.target.value)}
            placeholder="standard, vegetarian, vegan, pescatarian..."
          />
        </Field>

        <Field label="Injuries or limitations" surface={surface} hint="The coach will avoid risky suggestions, but this is not medical advice.">
          <textarea
            className={`${inputClass(surface)} min-h-28 resize-y`}
            value={values.injuries}
            onChange={(event) => setValue("injuries", event.target.value)}
            placeholder="Example: knee pain, limited shoulder mobility, no jumping"
          />
        </Field>
      </FormSection>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--fc-accent)] px-5 py-3.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_18px_44px_rgba(34,197,94,0.18)] transition hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? "Saving..." : submitLabel || (setup ? "Create my plan" : "Save profile")}
        {!saving ? (setup ? <ArrowRight className="h-4 w-4" /> : <Save className="h-4 w-4" />) : null}
      </button>
    </form>
  );
}
