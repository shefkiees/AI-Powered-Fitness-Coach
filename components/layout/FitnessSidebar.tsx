"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronRight,
  Camera,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { BrandLockup } from "@/components/brand/Brand";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/workout", label: "Workouts", icon: Activity },
  { href: "/pose-estimation", label: "Form Lab", icon: Camera },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function FitnessSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7.25rem)] w-68 shrink-0 flex-col rounded-[1.75rem] border border-[var(--fc-border)] bg-[rgba(16,19,13,0.78)] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:flex">
      <div className="border-b border-[var(--fc-border)] px-2 pb-5">
        <BrandLockup
          subtitle="Training system"
          subtitleClassName="text-[var(--fc-muted)]"
          tileClassName="h-10 w-10 rounded-[1rem]"
          markClassName="h-4 w-4"
        />
        <p className="mt-4 text-sm leading-6 text-[var(--fc-muted)]">
          A cleaner workspace for planning, coaching, and execution.
        </p>
      </div>

      <div className="px-2 pt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fc-muted)]">
          Navigation
        </p>
      </div>

      <nav className="mt-3 flex flex-1 flex-col gap-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                active
                  ? "bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_12px_32px_rgba(184,245,61,0.16)]"
                  : "text-[var(--fc-muted)] hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border transition-all",
                  active
                    ? "border-black/10 bg-black/10 text-[var(--fc-accent-ink)]"
                    : "border-[var(--fc-border)] bg-white/[0.03] text-[var(--fc-muted)] group-hover:border-white/12 group-hover:text-slate-200",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{label}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition",
                  active
                    ? "text-[var(--fc-accent-ink)]"
                    : "text-[var(--fc-muted)] group-hover:text-slate-300",
                )}
              />
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--fc-muted)]">
          Training tip
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          Stay deliberate
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--fc-muted)]">
          Use Overview for decisions, Workouts for action, and Form Lab when
          technique needs attention.
        </p>
      </div>
    </aside>
  );
}
