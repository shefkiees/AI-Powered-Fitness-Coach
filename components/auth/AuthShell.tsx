"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Sparkles } from "lucide-react";

const formVariants = {
  hidden: { opacity: 0, y: 32, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type Props = {
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ children, footer }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--fc-bg-page)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#030712_0%,#0c4a6e_35%,#052e16_70%,#030712_100%)]"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -left-40 top-20 h-[480px] w-[480px] rounded-full bg-emerald-500/25 blur-[130px]"
        animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-32 bottom-10 h-[520px] w-[520px] rounded-full bg-cyan-500/22 blur-[120px]"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[var(--fc-accent)]/12 blur-[100px]"
        animate={{ opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-14 sm:px-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-14 lg:py-10">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-10 hidden max-w-md flex-1 flex-col justify-center lg:flex"
        >
          <Link
            href="/"
            className="group mb-8 inline-flex items-center gap-3 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-accent)] via-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-lime-900/40 transition group-hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-left text-[11px] font-bold uppercase leading-snug tracking-[0.18em] text-cyan-200/95">
              AI FITNESS
              <br />
              <span className="text-[var(--fc-accent)]">COACH</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Premium training intelligence—sessions, form check, and coaching in
            one place.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Dark, focused UI built for consistency: log in and pick up exactly
            where you left off.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Timed workouts", "Pose overlay", "AI coach chat"].map((t) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + t.length * 0.01 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm backdrop-blur-sm transition duration-300 hover:border-[var(--fc-accent)]/35 hover:bg-white/[0.09]"
              >
                <Activity className="h-3.5 w-3.5 text-[var(--fc-accent)]" />
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <div className="flex w-full flex-1 flex-col items-center justify-center lg:max-w-[440px]">
          <Link
            href="/"
            className="mb-6 flex items-center gap-3 text-sm font-medium text-slate-400 transition hover:text-white lg:hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-accent)] to-cyan-500 text-slate-950 shadow-lg">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.2em] text-cyan-200">
              AI FITNESS COACH
            </span>
          </Link>

          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="show"
            className="w-full"
          >
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-[1px] shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="rounded-[22px] bg-slate-950/80 px-6 py-9 shadow-inner shadow-black/40 backdrop-blur-2xl sm:px-8 sm:py-10">
                {children}
              </div>
            </div>
            {footer ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="mt-8 text-center text-sm text-slate-500"
              >
                {footer}
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
