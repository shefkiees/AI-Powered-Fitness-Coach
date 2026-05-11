"use client";

import { BadgeCheck, CircleAlert, Eye } from "lucide-react";
import { cn } from "@/lib/cn";
import { SETUP_DEFAULTS, type SetupGuidance } from "@/lib/pose/poseTypes";

export type PoseVisibilityChecklistProps = {
  setup?: SetupGuidance;
};

export function PoseVisibilityChecklist({ setup }: PoseVisibilityChecklistProps) {
  return (
    <div className="fc-glass rounded-[1.75rem] p-5">
      <div className="flex items-center gap-2 text-[var(--fc-accent)]">
        <Eye className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em]">Body visibility</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(setup?.checklist || SETUP_DEFAULTS).map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold",
              item.ok
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : "border-amber-400/20 bg-amber-400/10 text-amber-100",
            )}
          >
            {item.ok ? <BadgeCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
            {item.label}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(setup?.messages.length ? setup.messages : ["Start camera"]).map((message) => (
          <span
            key={message}
            className="rounded-full border border-[var(--fc-border)] bg-black/25 px-3 py-1.5 text-xs font-black text-[var(--fc-muted)]"
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
