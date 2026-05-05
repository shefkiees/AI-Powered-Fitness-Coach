import { cn } from "@/lib/cn";
import { Sparkles } from "lucide-react";

type BrandMarkProps = {
  className?: string;
  tileClassName?: string;
};

type BrandLockupProps = {
  className?: string;
  subtitle?: string;
  subtitleClassName?: string;
  titleClassName?: string;
  markClassName?: string;
  tileClassName?: string;
};

export function BrandMark({ className, tileClassName }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-[1.05rem] bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_0_28px_rgba(184,245,61,0.22)]",
        tileClassName,
      )}
      aria-hidden
    >
      <Sparkles className={cn("h-5 w-5", className)} />
    </span>
  );
}

export function BrandLockup({
  className,
  subtitle = "AI fitness coach",
  subtitleClassName,
  titleClassName,
  markClassName,
  tileClassName,
}: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark className={markClassName} tileClassName={tileClassName} />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-lg font-black leading-none tracking-[-0.01em] text-white",
            titleClassName,
          )}
        >
          Pulse
        </p>
        <p className={cn("mt-1 truncate text-[11px] font-semibold text-[var(--fc-muted)]", subtitleClassName)}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
