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
    <div className="min-h-screen bg-[var(--fc-bg-page)] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.08),transparent),radial-gradient(ellipse_60%_40%_at_0%_100%,rgba(163,230,53,0.06),transparent)]"
        aria-hidden
      />

      <FitnessTopBar />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl gap-6 px-4 pb-16 pt-6 lg:px-6">
        <FitnessSidebar />
        <div className="min-w-0 flex-1">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
