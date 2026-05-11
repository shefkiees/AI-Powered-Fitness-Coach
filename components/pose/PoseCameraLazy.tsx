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
      <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] bg-[#090909] ring-1 ring-white/10 sm:min-h-[520px] lg:min-h-[620px]">
        <div className="flex flex-col items-center gap-2 text-sm text-white/45">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--fc-accent)]/30 border-t-[var(--fc-accent)]" />
          Loading camera module...
        </div>
      </div>
    ),
  },
);
