"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
  className?: string;
};

export function ProgressRing({
  value,
  max = 100,
  label,
  sublabel,
  size = 88,
  className,
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("flex flex-col items-center gap-2 text-center", className)}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="-rotate-90"
          width={size}
          height={size}
          viewBox="0 0 88 88"
          aria-hidden
        >
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="rgba(51,65,85,0.5)"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={`url(#fc-ring-${gradId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
          <defs>
            <linearGradient
              id={`fc-ring-${gradId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="var(--fc-accent)" />
              <stop offset="100%" stopColor="var(--fc-accent-2)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums text-white">
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        {sublabel ? (
          <p className="text-[11px] text-slate-500">{sublabel}</p>
        ) : null}
      </div>
    </div>
  );
}
