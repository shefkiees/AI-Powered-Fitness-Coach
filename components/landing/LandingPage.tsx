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
      <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#061008] text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_18%,rgba(34,197,94,0.28),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(134,239,172,0.16),transparent_30%),linear-gradient(135deg,#061008_0%,#0b1b10_52%,#020604_100%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-45" />
        <div className="absolute right-[-120px] top-20 -z-10 hidden opacity-20 lg:block">
          <Image
            src="/brand/ai-fitness-coach-logo.svg"
            alt=""
            width={640}
            height={196}
            className="h-auto w-[640px]"
            priority
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[#080907] to-transparent" />

        <div className="mx-auto grid min-h-[680px] max-w-6xl items-center px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:px-8">
          <div className="min-w-0 max-w-2xl">
            <h1 className="mt-7 max-w-[22rem] text-[2.65rem] font-black leading-[1.02] text-white sm:max-w-3xl sm:text-6xl lg:text-7xl">
              Train smarter with your AI fitness coach.
            </h1>
            <p className="mt-6 max-w-[22rem] text-lg leading-8 text-white/70 sm:max-w-xl sm:text-xl">
              Custom workouts, practical nutrition guidance, and progress tracking in one calm coaching workspace.
            </p>

            <div className="mt-8 grid gap-3 sm:max-w-xl sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-bold text-white/84">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--fc-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex max-w-[22rem] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
              <Link
                href="/onboarding"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-7 py-3.5 text-sm font-black text-white shadow-[0_18px_45px_rgba(34,197,94,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto"
              >
                Start training free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.10] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_35px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:border-[var(--fc-accent)]/45 hover:bg-white/[0.16] sm:w-auto"
              >
                <Play className="h-4 w-4 fill-current text-[var(--fc-accent)]" />
                Live demo
              </Link>
            </div>
          </div>

          <aside className="mt-12 hidden justify-self-end lg:block">
            <div className="w-[330px] rounded-lg border border-white/14 bg-[#071008]/82 p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-[var(--fc-accent)]">Today&apos;s plan</p>
                <Gauge className="h-5 w-5 text-[var(--fc-accent)]" />
              </div>
              <p className="mt-3 text-2xl font-black">Balanced strength</p>
              <div className="mt-5 space-y-3">
                {["Warm up - 6 min", "Strength block - 32 min", "Cooldown - 7 min"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md bg-white/[0.07] px-3 py-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--fc-accent)]/15 text-xs font-black text-[var(--fc-accent)]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-white/88">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 text-[var(--fc-accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
                <span className="ml-2 text-sm font-bold text-white/80">4.9 coach rating</span>
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
