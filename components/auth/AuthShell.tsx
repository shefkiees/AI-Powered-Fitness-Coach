"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ children, footer }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b12]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#0c1222_0%,#0a1628_45%,#14220a_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-lime-500/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-emerald-600/12 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(163,230,53,0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(99,102,241,0.1),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-lime-300"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-600 shadow-lg shadow-lime-900/40">
            <Sparkles className="h-4 w-4 text-slate-950" />
          </span>
          <span className="uppercase tracking-[0.2em] text-lime-400/90">
            AI Fitness Coach
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-px shadow-2xl shadow-black/50 backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))",
            }}
          >
            <div className="rounded-[22px] bg-slate-950/80 px-6 py-8 shadow-inner shadow-black/25 backdrop-blur-2xl sm:px-8 sm:py-10">
              {children}
            </div>
          </div>
          {footer ? (
            <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
