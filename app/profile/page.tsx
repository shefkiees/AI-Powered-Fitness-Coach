"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchFitnessProfile,
  saveFitnessProfile,
  type FitnessProfileInput,
} from "@/lib/fitnessProfiles";
import {
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  ACTIVITY_OPTIONS,
  WORKOUT_PREFERENCE_OPTIONS,
} from "@/lib/profileOptions";
import {
  uploadProfileImage,
  removeProfileImageFromStorage,
} from "@/lib/profileImageStorage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

function SelectGrid({
  options,
  value,
  onChange,
}: {
  options: readonly { id: string; label: string; sub?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition hover:border-teal-500/40",
              selected
                ? "border-teal-500/80 bg-teal-950/50 ring-2 ring-teal-500/30"
                : "border-slate-600 bg-slate-950/40",
            )}
          >
            <span className="font-semibold text-slate-100">{opt.label}</span>
            {opt.sub ? (
              <span className="mt-1 block text-xs text-slate-400">{opt.sub}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

type ProfileLoadState = "loading" | "error" | "missing" | "ready";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loadState, setLoadState] = useState<ProfileLoadState>("loading");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [gender, setGender] = useState("prefer_not_say");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState("stay_fit");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [workoutPreference, setWorkoutPreference] = useState("full_body");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageToDeleteOnSave, setImageToDeleteOnSave] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/profile");
      return;
    }
    let cancelled = false;
    fetchFitnessProfile(user.id).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setLoadError(err);
        setLoadState("error");
        return;
      }
      if (!data) {
        setLoadState("missing");
        return;
      }
      setGender(data.gender);
      setAge(String(data.age));
      setWeight(String(data.weight));
      setHeight(String(data.height));
      setGoal(data.goal);
      setActivityLevel(data.activity_level);
      setWorkoutPreference(data.workout_preference || "full_body");
      setProfileImageUrl(data.profile_image);
      setLoadState("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const previewUrl = useMemo(() => {
    if (!pendingFile) return null;
    return URL.createObjectURL(pendingFile);
  }, [pendingFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    const ageN = parseInt(age, 10);
    const weightN = parseFloat(weight);
    const heightN = parseFloat(height);
    if (Number.isNaN(ageN) || ageN < 13 || ageN > 100) {
      setError("Enter a valid age (13–100).");
      return;
    }
    if (Number.isNaN(weightN) || weightN <= 0 || weightN >= 500) {
      setError("Enter a valid weight.");
      return;
    }
    if (Number.isNaN(heightN) || heightN <= 0 || heightN >= 300) {
      setError("Enter a valid height (cm).");
      return;
    }

    setSaving(true);
    if (imageToDeleteOnSave) {
      await removeProfileImageFromStorage(imageToDeleteOnSave);
      setImageToDeleteOnSave(null);
    }

    let nextImageUrl = profileImageUrl;

    if (pendingFile) {
      const { publicUrl, error: upErr } = await uploadProfileImage(
        user.id,
        pendingFile,
      );
      if (upErr || !publicUrl) {
        setSaving(false);
        setError(upErr ?? "Upload failed.");
        return;
      }
      if (profileImageUrl && profileImageUrl !== publicUrl) {
        await removeProfileImageFromStorage(profileImageUrl);
      }
      nextImageUrl = publicUrl;
      setProfileImageUrl(publicUrl);
      setPendingFile(null);
    }

    const payload: FitnessProfileInput = {
      gender,
      age: ageN,
      weight: weightN,
      height: heightN,
      goal,
      activity_level: activityLevel,
      workout_preference: workoutPreference,
      profile_image: nextImageUrl,
    };

    const { error: saveErr } = await saveFitnessProfile(user.id, payload);
    setSaving(false);
    if (saveErr) {
      setError(saveErr);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1400);
  };

  const clearPhoto = () => {
    if (profileImageUrl) setImageToDeleteOnSave(profileImageUrl);
    setPendingFile(null);
    setProfileImageUrl(null);
  };

  if (authLoading || loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-400" />
      </div>
    );
  }

  if (!user) return null;

  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-20">
          <Card className="border-red-500/30 bg-red-950/20 text-red-200">
            Could not load your profile. {loadError}
          </Card>
          <Link
            href="/dashboard"
            className="text-center text-sm text-teal-400 hover:text-teal-300"
          >
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (loadState === "missing") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-20">
          <Card className="text-center">
            <h1 className="text-lg font-semibold text-white">
              Fitness profile not found
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Complete onboarding first so we can save your stats and photo.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition hover:brightness-105"
            >
              Go to onboarding
            </Link>
            <Link
              href="/dashboard"
              className="mt-3 block text-sm text-slate-500 hover:text-teal-300"
            >
              Back to dashboard
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-teal-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400/90">
            Profile
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Edit fitness profile</h1>
          <p className="mt-2 text-sm text-slate-400">
            Update your stats and profile photo. Changes sync to your dashboard and coach.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-8">
          {success ? (
            <div
              className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              Profile saved. Redirecting to your dashboard…
            </div>
          ) : null}

          <Card className="space-y-4 border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/20">
            <h2 className="text-lg font-semibold text-white">Profile photo</h2>
            <p className="text-sm text-slate-500">
              Drag and drop an image here, or browse. Max 5 MB (JPEG, PNG, WebP,
              GIF).
            </p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600">
                    <User className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && /^image\/(jpeg|png|webp|gif)$/i.test(f.type)) {
                    setPendingFile(f);
                  }
                }}
                className={cn(
                  "flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
                  dragActive
                    ? "border-teal-400/70 bg-teal-500/10"
                    : "border-slate-600 bg-slate-950/40 hover:border-slate-500",
                )}
              >
                <ImagePlus className="mb-2 h-8 w-8 text-slate-500" />
                <p className="text-sm text-slate-400">
                  Drop your photo here or{" "}
                  <label className="cursor-pointer font-semibold text-teal-400 hover:text-teal-300">
                    browse
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPendingFile(f ?? null);
                      }}
                    />
                  </label>
                </p>
              </div>
            </div>
            {(profileImageUrl || pendingFile) && (
              <Button
                type="button"
                variant="ghost"
                className="self-start px-0 text-sm text-red-300 hover:text-red-200"
                onClick={clearPhoto}
              >
                Remove photo
              </Button>
            )}
          </Card>

          <Card className="space-y-4 border-slate-700/80">
            <h2 className="text-lg font-semibold text-white">Gender</h2>
            <SelectGrid
              options={GENDER_OPTIONS}
              value={gender}
              onChange={setGender}
            />
          </Card>

          <Card className="space-y-4 border-slate-700/80">
            <Input
              label="Age"
              type="number"
              min={13}
              max={100}
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              min={1}
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              step="0.5"
              min={50}
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </Card>

          <Card className="space-y-4 border-slate-700/80">
            <h2 className="text-lg font-semibold text-white">Goal</h2>
            <SelectGrid
              options={GOAL_OPTIONS}
              value={goal}
              onChange={setGoal}
            />
          </Card>

          <Card className="space-y-4 border-slate-700/80">
            <h2 className="text-lg font-semibold text-white">Activity level</h2>
            <SelectGrid
              options={ACTIVITY_OPTIONS}
              value={activityLevel}
              onChange={setActivityLevel}
            />
          </Card>

          <Card className="space-y-4 border-slate-700/80">
            <h2 className="text-lg font-semibold text-white">Workout focus</h2>
            <p className="text-sm text-slate-500">
              Shapes your generated main workout emphasis.
            </p>
            <SelectGrid
              options={WORKOUT_PREFERENCE_OPTIONS}
              value={workoutPreference}
              onChange={setWorkoutPreference}
            />
          </Card>

          {error ? (
            <div
              className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={saving}
              disabled={success}
            >
              Save changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
