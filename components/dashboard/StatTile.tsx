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
        "rounded-3xl border border-white/8 bg-[linear-gradient(180deg,var(--fc-panel)_0%,var(--fc-panel-strong)_100%)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/12",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-[#111214] text-[var(--fc-accent)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-3xl font-bold tabular-nums text-[#17181b]">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7452]">
        {label}
      </p>
      {hint ? <p className="mt-2 text-sm text-[#5f664f]">{hint}</p> : null}
    </div>
  );
}
