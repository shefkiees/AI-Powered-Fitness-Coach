import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "article" | "section";
};

export function Card({ as: Tag = "div", className = "", children, ...rest }: Props) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
