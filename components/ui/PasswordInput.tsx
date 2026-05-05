"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { getTextFieldClassName } from "@/components/ui/textFieldStyles";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = "", id, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
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
        <div className="relative flex items-center">
          <Lock className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--fc-muted)]" />
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={getTextFieldClassName({
              hasLeadingIcon: true,
              hasTrailingControl: true,
              error,
              className,
            })}
            {...rest}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 rounded-xl p-2 text-[var(--fc-muted)] transition hover:bg-white/[0.06] hover:text-slate-100"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
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

PasswordInput.displayName = "PasswordInput";
