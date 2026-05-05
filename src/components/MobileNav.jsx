"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/src/components/navigation";

const mobileItems = navItems.slice(0, 5);

export default function MobileNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-6xl px-4 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2">
      <div className="grid grid-cols-5 gap-1 rounded-[1.2rem] border border-[#e8e8ef] bg-white/90 p-1.5 shadow-[0_12px_32px_rgba(17,24,39,0.12)] backdrop-blur-xl">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
                active
                  ? "bg-[#dcfce7] text-[#14532d] ring-1 ring-[#86efac]"
                  : "text-[#6b7280] hover:bg-[#f4f4f5] hover:text-[#111827]"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-[#22c55e]" : ""}`} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
