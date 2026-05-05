"use client";

import { CalendarDays, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { formatNumber, toDateInputValue } from "@/src/utils/formatters";

export default function GoalCard({ goal, onEdit, onDelete, onToggleStatus, busy }) {
  const target = Number(goal.target_value || 0);
  const current = Number(goal.current_value || 0);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const completed = goal.status === "completed";

  return (
    <article className="pulse-card rounded-[1.5rem] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${completed ? "bg-emerald-300/14 text-emerald-100" : "bg-[var(--fc-accent)]/14 text-[var(--fc-accent)]"}`}>
              {completed ? "Completed" : "Active"}
            </span>
            {goal.deadline ? (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--fc-muted)]">
                <CalendarDays className="h-3.5 w-3.5" />
                {toDateInputValue(goal.deadline)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 break-words text-xl font-black text-white">{goal.title}</h3>
          {goal.description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">{goal.description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="rounded-xl border border-[var(--fc-border)] bg-white/[0.04] p-2 text-[var(--fc-muted)] transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Edit goal"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="rounded-xl border border-red-400/20 bg-red-400/10 p-2 text-red-100 transition hover:bg-red-400/16"
            aria-label="Delete goal"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-white">
            {formatNumber(current)} / {formatNumber(target)} {goal.unit}
          </span>
          <span className="text-[var(--fc-muted)]">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[var(--fc-accent)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onToggleStatus(goal)}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {completed ? "Set active" : "Mark completed"}
      </button>
    </article>
  );
}
