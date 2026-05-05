"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Sparkles } from "lucide-react";
import { navItems } from "@/src/components/navigation";
import PulseLogo from "@/src/components/PulseLogo";

export default function Sidebar({ onLogout }) {
  const pathname = usePathname() || "";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/[0.07] bg-[rgba(5,8,6,0.88)] p-4 shadow-[24px_0_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl lg:block">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(184,245,61,0.07),transparent_34%)]" />
      <div className="relative flex h-full flex-col">
        <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <PulseLogo href="/dashboard" subtitle="AI fitness operating system" />
        </div>

        <div className="mt-7 px-3 text-[0.67rem] font-black uppercase tracking-[0.26em] text-[var(--fc-text-soft)]">
          Product
        </div>

        <nav className="mt-3 grid gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-[rgba(184,245,61,0.24)] bg-[rgba(184,245,61,0.11)] text-white shadow-[0_16px_38px_rgba(0,0,0,0.24)]"
                    : "border-transparent text-[var(--fc-muted)] hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                    active
                      ? "bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]"
                      : "bg-white/[0.04] text-[var(--fc-muted)] group-hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {active ? <ChevronRight className="h-4 w-4 text-[var(--fc-accent)]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 px-3 text-[0.67rem] font-black uppercase tracking-[0.26em] text-[var(--fc-text-soft)]">
          Intelligence
        </div>
        <div className="mt-3 rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(184,245,61,0.1),rgba(255,255,255,0.035))] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--fc-accent)] text-[var(--fc-accent-ink)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-white">Pulse Coach</p>
              <p className="text-xs text-[var(--fc-muted)]">Adaptive plan engine</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full w-[72%] rounded-full bg-[var(--fc-accent)]/80" />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--fc-muted)]">
            Recommendations improve as workouts, nutrition, and progress data grow.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-sm font-semibold text-white transition hover:border-white/[0.16] hover:bg-white/[0.08]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
