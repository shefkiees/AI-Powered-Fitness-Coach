import type { ReactNode } from "react";
import { ArrowUpRight, Dumbbell, Sparkles, Target } from "lucide-react";
import { BrandLockup } from "@/components/brand/Brand";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  eyebrow?: string;
  visualTitle?: string;
  visualSubtitle?: string;
};

const leftRailItems = [
  { label: "AI coaching", value: "Daily structure" },
  { label: "Premium flow", value: "Fast entry" },
  { label: "Training focus", value: "Clear decisions" },
] as const;

export default function AuthShell({
  title,
  subtitle,
  children,
  eyebrow = "Premium access",
  visualTitle = "Fitness App",
  visualSubtitle = "Build your perfect workout plan with smart AI logic.",
}: Props) {
  return (
    <div className="pulse-page relative min-h-screen overflow-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_6%,rgba(184,245,61,0.16),transparent_28%)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,rgba(255,255,255,0.02),transparent)]"
        aria-hidden
      />

      {/* FIXED */}
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-[var(--fc-accent)]/10 blur-3xl" />

      {/* FIXED */}
      <div className="pointer-events-none absolute -right-40 top-36 h-112 w-md rounded-full bg-white/6 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-14 px-6 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:px-8">
        <div className="flex flex-col justify-between">
          <div className="pt-2">
            <BrandLockup
              subtitle="Premium fitness access"
              titleClassName="text-white"
              subtitleClassName="text-[var(--fc-muted)]"
            />
          </div>

          <div className="hidden lg:block">
            <div className="relative max-w-2xl py-8">
              <div className="absolute inset-y-0 left-0 w-px bg-white/8" />

              <div className="pl-8">
                <h1 className="max-w-xl text-6xl font-black leading-[0.9] tracking-[-0.06em] text-white xl:text-[5.4rem]">
                  {visualTitle}
                  <span className="ml-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_12px_30px_rgba(184,245,61,0.18)]">
                    <Dumbbell className="h-7 w-7" />
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-xl leading-9 text-[var(--fc-muted)]">
                  {visualSubtitle}
                </p>

                <div className="mt-10 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border)] bg-black/18 px-4 py-2 text-sm text-slate-200">
                    <Target className="h-4 w-4 text-[var(--fc-accent)]" />
                    Smarter plans
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border)] bg-black/18 px-4 py-2 text-sm text-slate-200">
                    <Sparkles className="h-4 w-4 text-[var(--fc-accent)]" />
                    Cleaner flow
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
            {leftRailItems.map((item) => (
              <div key={item.label} className="border-t border-[var(--fc-border)] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--fc-muted)]">
                  {item.label}
                </p>
                <p className="mt-3 text-base font-semibold text-slate-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          {/* FIXED */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-112 -translate-y-1/2 rounded-[2.2rem] border border-[var(--fc-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />

          {/* FIXED */}
          <div className="pointer-events-none absolute left-8 right-8 top-1/2 h-88 -translate-y-1/2 rounded-full bg-[var(--fc-accent)]/8 blur-3xl" />

          {/* FIXED */}
          <div className="relative z-10 w-full max-w-107.5 py-10">
            <div className="mb-8 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7e8fb0]">
                {eyebrow}
              </p>

              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--fc-border)] bg-white/5 text-white">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>

            <h2 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              {title}
            </h2>

            <p className="mt-4 max-w-md text-lg leading-8 text-[var(--fc-muted)]">
              {subtitle}
            </p>

            <div className="mt-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
