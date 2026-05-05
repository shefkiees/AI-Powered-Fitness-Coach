"use client";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center p-6 text-[var(--fc-muted)]">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-white/[0.04] px-4 py-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--fc-accent)]/25 border-t-[var(--fc-accent)]" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
