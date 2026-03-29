"use client";

import dynamic from "next/dynamic";

export const PoseCameraPreview = dynamic(
  () =>
    import("./PoseCameraPreview").then((m) => ({
      default: m.PoseCameraPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/50">
        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-500/30 border-t-lime-400" />
          Loading camera module…
        </div>
      </div>
    ),
  },
);
