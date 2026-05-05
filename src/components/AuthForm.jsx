"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { persistCoachOnboarding } from "@/lib/persistCoachOnboarding";
import { supabaseConfigError, requireSupabase } from "@/src/lib/supabaseClient";
import {
  ensureProfile,
  getProfile,
  isProfileComplete,
} from "@/src/utils/supabaseData";
import EmptyState from "@/src/components/EmptyState";
import PulseLogo from "@/src/components/PulseLogo";
import PulsePhoneShowcase from "@/src/components/PulsePhoneShowcase";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { signIn, signUp, resendConfirmation, user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const params = new URLSearchParams(window.location.search);
    return params.get("next") || "/dashboard";
  }, []);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    void (async () => {
      try {
        const client = requireSupabase();
        const display =
          user.user_metadata?.full_name?.trim?.() ||
          user.email?.split("@")?.[0] ||
          "";
        await persistCoachOnboarding(user, client, display);
        await ensureProfile(user, display);
        const profile = await getProfile();
        if (!cancelled) {
          const dest = isProfileComplete(profile) ? nextPath : "/profile-setup";
          window.location.replace(dest);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, nextPath]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setNeedsConfirmation(false);

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignup && name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      const result = isSignup
        ? await signUp(email.trim(), password, name.trim())
        : await signIn(email.trim(), password);

      if (result.error) {
        const message = result.error.message || "Authentication failed.";
        const lower = message.toLowerCase();
        if (!isSignup && lower.includes("invalid login credentials")) {
          setNeedsConfirmation(true);
          setError(
            "Email ose password gabim. Nese sapo e krijove account-in, konfirmo email-in nga inbox-i pastaj provo prape.",
          );
        } else if (!isSignup && lower.includes("email not confirmed")) {
          setNeedsConfirmation(true);
          setError("Email-i nuk eshte konfirmuar ende. Hape linkun e Supabase ne inbox dhe pastaj provo sign in.");
        } else {
          setError(message);
        }
        setSubmitting(false);
        return;
      }

      if (isSignup && !result.session) {
        setNeedsConfirmation(true);
        setNotice(
          "Account-i u krijua. Supabase kerkon konfirmim email-i: hape linkun ne inbox, pastaj kthehu te sign in.",
        );
        setSubmitting(false);
        return;
      }

      if (!result.session) {
        setError("Nuk ka session aktive. Provo login perseri.");
        setSubmitting(false);
        return;
      }

      const client = requireSupabase();
      const u = result.session.user;
      await persistCoachOnboarding(u, client, name.trim());
      await ensureProfile(u, name.trim());
      const profile = await getProfile();
      window.location.replace(isProfileComplete(profile) ? nextPath : "/profile-setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  const resendEmail = async () => {
    setError("");
    setNotice("");

    if (!email.includes("@")) {
      setError("Shkruaje email-in qe perdore per signup.");
      return;
    }

    setResending(true);
    try {
      const result = await resendConfirmation(email.trim());
      if (result.error) {
        setError(result.error.message || "Nuk u dergua email-i i konfirmimit.");
        return;
      }
      setNeedsConfirmation(true);
      setNotice("Email-i i konfirmimit u dergua prape. Kontrollo inbox/spam.");
    } finally {
      setResending(false);
    }
  };

  if (supabaseConfigError) {
    return <EmptyState title="Supabase configuration missing" description={supabaseConfigError} />;
  }

  return (
    <div className="pulse-page min-h-screen text-white">
      <main className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="pulse-panel rounded-[1.75rem] p-6 sm:p-8">
          <PulseLogo />

          <div className="mt-10">
            <p className="pulse-kicker">
              {isSignup ? "Create account" : "Welcome back"}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              {isSignup ? "Build your fitness profile." : "Sign in to your coach."}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--fc-muted)]">
              {isSignup
                ? "Your account unlocks personalized workouts, nutrition targets, progress tracking, and goals."
                : "Continue your workouts, update progress, and keep your plan moving."}
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            {notice ? (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {notice}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
            {needsConfirmation ? (
              <button
                type="button"
                onClick={resendEmail}
                disabled={resending}
                className="rounded-2xl border border-emerald-300/20 bg-black/20 px-4 py-3 text-left text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/10 disabled:opacity-60"
              >
                {resending ? "Duke derguar..." : "Dergo prape email-in e konfirmimit"}
              </button>
            ) : null}

            {isSignup ? (
              <label className="grid gap-2 text-sm font-semibold text-white">
                Name
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fc-muted)]" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="pulse-input py-3.5 pl-11 pr-4"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </span>
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-semibold text-white">
              Email
              <span className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fc-muted)]" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pulse-input py-3.5 pl-11 pr-4"
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-white">
              Password
              <span className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pulse-input py-3.5 pl-4 pr-12"
                  placeholder="At least 6 characters"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--fc-muted)] transition hover:bg-white/[0.06] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center gap-3 rounded-full bg-[var(--fc-accent)] px-5 py-3.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_18px_44px_rgba(184,245,61,0.2)] transition hover:bg-[var(--fc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Please wait..." : isSignup ? "Create account" : "Login"}
              {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--fc-muted)]">
            {isSignup ? "Already have an account?" : "No account yet?"}{" "}
            <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-white transition hover:text-[var(--fc-accent)]">
              {isSignup ? "Login" : "Create one"}
            </Link>
          </p>
        </section>

        <section className="hidden lg:block">
          <PulsePhoneShowcase compact />
        </section>
      </main>
    </div>
  );
}
