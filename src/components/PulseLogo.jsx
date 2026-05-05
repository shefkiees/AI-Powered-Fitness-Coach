"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function PulseLogo({ href = "/", subtitle, compact = false, className = "" }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-3 ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.05rem] bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_0_28px_rgba(184,245,61,0.22)]">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-black leading-none tracking-[-0.01em] text-[var(--fc-text)]">
          Pulse
        </span>
        {subtitle && !compact ? (
          <span className="mt-1 block text-[11px] font-semibold text-[var(--fc-muted)]">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
