import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { getTextFieldClassName } from "@/components/ui/textFieldStyles";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: LucideIcon;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon: Icon, className = "", id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full space-y-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-black uppercase tracking-[0.22em] text-[var(--fc-muted)]"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {Icon ? (
            <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fc-muted)]" />
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={getTextFieldClassName({
              hasLeadingIcon: Boolean(Icon),
              error,
              className,
            })}
            {...rest}
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
