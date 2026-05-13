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
  Target,
  Utensils,
} from "lucide-react";

const featuredWorkout = {
  key: "strength",
  title: "Strength Builder",
  category: "Strength",
  duration: "45 min",
  kcal: "520 kcal",
  image: "/pulse-assets/workout-strength.jpg",
  description: "Progressive lifts, core stability, and recovery windows shaped around your current energy.",
  details: ["Upper body + core", "AI recovery pacing", "Form-first blocks"],
} as const;

const workoutTiles = [
  {
    key: "cardio",
    title: "Cardio Engine",
    category: "Cardio",
    duration: "30 min",
    kcal: "420 kcal",
    image: "/pulse-assets/workout-cardio.jpg",
    description: "Steady intervals for stamina, breathing rhythm, and better daily energy.",
  },
  {
    key: "yoga",
    title: "Mobility Flow",
    category: "Recovery",
    duration: "20 min",
    kcal: "180 kcal",
    image: "/pulse-assets/workout-yoga.jpg",
    description: "Controlled movement, balance, and joint-friendly range for low-stress days.",
  },
  {
    key: "boxing",
    title: "Boxing Burn",
    category: "Conditioning",
    duration: "35 min",
    kcal: "480 kcal",
    image: "/pulse-assets/workout-boxing.jpg",
    description: "Fast rounds with footwork, power shots, and clean recovery breaks.",
  },
  {
    key: "stretch",
    title: "Desk Reset",
    category: "Stretch",
    duration: "15 min",
    kcal: "120 kcal",
    image: "/pulse-assets/workout-stretch.jpg",
    description: "A short reset for tight hips, shoulders, and post-workout recovery.",
  },
] as const;

const heroHighlights = ["Personalized weekly plans", "Recovery-aware workouts", "Private progress tracking"] as const;

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
    text: "Macro-aware meals that stay practical - not a spreadsheet lifestyle.",
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
    text: "Your training data stays yours - secured with Supabase auth & RLS.",
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
      <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#010302] text-white">
        <div className="absolute inset-0 -z-30 bg-[linear-gradient(125deg,#010302_0%,#031009_48%,#000000_100%)]" />
        <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_74%_24%,rgba(34,197,94,0.18),transparent_34%),radial-gradient(ellipse_at_8%_82%,rgba(6,95,70,0.16),transparent_36%)]" />
        <div className="absolute inset-0 -z-20 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:92px_92px]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#071008] to-transparent" />

        <div className="mx-auto grid min-h-[720px] max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.07] px-3.5 py-2 text-[0.68rem] font-black uppercase text-emerald-100/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.85)]" />
              Private AI fitness coach
            </div>

            <h1 className="mt-6 max-w-[36rem] text-4xl font-black leading-[1.04] tracking-normal text-white sm:text-5xl lg:text-[4.05rem]">
              Train smarter with a private AI coach.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-emerald-50/68 sm:text-lg">
              Personalized workouts, clean progress tracking, and simple coach guidance in one focused fitness workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/onboarding"
                className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-black text-[#021008] shadow-[0_18px_44px_rgba(52,211,153,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Build my plan
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-6 text-sm font-black text-white backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-white/[0.085]"
              >
                <Play className="h-4 w-4 fill-current text-emerald-300" />
                View demo
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {heroHighlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-xs font-bold text-emerald-50/78 backdrop-blur-xl"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="relative mx-auto w-full max-w-[560px] lg:mr-0">
            <div className="absolute -inset-x-5 inset-y-10 -z-10 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(52,211,153,0.14),rgba(2,6,4,0.04)_58%,rgba(52,211,153,0.10))] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#030605] p-3 shadow-[0_34px_100px_rgba(0,0,0,0.56)]">
              <div className="relative min-h-[520px] overflow-hidden rounded-[1.55rem] bg-black sm:min-h-[590px]">
                <Image
                  src="/pulse-assets/hero-silhouette.png"
                  alt="Strength athlete silhouette"
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover object-center opacity-95 contrast-125"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.22)_42%,rgba(0,0,0,0.72)_100%),linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.30)_48%,rgba(0,0,0,0.92)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(52,211,153,0.10),transparent_45%)]" />

                <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 bg-black/48 px-3 py-1.5 text-[0.68rem] font-black uppercase text-white/82 backdrop-blur-md">
                    Live coaching
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1.5 text-xs font-black text-emerald-200 backdrop-blur-md">
                    <Bot className="h-3.5 w-3.5" />
                    Online
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="rounded-[1.25rem] border border-white/12 bg-black/58 p-4 backdrop-blur-xl">
                    <p className="text-xs font-black uppercase text-emerald-300">Today&apos;s focus</p>
                    <h2 className="mt-1.5 text-2xl font-black text-white">Strength + core</h2>
                    <div className="mt-4 space-y-2">
                      {[
                        ["Warm up", "6 min"],
                        ["Main lifts", "32 min"],
                        ["Cooldown", "7 min"],
                      ].map(([label, time]) => (
                        <div key={label} className="flex items-center justify-between gap-4 rounded-full bg-white/[0.07] px-3 py-2 text-xs font-bold text-white/78">
                          <span>{label}</span>
                          <span className="text-emerald-200">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-emerald-300/18 bg-emerald-300/[0.10] p-4 backdrop-blur-xl sm:w-[150px]">
                    <div className="flex items-center justify-between text-emerald-200">
                      <Gauge className="h-5 w-5" />
                      <span className="text-xs font-black uppercase">Ready</span>
                    </div>
                    <p className="mt-4 text-4xl font-black text-white">87%</p>
                    <p className="mt-1 text-xs font-bold text-emerald-50/58">Volume adjusted</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Workouts */}
      <section id="workouts" className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#050b07] py-16 text-white sm:py-20">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#071008_0%,#06100a_45%,#030504_100%)]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_16%_18%,rgba(34,197,94,0.12),transparent_32%),radial-gradient(ellipse_at_92%_48%,rgba(16,185,129,0.10),transparent_30%)]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-black uppercase text-[var(--fc-accent)]">Workout plans</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
                Plans for every training day.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">
                Strength, cardio, boxing, and recovery sessions with clear time and burn estimates.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:w-[360px]">
              {[
                ["4", "Plans"],
                ["15-45", "Min"],
                ["AI", "Adjusted"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[1rem] border border-white/[0.08] bg-white/[0.045] px-3 py-3 text-center backdrop-blur-xl">
                  <p className="text-lg font-black text-white">{value}</p>
                  <p className="mt-1 text-[0.66rem] font-black uppercase text-white/42">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/onboarding"
            className="group mt-10 grid overflow-hidden rounded-[1.35rem] border border-white/[0.10] bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300/28 hover:bg-white/[0.06] lg:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="relative min-h-[270px] overflow-hidden lg:min-h-[390px]">
              <Image
                src={featuredWorkout.image}
                alt={featuredWorkout.title + " workout"}
                fill
                sizes="(min-width: 1024px) 43vw, 100vw"
                className="object-cover object-center transition duration-700 group-hover:scale-[1.045]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.04)_44%,rgba(0,0,0,0.62)_100%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.34)_100%)]" />
              <div className="absolute left-5 top-5 rounded-full border border-white/14 bg-black/40 px-3 py-1.5 text-xs font-black uppercase text-white/86 backdrop-blur-md">
                Featured
              </div>
            </div>

            <div className="relative flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/12 px-3 py-1.5 text-xs font-black uppercase text-emerald-300">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {featuredWorkout.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.055] px-3 py-1.5 text-xs font-black text-white/74">
                    <Clock className="h-3.5 w-3.5 text-emerald-300" />
                    {featuredWorkout.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.055] px-3 py-1.5 text-xs font-black text-white/74">
                    <Flame className="h-3.5 w-3.5 text-emerald-300" />
                    {featuredWorkout.kcal}
                  </span>
                </div>
                <h3 className="mt-6 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-[2.7rem]">{featuredWorkout.title}</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/64">{featuredWorkout.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {featuredWorkout.details.map((detail) => (
                    <span key={detail} className="rounded-full border border-white/[0.10] bg-black/24 px-3 py-1.5 text-xs font-black text-white/76">
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-white/[0.09] pt-5">
                <span className="text-sm font-black text-white/70">Upper body, core, and controlled rest</span>
                <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-emerald-300 px-4 text-sm font-black text-[#03100a] transition group-hover:bg-emerald-200">
                  Start plan
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workoutTiles.map((w) => (
              <Link
                key={w.key}
                href="/onboarding"
                className="group flex min-h-[368px] flex-col overflow-hidden rounded-[1.15rem] border border-white/[0.09] bg-white/[0.04] shadow-[0_20px_58px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-300/26 hover:bg-white/[0.06]"
              >
                <div className="relative h-44 shrink-0 overflow-hidden bg-[#0d1a10]">
                  <Image
                    src={w.image}
                    alt={w.title + " workout"}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/8 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/44 px-2.5 py-1 text-[0.68rem] font-black uppercase text-white/88 backdrop-blur-md">
                    {w.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.7rem] font-black text-white/70">
                      <Clock className="h-3 w-3 text-emerald-300" />
                      {w.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.7rem] font-black text-white/70">
                      <Flame className="h-3 w-3 text-emerald-300" />
                      {w.kcal}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-black leading-tight text-white">{w.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/58">{w.description}</p>
                  <span className="mt-auto inline-flex h-10 w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.10] px-4 text-sm font-black text-emerald-300 transition group-hover:border-emerald-300/40 group-hover:bg-emerald-300 group-hover:text-[#03100a]">
                    Start plan
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
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
                {["Adaptive weekly blocks", "Macro-aware meals", "Advanced analytics", "Priority AI coach"].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="text-[var(--fc-accent)]">✓</span> {x}
                  </li>
                ))}
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
          <p>&copy; {new Date().getFullYear()} AI Fitness Coach - General fitness information only, not medical advice.</p>
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
