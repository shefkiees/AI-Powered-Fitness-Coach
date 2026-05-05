"use client";

import dynamic from "next/dynamic";

export const PoseCameraPreview = dynamic(
  () =>
    import("./PoseCameraPreview").then((module) => ({
      default: module.PoseCameraPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,var(--fc-panel)_0%,var(--fc-panel-strong)_100%)]">
        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--fc-accent)]/30 border-t-[var(--fc-accent)]" />
          Loading camera module...
        </div>
      </div>
    ),
  },
);
