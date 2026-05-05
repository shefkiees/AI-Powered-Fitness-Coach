"use client";

import { Flame, Utensils } from "lucide-react";

export default function NutritionCard({ plan }) {
  const macros = [
    { label: "Protein", value: plan?.protein_g || 0, suffix: "g", className: "bg-emerald-300/14 text-emerald-100" },
    { label: "Carbs", value: plan?.carbs_g || 0, suffix: "g", className: "bg-[var(--fc-accent)]/14 text-[var(--fc-accent)]" },
    { label: "Fat", value: plan?.fat_g || 0, suffix: "g", className: "bg-amber-300/14 text-amber-100" },
  ];

  return (
    <section className="pulse-card rounded-[1.5rem] p-5">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.35rem] border border-[var(--fc-border)] bg-gradient-to-br from-[rgba(184,245,61,0.16)] via-white/[0.04] to-emerald-300/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--fc-muted)]">
                Daily target
              </p>
              <p className="mt-3 text-4xl font-black text-white">{plan?.calories || "--"}</p>
              <p className="mt-1 text-sm text-[var(--fc-muted)]">calories estimate</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fc-accent)]/16 text-[var(--fc-accent)]">
              <Flame className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {macros.map((macro) => (
              <div key={macro.label} className={`rounded-2xl p-3 ${macro.className}`}>
                <p className="text-lg font-black">
                  {macro.value}
                  {macro.suffix}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">
                  {macro.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-[var(--fc-accent)]" />
            <h2 className="text-lg font-black text-white">Meal suggestions</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {(plan?.meals || []).map((meal) => (
              <article key={meal.id || meal.title} className="rounded-[1.2rem] border border-[var(--fc-border)] bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{meal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">{meal.description}</p>
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-200">
                    {meal.calories} kcal
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      {plan?.notes ? <p className="mt-4 text-sm leading-6 text-[var(--fc-muted)]">{plan.notes}</p> : null}
    </section>
  );
}
