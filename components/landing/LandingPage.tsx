"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Gauge,
  LineChart,
  Play,
  Shield,
  Star,
  Target,
  Utensils,
} from "lucide-react";

const featuredWorkout = {
  key: "strength",
  title: "Strength Builder",
  eyebrow: "Featured plan",
  meta: "45 min · 520 kcal",
  image: "/pulse-assets/workout-strength.jpg",
  description: "A focused strength session with progressive lifts, core work, and clear rest windows.",
  details: ["Upper body + core", "Form-first pacing"],
} as const;

const workoutTiles = [
  { key: "cardio", title: "Cardio", meta: "30 min · 420 kcal", image: "/pulse-assets/workout-cardio.jpg" },
  { key: "yoga", title: "Yoga", meta: "20 min · 180 kcal", image: "/pulse-assets/workout-yoga.jpg" },
  { key: "boxing", title: "Boxing", meta: "35 min · 480 kcal", image: "/pulse-assets/workout-boxing.jpg" },
  { key: "stretch", title: "Stretch", meta: "15 min · 120 kcal", image: "/pulse-assets/workout-stretch.jpg" },
  { key: "hiit", title: "HIIT", meta: "20 min · 560 kcal", image: "/pulse-assets/hero-athlete.jpg" },
] as const;

const workoutCopy: Record<(typeof workoutTiles)[number]["key"], string> = {
  cardio: "Low-friction intervals for stamina and energy.",
  yoga: "Slow control, breathing, and joint-friendly movement.",
  boxing: "Sharp rounds with footwork, power, and recovery.",
  stretch: "Reset tight muscles after training or desk time.",
  hiit: "Short bursts built for sweat, speed, and confidence.",
};

const splitWorkoutMeta = (meta: string) => meta.split(/\s*[Â·]\s*/).filter(Boolean);

const heroHighlights = ["Adaptive weekly plans", "Simple nutrition rhythm", "Progress you can read fast"] as const;

const featureGrid = [
  {
    icon: Bot,
    title: "AI Coach",
    text: "Instant form feedback, plan tweaks, and answers when you need a second opinion.",
  },
  {
    icon: Dumbbell,
    title: "Smart Workouts",
    text: "Plans that adapt weekly to your schedule, equipment, and recovery.",
  },
  {
    icon: Utensils,
    title: "Nutrition Plans",
    text: "Macro-aware meals that stay practical — not a spreadsheet lifestyle.",
  },
  {
    icon: LineChart,
    title: "Deep Progress",
    text: "Weight, sessions, and momentum in one calm dashboard.",
  },
  {
    icon: Target,
    title: "Goal Engine",
    text: "Big targets broken into weekly wins you can actually hit.",
  },
  {
    icon: Shield,
    title: "Private by design",
    text: "Your training data stays yours — secured with Supabase auth & RLS.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="pulse-page text-[var(--fc-text)]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#071008]/92 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <Image
              src="/brand/ai-fitness-coach-icon.svg"
              alt="AI Fitness Coach"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg shadow-[0_14px_38px_rgba(34,197,94,0.32)] transition group-hover:-translate-y-0.5 group-hover:brightness-110"
              priority
            />
            <span className="min-w-0">
              <span className="block truncate text-base font-black text-white sm:text-lg">AI Fitness Coach</span>
              <span className="hidden text-[0.68rem] font-bold uppercase text-white/45 sm:block">Personal training AI</span>
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.05] p-1 text-sm font-bold text-white/58 md:flex">
            <a href="#features" className="rounded-full px-4 py-2 transition hover:bg-white/[0.08] hover:text-white">
              Features
            </a>
            <a href="#workouts" className="rounded-full px-4 py-2 transition hover:bg-white/[0.08] hover:text-white">
              Workouts
            </a>
            <a href="#pricing" className="rounded-full px-4 py-2 transition hover:bg-white/[0.08] hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden text-sm font-bold text-white/58 transition hover:text-white sm:inline">
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_38px_rgba(34,197,94,0.28)] transition hover:-translate-y-0.5 hover:brightness-110 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#020403] text-white">
        <div className="absolute inset-0 -z-50 bg-[radial-gradient(circle_at_74%_22%,rgba(34,197,94,0.20),transparent_31%),radial-gradient(circle_at_18%_76%,rgba(74,222,128,0.10),transparent_34%),linear-gradient(135deg,#020403_0%,#06100a_42%,#010201_100%)]" />
        <div className="absolute inset-0 -z-50 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35 [mask-image:radial-gradient(circle_at_54%_42%,black,transparent_74%)]" />
        <div className="absolute inset-0 -z-50 opacity-[0.065] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="absolute left-[-14rem] top-20 -z-40 h-[32rem] w-[32rem] rounded-full bg-[var(--fc-accent)]/8 blur-3xl" />
        <div className="absolute right-[-12rem] top-0 -z-40 h-[42rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.20),transparent_66%)] blur-3xl motion-safe:animate-pulse" />
        <div className="absolute bottom-0 left-1/2 -z-40 h-72 w-[80rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(34,197,94,0.11),transparent_62%)] blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-[#070807] via-[#070807]/78 to-transparent" />

        <div className="mx-auto grid min-h-[760px] max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[minmax(0,0.96fr)_minmax(280px,0.72fr)] lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:gap-10 lg:px-8">
          <div className="relative z-10 max-w-3xl">
            <div className="absolute -left-8 top-6 hidden h-24 w-24 rounded-full border border-[var(--fc-accent)]/14 bg-[var(--fc-accent)]/5 blur-[1px] lg:block" />
            <div className="absolute left-[59%] top-14 hidden h-2.5 w-2.5 rounded-full bg-[var(--fc-accent)] shadow-[0_0_28px_rgba(34,197,94,0.95)] motion-safe:animate-pulse sm:block" />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.06] px-3.5 py-2 text-[0.7rem] font-black uppercase text-white/72 shadow-[0_16px_44px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
              <span className="h-2 w-2 rounded-full bg-[var(--fc-accent)] shadow-[0_0_18px_rgba(34,197,94,0.85)]" />
              AI-powered personal training
            </div>
            <h1 className="relative mt-6 max-w-[23rem] text-[3.4rem] font-black leading-[0.88] tracking-normal text-white drop-shadow-[0_26px_78px_rgba(0,0,0,0.42)] sm:max-w-[46rem] sm:text-[4.6rem] lg:text-[6.7rem]">
              Train smarter with your AI fitness coach.
            </h1>
            <p className="mt-7 max-w-[22rem] text-lg leading-8 text-white/70 sm:max-w-xl sm:text-xl">
              Custom workouts, practical nutrition guidance, and progress tracking in one calm coaching workspace.
            </p>

            <div className="mt-9 grid gap-3 sm:max-w-2xl sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="group flex min-h-[58px] items-center gap-2 rounded-lg border border-white/[0.11] bg-white/[0.065] px-3.5 py-3 text-sm font-bold text-white/84 shadow-[0_18px_48px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[var(--fc-accent)]/38 hover:bg-white/[0.09] hover:shadow-[0_24px_60px_rgba(0,0,0,0.30),0_0_34px_rgba(34,197,94,0.10)]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--fc-accent)]/24 bg-[var(--fc-accent)]/12 shadow-[0_0_18px_rgba(34,197,94,0.18)] transition group-hover:scale-105">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--fc-accent)] drop-shadow-[0_0_12px_rgba(34,197,94,0.7)]" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex max-w-[22rem] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
              <Link
                href="/onboarding"
                className="group inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#16a34a_0%,#4ade80_46%,#22c55e_100%)] px-7 text-sm font-black text-white shadow-[0_22px_56px_rgba(34,197,94,0.34),0_0_26px_rgba(34,197,94,0.18),inset_0_1px_0_rgba(255,255,255,0.30)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_68px_rgba(34,197,94,0.42),0_0_34px_rgba(34,197,94,0.24),inset_0_1px_0_rgba(255,255,255,0.34)] sm:w-auto"
              >
                Start training free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="group inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.075] px-6 text-sm font-black text-white shadow-[0_18px_44px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-[var(--fc-accent)]/42 hover:bg-white/[0.12] sm:w-auto"
              >
                <Play className="h-4 w-4 fill-current text-[var(--fc-accent)] drop-shadow-[0_0_12px_rgba(34,197,94,0.7)] transition group-hover:scale-110" />
                Live demo
              </Link>
            </div>
          </div>

          <div className="relative z-0 mt-4 min-h-[420px] sm:min-h-[520px] md:mt-0 md:min-h-[620px] lg:min-h-[640px]">
            <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--fc-accent)]/16 bg-[radial-gradient(circle,rgba(34,197,94,0.12),transparent_65%)] shadow-[0_0_95px_rgba(34,197,94,0.12)] sm:h-[34rem] sm:w-[34rem]" />
            <div className="absolute left-[2%] top-[22%] h-32 w-32 rounded-full border border-[var(--fc-accent)]/16 bg-white/[0.025] backdrop-blur-xl" />
            <div className="absolute right-[4%] top-[18%] h-14 w-14 rounded-full border border-white/[0.14] bg-white/[0.07] shadow-[0_20px_52px_rgba(34,197,94,0.16)] backdrop-blur-2xl" />
            <div className="absolute bottom-[13%] left-[14%] h-px w-44 rotate-[-16deg] bg-gradient-to-r from-transparent via-[var(--fc-accent)]/42 to-transparent shadow-[0_0_18px_rgba(34,197,94,0.55)]" />
            <div className="absolute right-[7%] top-[37%] h-px w-56 rotate-[18deg] bg-gradient-to-r from-transparent via-[var(--fc-accent)]/36 to-transparent shadow-[0_0_20px_rgba(34,197,94,0.46)]" />
            <div className="absolute bottom-[25%] right-[10%] h-px w-48 rotate-[-8deg] bg-gradient-to-r from-transparent via-white/22 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_58%_46%,black_0%,black_58%,transparent_84%)]">
              <Image
                src="/pulse-assets/hero-athlete.jpg"
                alt="Female fitness athlete training with neon light trails"
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover object-[56%_18%] saturate-125 brightness-110 contrast-110 drop-shadow-[0_34px_90px_rgba(0,0,0,0.66)]"
                priority
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_57%_38%,transparent_0%,rgba(2,4,3,0.10)_32%,rgba(2,4,3,0.78)_78%),linear-gradient(90deg,#020403_0%,rgba(2,4,3,0.32)_30%,rgba(2,4,3,0.04)_55%,rgba(2,4,3,0.44)_100%)]" />
            </div>

            <div className="absolute bottom-[9%] left-[10%] right-[8%] h-24 rounded-full bg-[radial-gradient(ellipse,rgba(34,197,94,0.22),transparent_64%)] blur-2xl" />
            <div className="absolute right-[10%] top-[20%] h-40 w-40 rounded-full bg-[var(--fc-accent)]/13 blur-3xl motion-safe:animate-pulse" />
          </div>

          <aside className="hidden">
            <div className="absolute -left-16 top-16 h-28 w-28 rounded-full border border-[var(--fc-accent)]/18 bg-[conic-gradient(from_140deg,rgba(34,197,94,0.75),rgba(255,255,255,0.08),rgba(34,197,94,0.14))] p-[1px] opacity-70 blur-[0.2px]">
              <div className="h-full w-full rounded-full bg-[#071008]/90 backdrop-blur-xl" />
            </div>
            <div className="absolute -right-4 top-8 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.08] text-[var(--fc-accent)] shadow-[0_20px_55px_rgba(34,197,94,0.18)] backdrop-blur-2xl motion-safe:animate-pulse">
              <Bot className="h-5 w-5" />
            </div>
            <div className="absolute -bottom-6 right-12 h-32 w-32 rounded-full bg-[var(--fc-accent)]/14 blur-3xl" />

            <div className="group relative mt-20 w-[390px] overflow-hidden rounded-lg border border-white/[0.16] bg-[rgba(8,24,14,0.62)] p-5 text-white shadow-[0_36px_110px_rgba(0,0,0,0.48),0_0_90px_rgba(34,197,94,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[var(--fc-accent)]/38 hover:bg-[rgba(11,31,18,0.68)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_34%,rgba(34,197,94,0.12))] opacity-80" />
              <div className="pointer-events-none absolute right-[-44px] top-[-52px] h-40 w-40 rounded-full bg-[var(--fc-accent)]/18 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] font-black uppercase text-[var(--fc-accent)]">Today&apos;s plan</p>
                  <p className="mt-1 text-xs font-bold text-white/46">AI adjusted for recovery</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--fc-accent)]/24 bg-[var(--fc-accent)]/10 shadow-[0_0_30px_rgba(34,197,94,0.18)]">
                  <Gauge className="h-5 w-5 text-[var(--fc-accent)]" />
                </span>
              </div>
              <div className="relative mt-6 grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <p className="text-3xl font-black leading-tight">Balanced strength</p>
                  <p className="mt-2 text-sm font-semibold text-white/54">45 min · 3 blocks · low joint load</p>
                </div>
                <div className="relative h-16 w-16 rounded-full bg-[conic-gradient(var(--fc-accent)_78%,rgba(255,255,255,0.12)_0)] p-[3px] shadow-[0_0_36px_rgba(34,197,94,0.22)]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#071008]/94">
                    <LineChart className="h-5 w-5 text-[var(--fc-accent)]" />
                  </div>
                </div>
              </div>
              <div className="relative mt-6 space-y-3">
                {["Warm up - 6 min", "Strength block - 32 min", "Cooldown - 7 min"].map((step, index) => (
                  <div
                    key={step}
                    className="group/step rounded-md border border-white/[0.09] bg-white/[0.055] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition group-hover:bg-white/[0.085]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--fc-accent)]/16 text-xs font-black text-[var(--fc-accent)]">
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-white/88">{step}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.09]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#4ade80)] shadow-[0_0_18px_rgba(34,197,94,0.54)]"
                        style={{ width: `${[68, 86, 52][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.10] pt-5">
                <div>
                  <p className="text-xs font-bold text-white/44">Intensity</p>
                  <p className="mt-1 text-lg font-black text-white">74%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white/44">Rating</p>
                  <div className="mt-1 flex justify-end gap-1 text-[var(--fc-accent)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Workouts */}
      <section id="workouts" className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#071008] py-16 text-white sm:py-20">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_44%,rgba(34,197,94,0.24),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(134,239,172,0.10),transparent_26%),linear-gradient(180deg,#071008_0%,#0a160d_48%,#050806_100%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <div className="absolute inset-0 -z-20 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="absolute left-1/2 top-16 -z-10 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[var(--fc-accent)]/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm font-black uppercase text-[var(--fc-accent)]">Workout library</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Train every part of you</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">
                Pick a focused session, then let the coach adjust the pace around your goals, energy, and schedule.
              </p>
            </div>
            <Link
              href="/signup"
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.08] px-5 py-3 text-sm font-black text-white shadow-[0_16px_42px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--fc-accent)]/45 hover:bg-white/[0.12]"
            >
              View all
              <ArrowRight className="h-4 w-4 text-[var(--fc-accent)] transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Link
              href="/onboarding"
              className="group relative grid overflow-hidden rounded-lg border border-white/[0.12] bg-white/[0.06] shadow-[0_30px_90px_rgba(0,0,0,0.36),0_0_70px_rgba(34,197,94,0.08)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1.5 hover:border-[var(--fc-accent)]/35 hover:shadow-[0_34px_100px_rgba(0,0,0,0.42),0_0_90px_rgba(34,197,94,0.14)] lg:grid-cols-[1.03fr_0.97fr]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_34%,rgba(34,197,94,0.10))] opacity-70" />
              <div className="relative min-h-[300px] overflow-hidden lg:min-h-[456px]">
                <Image
                  src={featuredWorkout.image}
                  alt={featuredWorkout.title + " workout"}
                  fill
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.16)_42%,rgba(2,8,4,0.72)_100%)]" />
                <div className="absolute left-5 top-5 rounded-full border border-white/18 bg-black/38 px-3 py-1.5 text-xs font-black uppercase text-white shadow-[0_12px_30px_rgba(0,0,0,0.26)] backdrop-blur-md">
                  {featuredWorkout.eyebrow}
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                  {splitWorkoutMeta(featuredWorkout.meta).map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-white/[0.12] px-3 py-1.5 text-xs font-black text-white backdrop-blur-md"
                    >
                      {item.includes("min") ? (
                        <Clock className="h-3.5 w-3.5 text-[var(--fc-accent)]" />
                      ) : (
                        <Flame className="h-3.5 w-3.5 text-[var(--fc-accent)]" />
                      )}
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--fc-accent)]/25 bg-[var(--fc-accent)]/10 px-3 py-1.5 text-xs font-black uppercase text-[var(--fc-accent)]">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {featuredWorkout.eyebrow}
                  </div>
                  <h3 className="max-w-sm text-3xl font-black leading-tight text-white sm:text-4xl">{featuredWorkout.title}</h3>
                  <p className="mt-4 text-base leading-7 text-white/64">{featuredWorkout.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {featuredWorkout.details.map((detail) => (
                      <span
                        key={detail}
                        className="rounded-full border border-white/[0.12] bg-white/[0.07] px-3 py-1.5 text-xs font-black text-white/82 backdrop-blur-md"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {splitWorkoutMeta(featuredWorkout.meta).map((item) => (
                      <div
                        key={item}
                        className="rounded-lg border border-white/[0.10] bg-black/[0.16] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
                      >
                        <div className="flex items-center gap-2 text-sm font-black text-white">
                          {item.includes("min") ? (
                            <Clock className="h-4 w-4 text-[var(--fc-accent)]" />
                          ) : (
                            <Flame className="h-4 w-4 text-[var(--fc-accent)]" />
                          )}
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-white/[0.10] pt-5">
                  <span className="inline-flex items-center gap-2 text-sm font-black text-white/82">
                    <span className="h-2 w-2 rounded-full bg-[var(--fc-accent)] shadow-[0_0_18px_rgba(34,197,94,0.9)]" />
                    {featuredWorkout.meta}
                  </span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--fc-accent)] text-white shadow-[0_14px_34px_rgba(34,197,94,0.32)] transition group-hover:translate-x-1.5 group-hover:brightness-110">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="grid gap-4 sm:grid-cols-2">
              {workoutTiles.map((w, index) => (
                <Link
                  key={w.key}
                  href="/onboarding"
                  className={[
                    "group relative flex min-h-[222px] flex-col justify-between overflow-hidden rounded-lg border border-white/[0.10] bg-white/[0.055] p-4 shadow-[0_20px_58px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-[var(--fc-accent)]/35 hover:bg-white/[0.075] hover:shadow-[0_28px_72px_rgba(0,0,0,0.34),0_0_46px_rgba(34,197,94,0.10)]",
                    index === workoutTiles.length - 1 ? "sm:col-span-2" : "",
                  ].join(" ")}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_42%,rgba(34,197,94,0.08))] opacity-0 transition group-hover:opacity-100" />
                  <div className="relative">
                    <div className={["relative overflow-hidden rounded-md bg-[#0d1a10]", index === workoutTiles.length - 1 ? "h-36 sm:h-40" : "h-32"].join(" ")}>
                      <Image
                        src={w.image}
                        alt={w.title + " workout"}
                        fill
                        sizes={index === workoutTiles.length - 1 ? "(min-width: 640px) 46vw, 100vw" : "(min-width: 640px) 23vw, 100vw"}
                        className="object-cover transition duration-700 group-hover:scale-[1.10]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full border border-white/16 bg-black/35 px-2.5 py-1 text-[0.68rem] font-black uppercase text-white/90 backdrop-blur-md">
                        {w.title}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {splitWorkoutMeta(w.meta).map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.07] px-2.5 py-1 text-[0.72rem] font-black text-white/78"
                        >
                          {item.includes("min") ? (
                            <Clock className="h-3 w-3 text-[var(--fc-accent)]" />
                          ) : (
                            <Flame className="h-3 w-3 text-[var(--fc-accent)]" />
                          )}
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="relative mt-5 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{w.title}</h3>
                      <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/58">{workoutCopy[w.key]}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition group-hover:translate-x-1 group-hover:border-[var(--fc-accent)]/45 group-hover:bg-[var(--fc-accent)] group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Everything to train smarter.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((f) => (
              <div
                key={f.title}
                className="ref-glow-card rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-[var(--fc-accent)]/20"
              >
                <f.icon className="h-6 w-6 text-[var(--fc-accent)]" strokeWidth={2} />
                <h3 className="mt-4 text-lg font-black text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fc-muted)]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-[var(--fc-border)] bg-black/20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-black tracking-tight text-white sm:text-4xl">
            Simple, athlete-friendly.
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            <div className="ref-glow-card rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-muted)]">Starter</p>
              <p className="mt-3 text-3xl font-black text-white">Free</p>
              <p className="mt-2 text-sm text-[var(--fc-muted)]">Core workouts, progress basics, and AI coach intro.</p>
              <ul className="mt-6 space-y-2 text-sm text-[var(--fc-muted)]">
                {["Guided onboarding", "Starter plans", "Community pace"].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="text-[var(--fc-accent)]">✓</span> {x}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="mt-8 flex w-full items-center justify-center rounded-full border border-white/15 py-3 text-sm font-black text-white transition hover:bg-white/[0.06]"
              >
                Start free
              </Link>
            </div>

            <div className="ref-glow-card--popular relative rounded-2xl border border-[var(--fc-accent)]/35 bg-[linear-gradient(160deg,rgba(212,255,63,0.08),rgba(12,14,11,0.95))] p-8">
              <span className="absolute right-6 top-6 rounded-full bg-[var(--fc-accent)] px-3 py-1 text-[0.65rem] font-black uppercase tracking-wide text-[var(--fc-accent-ink)]">
                Most popular
              </span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-accent-strong)]">Pro</p>
              <p className="mt-3 text-3xl font-black text-white">
                $12<span className="text-lg font-bold text-[var(--fc-muted)]">/mo</span>
              </p>
              <p className="mt-2 text-sm text-[var(--fc-muted)]">
                Unlimited AI workouts, nutrition intelligence, analytics, priority coach.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/85">
                {["Adaptive weekly blocks", "Macro-aware meals", "Advanced analytics", "Priority AI coach"].map(
                  (x) => (
                    <li key={x} className="flex items-center gap-2">
                      <span className="text-[var(--fc-accent)]">✓</span> {x}
                    </li>
                  ),
                )}
              </ul>
              <Link
                href="/signup"
                className="mt-8 flex w-full items-center justify-center rounded-full bg-[var(--fc-accent)] py-3 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_14px_40px_rgba(212,255,63,0.25)] transition hover:brightness-110"
              >
                Go Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="ref-glow-card rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] px-6 py-12 text-center sm:px-12 sm:py-14">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Your stronger self starts today</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--fc-muted)]">
              Join thousands of athletes training smarter with AI Fitness Coach - structure, accountability, and AI that
              respects your time.
            </p>
            <Link
              href="/onboarding"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--fc-accent)] px-8 py-3.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_16px_48px_rgba(212,255,63,0.28)] transition hover:brightness-110"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--fc-border)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-[var(--fc-muted)] sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AI Fitness Coach · General fitness information only, not medical advice.</p>
          <div className="flex flex-wrap justify-center gap-6 font-semibold">
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition hover:text-white">
              Terms
            </a>
            <a href="#" className="transition hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
