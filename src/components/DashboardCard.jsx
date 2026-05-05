"use client";

export default function DashboardCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "lime",
  children,
}) {
  const tones = {
    lime: "from-[rgba(184,245,61,0.18)] to-white/[0.035] text-[var(--fc-accent)]",
    cyan: "from-emerald-300/16 to-white/[0.035] text-emerald-200",
    amber: "from-amber-300/16 to-white/[0.035] text-amber-200",
    rose: "from-rose-300/16 to-white/[0.035] text-rose-200",
  };

  return (
    <section className="rounded-[1.5rem] border border-[var(--fc-border)] bg-gradient-to-br p-4 shadow-[0_22px_64px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className={`rounded-[1.25rem] bg-gradient-to-br ${tones[tone] || tones.lime} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fc-muted)]">
              {title}
            </p>
            <p className="mt-3 break-words text-3xl font-black text-white">{value}</p>
            {helper ? <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">{helper}</p> : null}
          </div>
          {Icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--fc-border)] bg-black/20">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </section>
  );
}
