"use client";

import Image from "next/image";
import { ArrowRight, Flame, Play } from "lucide-react";

const heroImage = "/pulse-assets/hero-athlete.jpg";
const stretchImage = "/pulse-assets/workout-stretch.jpg";
const cardioImage = "/pulse-assets/workout-cardio.jpg";
const yogaImage = "/pulse-assets/workout-yoga.jpg";
const boxingImage = "/pulse-assets/workout-boxing.jpg";

function PhoneShell({ className = "", children }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2.5rem] border border-[var(--fc-border-strong)] bg-[#0d100b] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.48)] ${className}`}
    >
      <div className="absolute left-1/2 top-4 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
      <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#0d100b]">
        {children}
      </div>
    </div>
  );
}

export default function PulsePhoneShowcase({ compact = false }) {
  return (
    <div className={`relative mx-auto min-h-[520px] w-full max-w-[620px] ${compact ? "scale-[0.9]" : ""}`}>
      <div className="absolute left-[16%] top-[18%] h-[360px] w-[360px] rounded-full bg-[var(--fc-accent)]/15 blur-[14px]" />
      <div className="absolute right-0 top-9 h-[420px] w-[280px] rounded-[3.2rem] border border-[var(--fc-border)] bg-gradient-to-br from-emerald-500/55 to-transparent opacity-80 shadow-[0_24px_80px_rgba(184,245,61,0.1)]" />

      <PhoneShell className="absolute left-[11%] top-[140px] z-10 h-[440px] w-[212px]">
        <Image src={heroImage} alt="Workout" fill sizes="212px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--fc-accent)]">
            Day 12
          </p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">
            Discover a healthier you
          </h3>
          <button
            type="button"
            className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]"
            aria-label="Start"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </PhoneShell>

      <PhoneShell className="absolute right-[5%] top-[20px] z-20 h-[486px] w-[238px]">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">My Plan</h3>
            <Flame className="h-4 w-4 text-[var(--fc-accent)]" />
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2 text-[9px] font-bold">
            {[12, 13, 14, 15, 16, 17].map((day) => (
              <span
                key={day}
                className={`flex h-6 items-center justify-center rounded-full ${
                  day === 15
                    ? "bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]"
                    : "bg-[#25291e] text-[var(--fc-muted)]"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          <div className="relative mt-4 h-24 overflow-hidden rounded-2xl">
            <Image src={stretchImage} alt="" fill sizes="198px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <p className="text-[8px] font-black uppercase text-[var(--fc-accent)]">
                Today
              </p>
              <p className="text-sm font-black text-white">Strength</p>
              <p className="text-[8px] text-white/70">25 min · 530 kcal</p>
            </div>
            <button
              type="button"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]"
              aria-label="Play"
            >
              <Play className="h-3 w-3 fill-current" />
            </button>
          </div>

          <p className="mt-4 text-[10px] font-semibold text-[var(--fc-muted)]">Categories</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["Cardio", cardioImage],
              ["Yoga", yogaImage],
              ["Boxing", boxingImage],
            ].map(([label, image]) => (
              <div key={label} className="relative h-14 overflow-hidden rounded-3xl bg-black/40">
                <Image src={image} alt="" fill sizes="62px" className="object-cover" />
                <div className="absolute inset-0 bg-black/35" />
                <span className="absolute bottom-1.5 left-1.5 text-[8px] font-black text-white">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PhoneShell>

      <PhoneShell className="absolute right-[0%] top-[118px] z-0 h-[350px] w-[214px] opacity-35">
        <div className="h-full bg-[#0d100b]" />
        <div className="absolute left-5 top-16 h-12 w-40 rounded-2xl bg-white/8" />
        <div className="absolute left-5 top-32 h-12 w-40 rounded-2xl bg-white/8" />
        <div className="absolute left-5 top-44 h-7 w-36 rounded-full bg-[var(--fc-accent)]" />
      </PhoneShell>
    </div>
  );
}
