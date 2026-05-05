"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import MobileNav from "@/src/components/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/src/utils/supabaseData";

const COACH_EMBED_PREFIXES = [
  "/dashboard",
  "/goals",
  "/nutrition-plan",
  "/exercise-library",
  "/workout-plan",
  "/progress-tracker",
  "/settings",
  "/workout",
  "/pose-estimation",
  "/profile",
];

function useCoachShellEmbed() {
  const pathname = usePathname() ?? "";
  void pathname;
  void COACH_EMBED_PREFIXES;
  return false;
}

function formatDisplayName(value, fallback = "Athlete") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProfileBadge({ profile, user }) {
  const displayName = formatDisplayName(
    profile?.name || user?.user_metadata?.full_name || user?.email?.split("@")?.[0],
  );
  const initial = displayName.charAt(0).toUpperCase();
  const image = profile?.profile_image || "";

  return (
    <Link
      href="/profile"
      className="flex min-w-0 items-center gap-3 rounded-full border border-[#ececef] bg-white px-2.5 py-2 pr-3 shadow-sm transition hover:border-[#d1d5db] hover:bg-[#f9fafb]"
      aria-label="Open profile"
    >
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dcfce7] text-sm font-black text-[#15803d]">
        {image ? (
          <span
            role="img"
            aria-label={`${displayName} profile`}
            className="block h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
          />
        ) : (
          initial
        )}
      </span>
      <span className="hidden min-w-0 text-left sm:block">
        <span className="block max-w-36 truncate text-sm font-black text-[#111827]">
          {displayName}
        </span>
        <span className="block max-w-36 truncate text-[11px] font-semibold text-[#6b7280]">
          View profile
        </span>
      </span>
    </Link>
  );
}

export default function AppLayout({ title, subtitle, actions = null, profile, children }) {
  const { user, signOut } = useAuth();
  const [headerProfile, setHeaderProfile] = useState(null);
  const embedded = useCoachShellEmbed();

  useEffect(() => {
    if (profile || !user) return;

    let cancelled = false;
    void getProfile()
      .then((data) => {
        if (!cancelled) setHeaderProfile(data);
      })
      .catch(() => {
        if (!cancelled) setHeaderProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [profile, user]);

  const displayedProfile = useMemo(() => profile || headerProfile, [headerProfile, profile]);

  const logout = async () => {
    await signOut();
    window.location.replace("/login");
  };

  const pageHeader = (
    <header className="sticky top-0 z-20 mb-5 rounded-[1.6rem] border border-[#ececef] bg-white/90 px-4 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#9ca3af]">AI Fitness Coach</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#171717]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {user ? <ProfileBadge profile={displayedProfile} user={user} /> : null}
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ececef] bg-white text-[#6b7280] shadow-sm transition hover:scale-[1.02] hover:text-[#111827]"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );

  if (embedded) {
    return (
      <div className="mx-auto max-w-[440px] px-3 pb-24 pt-4 text-[#171717] sm:px-4">
        {pageHeader}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <main className="mx-auto min-h-screen w-full max-w-6xl px-3 pb-28 pt-4 sm:px-5 lg:px-8">
        <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] border border-[#e5e7eb] bg-[#f8f8fb] p-3 shadow-[0_28px_60px_rgba(17,24,39,0.08)] sm:p-5 lg:p-6">
          {pageHeader}
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
