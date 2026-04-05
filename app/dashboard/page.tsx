"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, LogOut, Sparkles, User, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  type FitnessProfileRow,
  fetchFitnessProfile,
} from "@/lib/fitnessProfiles";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PersonalizedTrainingPlan } from "@/components/dashboard/PersonalizedTrainingPlan";
import { WorkoutPlansGrid } from "@/components/dashboard/WorkoutPlansGrid";
import { DailyTips } from "@/components/dashboard/DailyTips";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { CoachChat } from "@/components/dashboard/CoachChat";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { cn } from "@/lib/cn";
import { WorkoutTimerCard } from "@/components/dashboard/WorkoutTimerCard";
import { DailyGoalsCard } from "@/components/dashboard/DailyGoalsCard";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { ProfileSummaryCard } from "@/components/dashboard/ProfileSummaryCard";
import { pushTimelineEvent } from "@/lib/localFitnessState";
import { AuthenticatedScaffold } from "@/components/layout/AuthenticatedScaffold";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardDailyStats } from "@/components/dashboard/DashboardDailyStats";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--fc-bg-page)] text-slate-100">
      <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-8 lg:px-6">
        <div className="h-28 rounded-3xl bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-white/5" />
      </div>
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
  const [goalsTick, setGoalsTick] = useState(0);
  const [timelineTick, setTimelineTick] = useState(0);

  const displayName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() ||
    null;

  const bumpGoals = useCallback(() => setGoalsTick((t) => t + 1), []);
  const bumpTimeline = useCallback(() => setTimelineTick((t) => t + 1), []);

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--fc-bg-page)] p-4">
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--fc-bg-page)] text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--fc-accent)]/30 border-t-[var(--fc-accent)]" />
        <p className="text-sm">Taking you to onboarding…</p>
      </div>
    );
  }

  const firstName = displayName?.split(/\s+/)[0] ?? null;

  return (
    <AuthenticatedScaffold>
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--fc-accent)]/30 bg-gradient-to-br from-[var(--fc-accent)] to-cyan-500 shadow-lg shadow-lime-900/25 ring-2 ring-white/5 transition duration-300 hover:ring-[var(--fc-accent)]/20">
              {profile.profile_image ? (
                <Image
                  src={profile.profile_image}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <Sparkles className="h-8 w-8 text-slate-950" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/90">
                AI Fitness Control Center
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/workout"
              className={cn(
                "group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--fc-accent)] via-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-lime-900/30 transition-all duration-300",
                "hover:shadow-[0_0_32px_rgba(34,211,238,0.35),0_0_48px_rgba(163,230,53,0.2)] hover:brightness-110",
                "sm:flex-initial",
              )}
            >
              <Zap className="h-4 w-4 transition group-hover:scale-110" />
              Quick start workout
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-all duration-300 hover:border-[var(--fc-accent)]/35 hover:bg-white/[0.08]"
            >
              <User className="h-4 w-4 text-[var(--fc-accent)]" />
              Profile
            </Link>
            <Button
              variant="secondary"
              className="shrink-0 border-slate-600 bg-slate-900/80"
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
      </motion.header>

      <div className="space-y-14 pb-8">
        {loadError ? (
          <Card className="border-amber-500/30 bg-amber-950/20 text-amber-100">
            <p className="font-medium">Could not refresh profile data.</p>
            <p className="mt-1 text-sm text-amber-200/80">{loadError}</p>
          </Card>
        ) : null}

        <DashboardSection
          id="daily-overview"
          title="Daily overview"
          subtitle="Workouts saved to your account, estimated energy, and your current streak."
        >
          <DashboardDailyStats
            profile={profile}
            goalsRefresh={goalsTick}
          />
        </DashboardSection>

        <DashboardSection
          id="ai-coach"
          title="AI FITNESS COACH"
          subtitle="Your personal coach—plans, motivation, and answers tuned to how you train."
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border-2 border-[var(--fc-accent)]/40 bg-gradient-to-b from-[var(--fc-accent)]/12 via-cyan-500/5 to-transparent p-[2px] shadow-[0_0_40px_rgba(163,230,53,0.12)] backdrop-blur-sm transition duration-300 hover:border-[var(--fc-accent)]/55 hover:shadow-[0_0_48px_rgba(163,230,53,0.18)]"
          >
            <div className="rounded-[22px] bg-slate-950/90 p-1 sm:p-2">
              <div className="flex min-h-[480px] flex-col lg:min-h-[520px]">
                <CoachChat
                  coachDisplayName={displayName}
                  userId={user.id}
                />
              </div>
            </div>
          </motion.div>
        </DashboardSection>

        <DashboardSection
          id="today-activity"
          title="Today & activity"
          subtitle="Check off daily habits, run a quick timer block, and scan your timeline."
        >
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <div className="space-y-6 lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4 }}
              >
                <DailyGoalsCard
                  key={user.id}
                  userId={user.id}
                  onGoalsChange={() => {
                    bumpGoals();
                    bumpTimeline();
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: 0.06 }}
              >
                <WorkoutTimerCard
                  onSessionComplete={() => {
                    pushTimelineEvent(user.id, {
                      label: "Finished a timed workout block",
                      tone: "workout",
                    });
                    bumpTimeline();
                  }}
                />
              </motion.div>
            </div>
            <motion.div
              className="lg:col-span-8"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ActivityTimeline
                userId={user.id}
                refreshKey={timelineTick}
              />
            </motion.div>
          </div>
        </DashboardSection>

        <DashboardSection
          id="training-plan"
          title="This week's plan"
          subtitle="Warm-up, main work, and cooldown generated for your profile."
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="transition duration-300 hover:[&_.rounded-2xl]:border-white/10"
          >
            <PersonalizedTrainingPlan profile={profile} />
          </motion.div>
        </DashboardSection>

        <DashboardSection
          id="profile-tools"
          title="Profile & daily tips"
          subtitle="Your saved stats and a quick hit of guidance."
        >
          <div className="grid gap-6 lg:grid-cols-12">
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
            >
              <ProfileSummaryCard profile={profile} />
            </motion.div>
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.06 }}
            >
              <DailyTips profile={profile} />
            </motion.div>
          </div>
        </DashboardSection>

        <DashboardSection
          id="form-check"
          title="Live form check"
          subtitle="Quick camera preview—open the full lab for deeper sessions."
        >
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
            >
              <PoseCameraPreview
                embedded
                className="h-full border-white/10 bg-black/30 transition duration-300 hover:border-white/15"
              />
            </motion.div>
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.06 }}
            >
              <Card className="flex h-full flex-col justify-center border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition duration-300 hover:border-[var(--fc-accent)]/25 hover:shadow-lg hover:shadow-lime-900/10">
                <h3 className="text-lg font-semibold text-white">AI form lab</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Full-screen pose tracking with skeleton overlay and live cues—ideal
                  before leg or upper-body days.
                </p>
                <Link
                  href="/pose-estimation"
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--fc-accent)] to-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition duration-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"
                >
                  Open form lab
                </Link>
              </Card>
            </motion.div>
          </div>
        </DashboardSection>

        <DashboardSection
          id="library"
          title="Exercise library"
          subtitle="Browse movements by muscle group—technique first, always."
        >
          <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
            >
              <WorkoutPlansGrid />
            </motion.div>
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.06 }}
            >
              <ProgressOverview profile={profile} />
            </motion.div>
          </div>
        </DashboardSection>
      </div>
    </AuthenticatedScaffold>
  );
}
