"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PulseLogo from "@/src/components/PulseLogo";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--fc-border)] bg-[rgba(16,19,13,0.76)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <PulseLogo />

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--fc-muted)] md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#workouts" className="transition hover:text-white">Workouts</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.05]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden items-center gap-2 rounded-xl bg-[var(--fc-accent)] px-5 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] shadow-[0_12px_36px_rgba(184,245,61,0.22)] transition hover:bg-[var(--fc-accent-strong)] sm:inline-flex"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
