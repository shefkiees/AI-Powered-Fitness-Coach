import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: LucideIcon;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon: Icon, className = "", id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-wider text-slate-400"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {Icon ? (
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border bg-slate-950/50 py-3 text-slate-100 placeholder:text-slate-600 outline-none transition focus:ring-2 focus:ring-lime-500/40 ${
              Icon ? "pl-10 pr-3" : "px-3"
            } ${error ? "border-red-500/50" : "border-slate-600 focus:border-lime-500/50"} ${className}`}
            {...rest}
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
