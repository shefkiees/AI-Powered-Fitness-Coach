"use client";

import type { ReactNode } from "react";
import { FitnessSidebar } from "@/components/layout/FitnessSidebar";
import { FitnessTopBar } from "@/components/layout/FitnessTopBar";

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function FitnessAppShell({ children, title, subtitle }: Props) {
  return (
    <div className="pulse-page min-h-screen text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_48%_6%,rgba(184,245,61,0.16),transparent_28%)]"
        aria-hidden
      />

      <FitnessTopBar />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl gap-6 px-4 pb-16 pt-6 lg:px-6">
        <FitnessSidebar />
        <div className="min-w-0 flex-1">
          <header className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--fc-accent)]">
              Pulse workspace
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--fc-muted)]">
                {subtitle}
              </p>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
