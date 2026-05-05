import { cn } from "@/lib/cn";

type TextFieldOptions = {
  hasLeadingIcon?: boolean;
  hasTrailingControl?: boolean;
  error?: string;
  className?: string;
};

export function getTextFieldClassName({
  hasLeadingIcon = false,
  hasTrailingControl = false,
  error,
  className,
}: TextFieldOptions) {
  return cn(
    "w-full rounded-2xl border bg-black/25 py-3.5 text-sm text-slate-100 outline-none transition duration-200",
    "placeholder:text-[rgba(170,175,157,0.55)] focus:border-[var(--fc-accent)]/60 focus:bg-black/30 focus:ring-2 focus:ring-[var(--fc-accent)]/10",
    error
      ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/10"
      : "border-[var(--fc-border)]",
    hasLeadingIcon ? "pl-11" : "px-4",
    hasTrailingControl ? "pr-12" : "pr-4",
    className,
  );
}
