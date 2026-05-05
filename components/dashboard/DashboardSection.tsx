import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  subtitle?: string;
  id?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardSection({
  title,
  subtitle,
  id,
  children,
  className,
}: Props) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 space-y-4", className)}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id={id ? `${id}-heading` : undefined}
            className="text-xl font-black tracking-tight text-[#17181b]"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-sm leading-7 text-[#5d644e]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
