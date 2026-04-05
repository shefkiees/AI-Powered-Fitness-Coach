import { cn } from "@/lib/cn";

type Props = {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  label?: string;
  showValue?: boolean;
};

export function ProgressBar({
  value,
  max = 100,
  className,
  trackClassName,
  fillClassName,
  label,
  showValue,
}: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-slate-500">
          {label ? <span>{label}</span> : <span />}
          {showValue ? (
            <span className="tabular-nums text-slate-400">{Math.round(pct)}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-white/5",
          trackClassName,
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-[var(--fc-accent)] to-cyan-400 transition-[width] duration-300 ease-out",
            fillClassName,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
