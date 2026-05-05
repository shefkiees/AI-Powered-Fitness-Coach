"use client";

import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, Bot, Dumbbell, LineChart, Play, Shield, Star, Target, Utensils } from "lucide-react";

const strengthHero = {
  key: "strength",
  title: "Strength",
  meta: "45 min · 520 kcal",
  image: "/pulse-assets/workout-strength.jpg",
} as const;

const workoutTiles = [
  { key: "cardio", title: "Cardio", meta: "30 min · 420 kcal", image: "/pulse-assets/workout-cardio.jpg" },
  { key: "yoga", title: "Yoga", meta: "20 min · 180 kcal", image: "/pulse-assets/workout-yoga.jpg" },
  { key: "boxing", title: "Boxing", meta: "35 min · 480 kcal", image: "/pulse-assets/workout-boxing.jpg" },
  { key: "stretch", title: "Stretch", meta: "15 min · 120 kcal", image: "/pulse-assets/workout-stretch.jpg" },
  { key: "hiit", title: "HIIT", meta: "20 min · 560 kcal", image: "/pulse-assets/hero-athlete.jpg" },
] as const;

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

const stats = [
  { value: "50K+", label: "Active athletes" },
  { value: "1.2M", label: "Workouts done" },
  { value: "4.9★", label: "App store rating" },
  { value: "92%", label: "Hit their goals" },
] as const;

export function LandingPage() {
  return (
    <div className="pulse-page text-[var(--fc-text)]">
      {/* Nav — reference: center links + sign in + get started */}
      <header className="sticky top-0 z-50 border-b border-[var(--fc-border)] bg-[rgba(10,12,8,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_0_24px_rgba(212,255,63,0.25)]">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-black tracking-tight">Pulse</span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 text-sm font-semibold text-[var(--fc-muted)] md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workouts" className="transition hover:text-white">
              Workouts
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm font-semibold text-[var(--fc-muted)] transition hover:text-white">
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_12px_40px_rgba(212,255,63,0.22)] transition hover:brightness-110 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(212,255,63,0.11),transparent_65%)]" />

        <div className="relative grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <h1 className="text-[2.35rem] font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.25rem]">
              Discover a healthier, stronger you.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--fc-muted)] sm:text-xl">
              Your personal AI coach. Custom workouts, smart nutrition, and progress tracking — all in one premium app.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-accent)] px-7 py-3.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_16px_50px_rgba(212,255,63,0.28)] transition hover:brightness-110"
              >
                Start training free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border-strong)] bg-white/[0.03] px-6 py-3.5 text-sm font-bold text-white transition hover:border-[var(--fc-accent)]/35 hover:bg-white/[0.06]"
              >
                <Play className="h-4 w-4 fill-current text-[var(--fc-accent)]" />
                Live demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-[var(--fc-bg-page)] bg-gradient-to-br from-zinc-500 to-zinc-800"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-[var(--fc-accent)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[var(--fc-muted)]">
                  <span className="font-bold text-white">4.9</span> · 10k+ reviews
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="ref-glow-card relative overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-[#0c0f0b]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[4/5]">
                <Image
                  src="/pulse-assets/hero-athlete.jpg"
                  alt="Athlete training with Pulse app"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-accent)]">Pulse app</p>
                  <p className="mt-2 text-xl font-black text-white">Train with clarity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative mt-16 grid grid-cols-2 gap-3 border-t border-[var(--fc-border)] pt-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--fc-border)] bg-white/[0.02] px-4 py-5 text-center"
            >
              <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--fc-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workouts */}
      <section id="workouts" className="border-t border-[var(--fc-border)] bg-black/25 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Train every part of you</h2>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-sm font-bold text-[var(--fc-accent)] transition hover:gap-2"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <Link
              href="/onboarding"
              className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-white/[0.06] transition hover:border-[var(--fc-accent)]/30 lg:col-span-7 lg:min-h-[380px]"
            >
              <Image
                src={strengthHero.image}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-3xl font-black text-white sm:text-4xl">{strengthHero.title}</p>
                <p className="mt-2 text-sm text-white/80">{strengthHero.meta}</p>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-4 lg:col-span-5 lg:grid-rows-[1fr_1fr_auto]">
              {workoutTiles.slice(0, 4).map((w) => (
                <Link
                  key={w.key}
                  href="/onboarding"
                  className="group relative min-h-[150px] overflow-hidden rounded-2xl border border-white/[0.06] transition hover:border-[var(--fc-accent)]/25 sm:min-h-[170px]"
                >
                  <Image src={w.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-lg font-black text-white">{w.title}</p>
                    <p className="text-xs text-white/75">{w.meta}</p>
                  </div>
                </Link>
              ))}
              <Link
                href="/onboarding"
                className="group relative col-span-2 min-h-[130px] overflow-hidden rounded-2xl border border-white/[0.06] transition hover:border-[var(--fc-accent)]/25"
              >
                <Image
                  src={workoutTiles[4].image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-5">
                  <p className="text-2xl font-black text-white">{workoutTiles[4].title}</p>
                  <p className="text-sm text-white/75">{workoutTiles[4].meta}</p>
                </div>
              </Link>
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
              Join thousands of athletes training smarter with Pulse — structure, accountability, and AI that respects
              your time.
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
          <p>© {new Date().getFullYear()} Pulse · General fitness information only, not medical advice.</p>
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
