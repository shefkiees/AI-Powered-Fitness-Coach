import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-lime-500 to-emerald-600 text-slate-950 shadow-lg shadow-lime-900/25 hover:brightness-105 active:scale-[0.98]",
  secondary:
    "border border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-800 active:scale-[0.98]",
  ghost: "text-slate-300 hover:bg-slate-800/80 active:scale-[0.98]",
  danger:
    "border border-red-500/40 bg-red-950/40 text-red-200 hover:bg-red-950/60 active:scale-[0.98]",
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        {...rest}
      >
        {loading ? (
          <span
            className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${
              variant === "primary"
                ? "border-slate-900/30 border-t-slate-900"
                : "border-white/30 border-t-white"
            }`}
          />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
