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
    <div className="relative min-h-screen overflow-hidden bg-[#010302] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(22,101,52,0.16),transparent_38%),radial-gradient(ellipse_at_18%_78%,rgba(6,95,70,0.12),transparent_34%),radial-gradient(ellipse_at_86%_72%,rgba(20,83,45,0.10),transparent_30%),linear-gradient(145deg,#010302_0%,#06110b_48%,#010302_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 blur-[1px] [background-image:conic-gradient(from_160deg_at_50%_50%,rgba(52,211,153,0.08),transparent_18%,rgba(15,118,110,0.07),transparent_46%,rgba(132,204,22,0.05),transparent_70%,rgba(52,211,153,0.06))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(0,0,0,0.56)_72%,rgba(0,0,0,0.9)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:radial-gradient(rgba(255,255,255,0.55)_0.55px,transparent_0.55px)] [background-size:3px_3px]" />

      <Link
        href="/"
        aria-label="AI Fitness Coach"
        className="absolute left-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-emerald-200/14 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-emerald-300/35 hover:bg-white/[0.07] sm:left-8 sm:top-8"
      >
        <Image
          src="/brand/ai-fitness-coach-icon.svg"
          width={24}
          height={24}
          alt="AI Fitness Coach"
          priority
          className="h-6 w-6"
        />
      </Link>

      <div className="pointer-events-none absolute left-[12%] top-[18%] hidden h-24 w-px bg-gradient-to-b from-transparent via-emerald-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute bottom-[17%] right-[16%] hidden h-px w-32 bg-gradient-to-r from-transparent via-emerald-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute right-[19%] top-[25%] hidden h-14 w-14 border-r border-t border-emerald-300/14 sm:block" />
      <div className="pointer-events-none absolute bottom-[24%] left-[18%] hidden h-12 w-12 border-b border-l border-emerald-300/12 sm:block" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="relative w-[92%] max-w-[440px]">
          <div className="pointer-events-none absolute -inset-10 rounded-[42px] bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(16,185,129,0.05),transparent_66%)] blur-3xl" />
          <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,rgba(52,211,153,0.35),rgba(255,255,255,0.08)_34%,rgba(52,211,153,0.12)_100%)] p-px shadow-[0_34px_100px_rgba(0,0,0,0.58),0_0_46px_rgba(52,211,153,0.11)]">
            <div className="relative overflow-hidden rounded-[31px] border border-white/[0.06] bg-[rgba(3,15,10,0.72)] p-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(52,211,153,0.08)] backdrop-blur-[24px] sm:p-11">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(52,211,153,0.09),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_28%,rgba(0,0,0,0.22))]" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.24] mix-blend-screen [filter:contrast(1.15)] [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_88%,transparent)]"
                style={{
                  backgroundImage: "url('/images/login-athlete.png')",
                  backgroundPosition: "right bottom",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "70%",
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,10,0.96)_0%,rgba(3,15,10,0.74)_45%,rgba(3,15,10,0.46)_100%),radial-gradient(circle_at_75%_55%,rgba(16,185,129,0.18),transparent_45%)]" />
              <div className="pointer-events-none absolute left-8 right-8 top-32 h-px bg-gradient-to-r from-transparent via-emerald-200/24 to-transparent motion-safe:animate-pulse" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[rgba(3,15,10,0.92)] via-[rgba(3,15,10,0.58)] to-transparent" />

              <div className="relative z-10">
                <Link href="/" className="inline-flex text-[0.66rem] font-black uppercase tracking-[0.26em] text-emerald-100/62 transition hover:text-emerald-100">
                  AI FITNESS COACH
                </Link>

                <div className="mt-9">
                  <h1 className="text-[2.35rem] font-black leading-[1.05] tracking-[-0.045em] text-white">
                    {heading}
                  </h1>
                  <p className="mt-3 text-[0.95rem] leading-6 text-emerald-50/68">{description}</p>
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
                        className="h-[54px] w-full rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.18))] pl-11 pr-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.22)] outline-none transition duration-200 placeholder:text-emerald-50/28 hover:border-white/16 focus:border-emerald-300/70 focus:bg-emerald-300/[0.055] focus:ring-4 focus:ring-emerald-300/12"
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
                      className="h-[54px] w-full rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.18))] pl-11 pr-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.22)] outline-none transition duration-200 placeholder:text-emerald-50/28 hover:border-white/16 focus:border-emerald-300/70 focus:bg-emerald-300/[0.055] focus:ring-4 focus:ring-emerald-300/12"
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
                      className="h-[54px] w-full rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.18))] pl-11 pr-12 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.22)] outline-none transition duration-200 placeholder:text-emerald-50/28 hover:border-white/16 focus:border-emerald-300/70 focus:bg-emerald-300/[0.055] focus:ring-4 focus:ring-emerald-300/12"
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
                  className="mt-3 inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-[1rem] bg-[linear-gradient(135deg,#34d399_0%,#a7f3d0_48%,#10b981_100%)] px-5 text-sm font-black text-emerald-950 shadow-[0_18px_45px_rgba(52,211,153,0.24),inset_0_1px_0_rgba(255,255,255,0.42)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_58px_rgba(52,211,153,0.34),0_0_28px_rgba(52,211,153,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
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
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
