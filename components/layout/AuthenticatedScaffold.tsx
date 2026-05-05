"use client";

import type { ReactNode } from "react";
import { FitnessSidebar } from "@/components/layout/FitnessSidebar";
import { FitnessTopBar } from "@/components/layout/FitnessTopBar";

type Props = { children: ReactNode };

export function AuthenticatedScaffold({ children }: Props) {
  return (
    <div className="pulse-page min-h-screen text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_48%_6%,rgba(184,245,61,0.16),transparent_28%)]"
        aria-hidden
      />
      <FitnessTopBar />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl gap-6 px-4 pb-16 pt-6 lg:px-6">
        <FitnessSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
