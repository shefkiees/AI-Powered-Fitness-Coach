import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "border border-[var(--fc-accent)] bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_18px_44px_rgba(212,255,63,0.2)] hover:bg-[var(--fc-accent-strong)]",
  secondary:
    "border border-[var(--fc-border)] bg-white/[0.04] text-slate-100 hover:border-white/14 hover:bg-white/[0.07]",
  ghost:
    "border border-transparent bg-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white",
  danger:
    "border border-red-500/30 bg-red-950/30 text-red-200 hover:bg-red-950/50",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      className = "",
      variant = "primary",
      loading,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.99]",
          variants[variant],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span
            className={cn(
              "h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
              variant === "primary"
                ? "border-slate-950/25 border-t-slate-950"
                : "border-white/30 border-t-white",
            )}
          />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
