"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Apple,
  BookOpen,
  Camera,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Target,
  UserRound,
  Dumbbell,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "AI Coach", icon: MessageSquare },
  { href: "/workout-plan", label: "Workouts", icon: Dumbbell },
  { href: "/pose-estimation", label: "Pose lab", icon: Camera },
];

const NAV_TRAIN: NavItem[] = [
  { href: "/exercise-library", label: "Exercise library", icon: BookOpen },
  { href: "/nutrition-plan", label: "Nutrition", icon: Apple },
  { href: "/progress-tracker", label: "Progress", icon: LineChart },
];

const NAV_ACCOUNT: NavItem[] = [
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ALL_NAV = [...NAV_MAIN, ...NAV_TRAIN, ...NAV_ACCOUNT];

function pageTitle(path: string): string {
  if (path === "/dashboard" || path === "/dashboard/") return "Overview";
  if (path.startsWith("/dashboard/chat")) return "AI Coach";
  if (path.startsWith("/workout")) return "Workout";
  const hit = ALL_NAV.find((n) =>
    n.href !== "/dashboard" ? path === n.href || path.startsWith(`${n.href}/`) : false,
  );
  return hit?.label ?? "Pulse";
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: NavItem["icon"];
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200",
        active
          ? "bg-[var(--fc-accent)]/12 text-[var(--fc-accent-strong)] shadow-[inset_0_0_0_1px_rgba(212,255,63,0.22)]"
          : "text-[var(--fc-muted)] hover:bg-white/[0.04] hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroup({ title, items, pathname, onPick }: { title: string; items: NavItem[]; pathname: string; onPick?: () => void }) {
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/dashboard/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mt-6 first:mt-2">
      <p className="px-3 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[var(--fc-text-soft)]">{title}</p>
      <div className="mt-2 flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={onPick} />
        ))}
      </div>
    </div>
  );
}

export function CoachShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const title = useMemo(() => pageTitle(pathname), [pathname]);

  const initial =
    user?.user_metadata?.full_name?.toString?.().charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div className="pulse-page pulse-shell-grid min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="sticky top-0 z-20 hidden h-screen w-[280px] shrink-0 flex-col border-r border-[var(--fc-border)] bg-[rgba(10,12,9,0.85)] px-4 py-7 backdrop-blur-2xl lg:flex">
          <div className="px-1">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--fc-accent)] text-[var(--fc-accent-ink)] shadow-[0_0_28px_rgba(212,255,63,0.2)]">
                <Activity className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[var(--fc-accent)]">Pulse</p>
                <p className="text-sm font-black tracking-tight">Fitness OS</p>
              </div>
            </Link>
          </div>

          <nav className="mt-2 flex flex-1 flex-col overflow-y-auto pr-1 custom-scrollbar">
            <NavGroup title="Main" items={NAV_MAIN} pathname={pathname} />
            <NavGroup title="Plan & data" items={NAV_TRAIN} pathname={pathname} />
            <NavGroup title="Account" items={NAV_ACCOUNT} pathname={pathname} />
          </nav>

          <div className="mt-auto border-t border-[var(--fc-border)] pt-5">
            <Link
              href="/"
              className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--fc-muted)] transition hover:bg-white/[0.04] hover:text-white"
            >
              <Home className="h-4 w-4" />
              Marketing site
            </Link>
            <button
              type="button"
              onClick={() => void signOut().then(() => (window.location.href = "/"))}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-200/90 transition hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--fc-border)] bg-[rgba(10,12,9,0.88)] px-4 py-3 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              className="rounded-xl border border-[var(--fc-border)] bg-white/[0.03] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white"
              onClick={() => setMobileOpen(true)}
            >
              Menu
            </button>
            <span className="text-sm font-black tracking-tight">
              Pulse <span className="text-[var(--fc-accent)]">{title}</span>
            </span>
            <span className="w-12" />
          </header>

          <header className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-6 border-b border-[var(--fc-border)] bg-[rgba(10,12,9,0.82)] px-8 backdrop-blur-xl lg:flex">
            <div>
              <p className="text-[0.6rem] font-black uppercase tracking-[0.24em] text-[var(--fc-text-soft)]">Pulse</p>
              <h1 className="text-lg font-black tracking-tight text-white">{title}</h1>
            </div>
            <div className="mx-6 hidden max-w-md flex-1 md:flex">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fc-text-soft)]" />
                <input
                  readOnly
                  placeholder="Search workouts, meals, goals…"
                  className="w-full rounded-full border border-[var(--fc-border)] bg-black/35 py-2.5 pl-10 pr-4 text-sm text-[var(--fc-muted)] outline-none ring-0 placeholder:text-[var(--fc-text-soft)]"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-right text-xs text-[var(--fc-muted)] sm:block">
                <span className="block font-semibold text-white">{user?.email?.split("@")[0]}</span>
                <span className="truncate text-[0.65rem] opacity-80">{user?.email}</span>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--fc-border)] bg-[var(--fc-accent)]/15 text-sm font-black text-[var(--fc-accent-strong)]">
                {initial}
              </span>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/70"
                aria-label="Close menu"
                onClick={closeMobile}
              />
              <div className="absolute left-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-r border-[var(--fc-border)] bg-[#0a0c08] p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-black">Navigate</p>
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="rounded-lg border border-[var(--fc-border)] px-2 py-1 text-xs font-bold text-[var(--fc-muted)]"
                  >
                    Close
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-0 overflow-y-auto">
                  <NavGroup title="Main" items={NAV_MAIN} pathname={pathname} onPick={closeMobile} />
                  <NavGroup title="Plan & data" items={NAV_TRAIN} pathname={pathname} onPick={closeMobile} />
                  <NavGroup title="Account" items={NAV_ACCOUNT} pathname={pathname} onPick={closeMobile} />
                </nav>
                <button
                  type="button"
                  onClick={() => void signOut().then(() => (window.location.href = "/"))}
                  className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-200/90"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}

          <main className="flex-1 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,255,63,0.035),transparent_50%)] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
