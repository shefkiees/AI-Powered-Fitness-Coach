import { cn } from "@/lib/cn";

export function formatTimerMMSS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type Props = {
  seconds: number;
  className?: string;
};

export function TimerDisplay({ seconds, className }: Props) {
  return (
    <span
      className={cn(
        "font-mono text-6xl font-bold tabular-nums tracking-tight text-white sm:text-7xl",
        className,
      )}
    >
      {formatTimerMMSS(seconds)}
    </span>
  );
}
