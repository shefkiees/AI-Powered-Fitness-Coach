"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Sparkles, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  type FitnessProfileRow,
  fetchFitnessProfile,
} from "@/lib/fitnessProfiles";
import { WORKOUT_PREFERENCE_LABELS } from "@/lib/profileOptions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PersonalizedTrainingPlan } from "@/components/dashboard/PersonalizedTrainingPlan";
import { WorkoutPlansGrid } from "@/components/dashboard/WorkoutPlansGrid";
import { DailyTips } from "@/components/dashboard/DailyTips";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { CoachChat } from "@/components/dashboard/CoachChat";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { cn } from "@/lib/cn";

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose weight",
  build_muscle: "Build muscle",
  stay_fit: "Stay fit",
  maintain: "Stay fit",
  general_fitness: "Stay fit",
};

const ACTIVITY_LABELS: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  sedentary: "Low",
  light: "Low",
  active: "High",
  athlete: "High",
};

const GENDER_LABELS: Record<string, string> = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  prefer_not_say: "Prefer not to say",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-800" />
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
            </div>
          </div>
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-800" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-72 animate-pulse rounded-2xl bg-slate-900/80 lg:h-auto",
                i === 1 && "lg:col-span-3",
                i === 2 && "lg:col-span-6",
                i === 3 && "lg:col-span-3",
              )}
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-900/80" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-900/80 lg:col-span-3" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-900/80 lg:col-span-2" />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<FitnessProfileRow | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState("");

  const displayName = useMemo(() => {
    const meta = user?.user_metadata as { full_name?: string } | undefined;
    return meta?.full_name?.trim() || null;
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    fetchFitnessProfile(user.id).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setLoadError("");
      setProfile(data);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || profile === undefined) return;
    if (!loadError && profile === null) {
      router.replace("/onboarding");
    }
  }, [authLoading, profile, loadError, router]);

  if (authLoading || profile === undefined) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  if (loadError && profile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] p-4">
        <Card className="max-w-md border-red-500/30 bg-red-950/20 text-red-100">
          <p className="font-semibold">Could not load your profile</p>
          <p className="mt-2 text-sm text-red-200/90">{loadError}</p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => router.refresh()}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#070b12] text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-400" />
        <p className="text-sm">Taking you to onboarding…</p>
      </div>
    );
  }

  const workoutFocusLabel =
    WORKOUT_PREFERENCE_LABELS[profile.workout_preference] ??
    WORKOUT_PREFERENCE_LABELS.full_body;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(163,230,53,0.07),transparent)]"
        aria-hidden
      />

      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-lime-500/25 bg-gradient-to-br from-lime-500 to-emerald-600 shadow-lg shadow-lime-900/25">
              {profile.profile_image ? (
                <Image
                  src={profile.profile_image}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-400/90">
                Dashboard
              </p>
              <h1 className="truncate text-lg font-bold text-white sm:text-xl">
                {displayName ? `Hi, ${displayName}` : "Your training hub"}
              </h1>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/90 bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition hover:border-lime-500/40 hover:bg-slate-900"
            >
              <User className="h-4 w-4 text-lime-400" />
              Edit profile
            </Link>
            <Link
              href="/pose-estimation"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/90 bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-lime-500/40"
            >
              <Camera className="h-4 w-4 text-lime-400" />
              Pose lab
            </Link>
            <Button
              variant="secondary"
              className="shrink-0 border-slate-700 bg-slate-900/90"
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 py-8 pb-16">
        {loadError ? (
          <Card className="border-amber-500/30 bg-amber-950/20 text-amber-100">
            <p className="font-medium">Could not refresh profile data.</p>
            <p className="mt-1 text-sm text-amber-200/80">{loadError}</p>
          </Card>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          <Card className="border-slate-700/60 bg-slate-900/40 shadow-xl shadow-black/20 backdrop-blur-sm lg:col-span-3">
            <h2 className="text-lg font-bold text-white">Profile summary</h2>
            <p className="mt-1 text-xs text-slate-500">
              Visible only to you · from Supabase
            </p>
            <div className="mt-5 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                {profile.profile_image ? (
                  <Image
                    src={profile.profile_image}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              <Field
                label="Gender"
                value={GENDER_LABELS[profile.gender] ?? profile.gender}
              />
              <Field label="Age" value={`${profile.age} yrs`} />
              <Field label="Weight" value={`${profile.weight} kg`} />
              <Field label="Height" value={`${profile.height} cm`} />
              <Field
                label="Goal"
                value={GOAL_LABELS[profile.goal] ?? profile.goal}
              />
              <Field
                label="Activity"
                value={
                  ACTIVITY_LABELS[profile.activity_level] ??
                  profile.activity_level
                }
              />
              <Field label="Focus" value={workoutFocusLabel} />
            </div>
            <Button
              variant="secondary"
              type="button"
              className="mt-6 w-full border-slate-700"
              onClick={() => router.push("/profile")}
            >
              Update profile
            </Button>
          </Card>

          <div className="min-h-0 lg:col-span-6">
            <PersonalizedTrainingPlan profile={profile} />
          </div>

          <div className="flex min-h-[560px] flex-col gap-6 lg:col-span-3 lg:min-h-0">
            <DailyTips profile={profile} />
            <div className="flex min-h-[420px] flex-1 flex-col">
              <CoachChat />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <PoseCameraPreview embedded className="h-full border-slate-700/60" />
          </div>
          <Card className="flex flex-col justify-center border-slate-700/60 bg-slate-900/40 p-6 lg:col-span-5">
            <h3 className="text-lg font-semibold text-white">Form check</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Use your camera for a live preview. Full-screen pose lab with extra
              guidance lives on the dedicated page—great before leg or upper-body
              days.
            </p>
            <Link
              href="/pose-estimation"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-lime-900/30 transition hover:brightness-105"
            >
              <Camera className="h-4 w-4" />
              Open pose lab
            </Link>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-3">
            <WorkoutPlansGrid />
          </div>
          <div className="lg:col-span-2">
            <ProgressOverview profile={profile} />
          </div>
        </section>
      </main>
    </div>
  );
}
