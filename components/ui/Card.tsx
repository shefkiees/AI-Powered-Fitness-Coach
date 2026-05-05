import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "article" | "section";
};

export function Card({
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <Tag
      className={`rounded-[1.5rem] border border-[var(--fc-border)] bg-[rgba(26,31,20,0.74)] p-6 shadow-[0_22px_64px_rgba(0,0,0,0.24)] backdrop-blur-sm transition-all duration-300 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
