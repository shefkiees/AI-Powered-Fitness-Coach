"use client";

import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function EmptyState({
  icon: Icon = PlusCircle,
  title,
  description,
  actionHref,
  actionLabel,
  onAction,
  secondaryActionHref,
  secondaryActionLabel,
  onSecondaryAction,
  tone = "default",
}) {
  const actionClasses =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-5 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_16px_38px_rgba(184,245,61,0.13)] transition hover:bg-[var(--fc-accent-strong)]";
  const secondaryClasses =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.045] px-5 py-2.5 text-sm font-bold text-white transition hover:border-white/[0.18] hover:bg-white/[0.08]";
  const iconTone =
    tone === "danger"
      ? "bg-rose-400/10 text-rose-100 ring-rose-300/15"
      : "bg-[var(--fc-accent)]/10 text-[var(--fc-accent)] ring-[rgba(184,245,61,0.18)]";

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-dashed border-white/[0.14] bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-8 text-center shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,245,61,0.09),transparent_32%)]" />
      <div className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ring-1 ${iconTone}`}>
        <div className="absolute inset-2 rounded-2xl bg-white/[0.035]" />
        <Icon className="relative h-7 w-7" />
      </div>
      <h3 className="relative mt-5 text-xl font-black tracking-[-0.01em] text-white">{title}</h3>
      <p className="relative mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--fc-muted)]">
        {description}
      </p>
      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
        {actionLabel && actionHref ? (
          <Link href={actionHref} className={actionClasses}>
            {actionLabel}
          </Link>
        ) : null}
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className={actionClasses}>
            {actionLabel}
          </button>
        ) : null}
        {secondaryActionLabel && secondaryActionHref ? (
          <Link href={secondaryActionHref} className={secondaryClasses}>
            {secondaryActionLabel}
          </Link>
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <button type="button" onClick={onSecondaryAction} className={secondaryClasses}>
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
