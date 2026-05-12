"use client";

import { PlayCircle, VideoOff } from "lucide-react";

export default function WorkoutVideoFallback({
  image,
  label = "Video unavailable",
  helper = "Add a demo video to show this movement in action.",
  className = "",
}) {
  return (
    <div className={`relative isolate grid min-h-[190px] place-items-center overflow-hidden bg-[#080b0a] ${className}`}>
      {image ? (
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-45 blur-md scale-110"
          style={{ backgroundImage: `url(${image})` }}
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_28%_18%,rgba(34,197,94,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.86),rgba(3,7,18,0.96))]" />
      <div className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="flex max-w-[18rem] flex-col items-center px-5 text-center">
        <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white shadow-[0_20px_55px_rgba(0,0,0,0.32)]">
          <PlayCircle className="h-8 w-8 opacity-30" />
          <VideoOff className="absolute bottom-3 right-3 h-4 w-4 text-emerald-300" />
        </span>
        <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-white">{label}</p>
        <p className="mt-2 text-sm leading-6 text-white/58">{helper}</p>
      </div>
    </div>
  );
}
