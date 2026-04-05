import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-lime-500 via-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-lime-900/30 duration-300 ease-out hover:brightness-110 hover:shadow-[0_0_32px_rgba(34,211,238,0.35),0_0_56px_rgba(163,230,53,0.2)] active:scale-[0.98]",
  secondary:
    "border border-slate-600 bg-slate-800/80 text-slate-100 duration-300 hover:border-slate-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]",
  ghost:
    "text-slate-300 duration-300 hover:bg-slate-800/80 hover:text-white active:scale-[0.98]",
  danger:
    "border border-red-500/40 bg-red-950/40 text-red-200 duration-300 hover:bg-red-950/60 hover:shadow-lg hover:shadow-red-900/20 active:scale-[0.98]",
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none ${variants[variant]} ${className}`}
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
