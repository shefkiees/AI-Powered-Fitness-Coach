"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { persistCoachOnboarding } from "@/lib/persistCoachOnboarding";
import { supabaseConfigError, requireSupabase } from "@/src/lib/supabaseClient";
import {
  ensureProfile,
  getProfile,
  isProfileComplete,
} from "@/src/utils/supabaseData";
import EmptyState from "@/src/components/EmptyState";

const authBenefits = [
  "Personalized training plans",
  "Progress saved across devices",
  "Secure Supabase authentication",
];

const trustItems = [
  { value: "AI", label: "guided plans" },
  { value: "24/7", label: "coach access" },
  { value: "100%", label: "private profile" },
];

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

  const heading = isSignup ? "Create your coach account." : "Welcome back to your coach.";
  const description = isSignup
    ? "Set up a secure account and continue into your personalized profile."
    : "Sign in to continue your workouts, progress, and AI recommendations.";
  const submitText = isSignup ? "Create account" : "Login";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b07] text-white">
      <main className="relative isolate flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(34,197,94,0.22),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.18),transparent_30%),linear-gradient(180deg,#071009_0%,#030604_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_28px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden border-r border-white/10 bg-[#07130b] p-8 lg:flex">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-400/15 to-transparent" />
            <div className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative">
              <Link href="/" className="inline-flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3 transition hover:border-emerald-300/40 hover:bg-white/[0.09]">
                <Image
                  src="/brand/ai-fitness-coach-icon.svg"
                  width={38}
                  height={38}
                  alt="AI Fitness Coach"
                  priority
                  className="h-9 w-9"
                />
                <span className="text-sm font-black uppercase tracking-[0.08em] text-emerald-100">
                  AI Fitness Coach
                </span>
              </Link>

              <div className="mt-12 max-w-md">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Secure member area
                </p>
                <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.05em] text-white">
                  Train smarter with a coach that remembers you.
                </h1>
                <p className="mt-5 text-base leading-8 text-white/[0.62]">
                  Your workouts, goals, and profile stay connected after every sign in.
                  Clean, focused, and built for consistent progress.
                </p>
              </div>

              <div className="mt-10 grid gap-3">
                {authBenefits.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/[0.86]"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-none text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-3">
              {trustItems.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                  <p className="text-2xl font-black tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/45">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <section className="p-5 sm:p-8 lg:p-10">
            <div className="mx-auto flex min-h-[620px] w-full max-w-md flex-col justify-center">
              <Link href="/" className="mb-8 inline-flex w-fit items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-3 py-2 transition hover:border-emerald-300/40 hover:bg-white/[0.09] lg:hidden">
                <Image
                  src="/brand/ai-fitness-coach-icon.svg"
                  width={34}
                  height={34}
                  alt="AI Fitness Coach"
                  priority
                  className="h-8 w-8"
                />
                <span className="text-xs font-black uppercase tracking-[0.08em] text-emerald-100">
                  AI Fitness Coach
                </span>
              </Link>

              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                  {isSignup ? <Dumbbell className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {isSignup ? "Start your plan" : "Member login"}
                </p>
                <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl">
                  {heading}
                </h2>
                <p className="mt-4 text-base leading-7 text-white/[0.55]">{description}</p>
              </div>

              <form onSubmit={submit} className="mt-8 space-y-4">
                {notice ? (
                  <div className="rounded-[1.1rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-50">
                    {notice}
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-[1.1rem] border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-50" role="alert">
                    {error}
                  </div>
                ) : null}
                {needsConfirmation ? (
                  <button
                    type="button"
                    onClick={resendEmail}
                    disabled={resending}
                    className="w-full rounded-[1.1rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-left text-sm font-bold text-emerald-50 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resending ? "Duke derguar..." : "Dergo prape email-in e konfirmimit"}
                  </button>
                ) : null}

                {isSignup ? (
                  <label className="block text-sm font-bold text-white">
                    <span>Name</span>
                    <span className="relative mt-2 block">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-[1.15rem] border border-white/[0.12] bg-black/25 py-4 pl-11 pr-4 text-base font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-emerald-300/10"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </span>
                  </label>
                ) : null}

                <label className="block text-sm font-bold text-white">
                  <span>Email</span>
                  <span className="relative mt-2 block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-[1.15rem] border border-white/[0.12] bg-black/25 py-4 pl-11 pr-4 text-base font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-emerald-300/10"
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </span>
                </label>

                <label className="block text-sm font-bold text-white">
                  <span>Password</span>
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-[1.15rem] border border-white/[0.12] bg-black/25 py-4 pl-11 pr-12 text-base font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-emerald-300/10"
                      placeholder="At least 6 characters"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[0.95rem] text-white/45 transition hover:bg-white/[0.07] hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-[1.15rem] bg-emerald-400 px-5 py-4 text-sm font-black text-emerald-950 shadow-[0_18px_50px_rgba(52,211,153,0.22)] transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {submitText}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-sm text-white/[0.52]">
                {isSignup ? "Already have an account?" : "No account yet?"}{" "}
                <Link
                  href={isSignup ? "/login" : "/signup"}
                  className="font-black text-white transition hover:text-emerald-300"
                >
                  {isSignup ? "Login" : "Create one"}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
