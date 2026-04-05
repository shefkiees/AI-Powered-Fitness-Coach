import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
};

export function StatTile({ icon: Icon, label, value, hint, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/90 bg-slate-950/50 p-4 shadow-inner shadow-black/20 transition-all duration-300 hover:border-[var(--fc-accent)]/25",
        className,
      )}
    >
      <Icon className="h-5 w-5 text-[var(--fc-accent)]" aria-hidden />
      <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-600">{hint}</p> : null}
    </div>
  );
}
