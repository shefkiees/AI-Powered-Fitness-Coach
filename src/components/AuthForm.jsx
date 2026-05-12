"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { persistCoachOnboarding } from "@/lib/persistCoachOnboarding";
import { supabaseConfigError, requireSupabase } from "@/src/lib/supabaseClient";
import {
  ensureProfile,
  getProfile,
  isProfileComplete,
} from "@/src/services/profileService";
import EmptyState from "@/src/components/EmptyState";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { signIn, signUp, resendConfirmation } = useAuth();
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
    const next = params.get("next") || "/dashboard";
    return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  }, []);

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

  const heading = isSignup ? "Create account" : "Welcome back";
  const description = isSignup ? "Start your training journey." : "Continue your training journey.";
  const submitText = isSignup ? "Create account" : "Login";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020503] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(8,27,18,0.92),transparent_42%),linear-gradient(135deg,#010302_0%,#07130d_46%,#010302_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_56%_32%,rgba(52,211,153,0.13),transparent_24%),radial-gradient(circle_at_38%_72%,rgba(16,185,129,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.52)_72%,rgba(0,0,0,0.86)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),radial-gradient(rgba(134,239,172,0.24)_1px,transparent_1px)] [background-size:64px_64px,64px_64px,22px_22px]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-[92%] max-w-[440px] rounded-[28px] border border-[rgba(52,211,153,0.22)] bg-[rgba(3,15,10,0.72)] p-10 shadow-[0_28px_90px_rgba(0,0,0,0.48),0_0_42px_rgba(52,211,153,0.10)] backdrop-blur-[24px] sm:p-12">
          <Link href="/" className="inline-flex text-[0.68rem] font-black uppercase tracking-[0.24em] text-emerald-200/90 transition hover:text-emerald-100">
            AI FITNESS COACH
          </Link>

          <div className="mt-10">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.04em] text-white">
              {heading}
            </h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/58">{description}</p>
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
                  <label className="block text-sm font-bold text-emerald-50">
                    <span>Name</span>
                    <span className="relative mt-2 block">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="h-[54px] w-full rounded-[1rem] border border-white/12 bg-black/30 pl-11 pr-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/28 focus:border-emerald-300/70 focus:bg-emerald-300/6 focus:ring-4 focus:ring-emerald-300/12"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </span>
                  </label>
                ) : null}

                <label className="block text-sm font-bold text-emerald-50">
                  <span>Email</span>
                  <span className="relative mt-2 block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-[54px] w-full rounded-[1rem] border border-white/12 bg-black/30 pl-11 pr-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/28 focus:border-emerald-300/70 focus:bg-emerald-300/6 focus:ring-4 focus:ring-emerald-300/12"
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </span>
                </label>

                <label className="block text-sm font-bold text-emerald-50">
                  <span>Password</span>
                  <span className="relative mt-2 block">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-[54px] w-full rounded-[1rem] border border-white/12 bg-black/30 pl-11 pr-12 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/28 focus:border-emerald-300/70 focus:bg-emerald-300/6 focus:ring-4 focus:ring-emerald-300/12"
                      placeholder="At least 6 characters"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[0.95rem] text-white/48 transition hover:bg-emerald-300/10 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-[1rem] bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 px-5 text-sm font-black text-emerald-950 shadow-[0_18px_45px_rgba(52,211,153,0.22)] transition hover:-translate-y-px hover:shadow-[0_22px_52px_rgba(52,211,153,0.28)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
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

          <p className="mt-6 text-center text-sm text-white/[0.58]">
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-black text-white transition hover:text-emerald-300"
            >
              {isSignup ? "Login" : "Create one"}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
