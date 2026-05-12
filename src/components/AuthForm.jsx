"use client";

import Image from "next/image";
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#010503] text-white">
      <Image
        src="/pulse-assets/hero-athlete.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover opacity-[0.62]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(1,5,3,0.78),rgba(1,8,5,0.54)_44%,rgba(1,5,3,0.92))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,197,94,0.28),transparent_30%),radial-gradient(circle_at_78%_26%,rgba(16,185,129,0.26),transparent_28%),radial-gradient(circle_at_72%_82%,rgba(132,204,22,0.16),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),radial-gradient(rgba(134,239,172,0.28)_1px,transparent_1px)] [background-size:56px_56px,56px_56px,18px_18px]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:justify-end lg:px-16 xl:px-24">
        <section className="w-full max-w-[440px] rounded-[28px] border border-emerald-200/18 bg-[#03100a]/62 p-6 shadow-[0_32px_120px_rgba(0,0,0,0.58),0_0_60px_rgba(52,211,153,0.16)] backdrop-blur-2xl sm:p-8">
          <Link href="/" className="inline-flex text-xs font-black uppercase tracking-[0.22em] text-emerald-200 transition hover:text-emerald-100">
            AI Fitness Coach
          </Link>

          <div className="mt-12">
            <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white">
              {heading}
            </h1>
            <p className="mt-4 text-base leading-7 text-emerald-50/62">{description}</p>
          </div>

          <form onSubmit={submit} className="mt-9 space-y-4">
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
                        className="w-full rounded-[1.15rem] border border-emerald-200/14 bg-black/32 py-4 pl-11 pr-4 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/30 focus:border-emerald-300/75 focus:bg-emerald-300/6 focus:ring-4 focus:ring-emerald-300/12"
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
                      className="w-full rounded-[1.15rem] border border-emerald-200/14 bg-black/32 py-4 pl-11 pr-4 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/30 focus:border-emerald-300/75 focus:bg-emerald-300/6 focus:ring-4 focus:ring-emerald-300/12"
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
                      className="w-full rounded-[1.15rem] border border-emerald-200/14 bg-black/32 py-4 pl-11 pr-12 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-white/30 focus:border-emerald-300/75 focus:bg-emerald-300/6 focus:ring-4 focus:ring-emerald-300/12"
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
                  className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-[1.15rem] bg-emerald-400 px-5 py-4 text-sm font-black text-emerald-950 shadow-[0_18px_50px_rgba(52,211,153,0.34),0_0_30px_rgba(52,211,153,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
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
