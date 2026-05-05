"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLockup } from "@/components/brand/Brand";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/components/layout/navConfig";

export function FitnessTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--fc-border)] bg-[rgba(16,19,13,0.78)] backdrop-blur-2xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
        <Link href="/dashboard" className="text-sm font-semibold text-white">
          <BrandLockup subtitle="Performance workspace" />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]"
                    : "text-[var(--fc-muted)] hover:bg-white/[0.04] hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--fc-border)] bg-white/[0.04] text-slate-200 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-[var(--fc-border)] bg-[rgba(16,19,13,0.96)] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]"
                    : "bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
