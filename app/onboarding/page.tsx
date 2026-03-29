"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchFitnessProfile } from "@/lib/fitnessProfiles";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [gate, setGate] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let cancelled = false;
    fetchFitnessProfile(user.id).then(({ data }) => {
      if (cancelled) return;
      if (data) {
        router.replace("/dashboard");
        return;
      }
      setGate(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || gate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b12] py-10 pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#0c1222_0%,#070b12_50%)]" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(45,212,191,0.16),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 px-4">
        <header className="mx-auto mb-12 max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-400/90">
            AI Fitness Coach
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Let&apos;s personalize your plan
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Seven quick steps. Your answers unlock a tailored workout and coach
            experience—saved securely to your account.
          </p>
        </header>
        <OnboardingFlow />
      </div>
    </div>
  );
}
