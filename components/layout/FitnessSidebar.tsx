"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Camera,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/dashboard", label: "Hub", icon: LayoutDashboard },
  { href: "/workout", label: "Workouts", icon: Activity },
  { href: "/pose-estimation", label: "Form check", icon: Camera },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function FitnessSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-5.5rem)] w-56 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl lg:flex">
      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Navigate
      </p>
      <nav className="flex flex-1 flex-col gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-gradient-to-r from-[var(--fc-accent)]/20 to-cyan-500/10 text-white ring-1 ring-[var(--fc-accent)]/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
