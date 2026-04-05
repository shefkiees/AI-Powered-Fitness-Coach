"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchFitnessProfile } from "@/lib/fitnessProfiles";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      startTransition(() => {
        setChecking(false);
        setLoadError(null);
      });
      return;
    }

    let cancelled = false;
    startTransition(() => {
      setChecking(true);
      setLoadError(null);
    });

    fetchFitnessProfile(user.id).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error);
        setChecking(false);
        return;
      }
      if (data) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
      setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || (user && checking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fc-bg-page)] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--fc-accent)]/30 border-t-[var(--fc-accent)]" />
          <p className="text-sm">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    const isPermission =
      loadError.toLowerCase().includes("permission denied") ||
      loadError.toLowerCase().includes("rls");
    const isSchema =
      loadError.includes("activity_level") ||
      loadError.includes("schema cache") ||
      loadError.includes("column");

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--fc-bg-page)] p-4">
        <Card className="max-w-lg border-red-500/20 bg-slate-900/90">
          <h1 className="text-lg font-semibold text-white">Database setup required</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {isPermission
              ? "Your Supabase roles need SELECT on fitness_profiles, and RLS policies must allow auth.uid() = user_id. "
              : null}
            {isSchema
              ? "The fitness_profiles table must include columns matching the app (including activity_level and workout_preference). "
              : null}
            {!isPermission && !isSchema ? loadError : null}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Run the latest migrations in Supabase → SQL Editor, then reload.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => router.refresh()}>
              Retry
            </Button>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              Go to onboarding
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--fc-bg-page)] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#0c1222_0%,#070b12_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[var(--fc-accent)]/12 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--fc-accent)] to-[var(--fc-accent-2)] shadow-lg shadow-lime-900/40">
            <Sparkles className="h-5 w-5 text-slate-950" />
          </span>
          <span className="text-[11px] font-bold uppercase leading-tight tracking-[0.18em] text-[var(--fc-accent)] sm:text-xs">
            AI FITNESS COACH
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-accent)]/35 bg-[var(--fc-accent)]/10 px-3 py-1 text-xs font-medium text-lime-100">
              <Zap className="h-3.5 w-3.5" />
              Onboarding-first · Private by design
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Train smarter with a coach that knows your goals.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              Personalized workouts, daily tips, and an AI coach—after a quick
              questionnaire so we never guess your starting point.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/signup">
                <Button className="gap-2 px-8 py-3.5 text-base shadow-xl shadow-lime-900/40">
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="border-slate-600 bg-slate-900/80 px-8 py-3.5 text-base"
                >
                  I already have an account
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-slate-600">
              Flow: sign up → onboarding → dashboard. No paywall in this demo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <Card className="border-slate-700/50 bg-slate-950/80 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-white">
                  What you unlock
                </h2>
                <ul className="mt-5 space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--fc-accent)]/20 text-center text-xs font-bold leading-5 text-lime-200">
                      1
                    </span>
                    <span>
                      <strong className="text-white">Guided onboarding</strong>{" "}
                      — gender, stats, goals, activity, and workout focus.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--fc-accent)]/20 text-center text-xs font-bold leading-5 text-lime-200">
                      2
                    </span>
                    <span>
                      <strong className="text-white">Adaptive plan</strong> —
                      warm-up, main work, and cooldown that shift with your
                      preferences.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--fc-accent)]/20 text-center text-xs font-bold leading-5 text-lime-200">
                      3
                    </span>
                    <span>
                      <strong className="text-white">Coach chat & pose lab</strong>{" "}
                      — ask questions and check form with your camera when
                      you&apos;re ready.
                    </span>
                  </li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
