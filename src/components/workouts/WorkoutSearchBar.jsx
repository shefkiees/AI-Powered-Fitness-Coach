"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export default function WorkoutSearchBar({ value, onChange, resultCount, totalCount }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#111827] text-emerald-300 shadow-[0_16px_32px_rgba(17,24,39,0.16)]">
          <SlidersHorizontal className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-[#111827]">Training library</h2>
          <p className="mt-1 text-sm font-semibold text-[#6b7280]">
            Showing {resultCount} of {totalCount} workouts
          </p>
        </div>
      </div>

      <label className="relative block w-full lg:max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-white/70 bg-white/72 px-11 text-sm font-bold text-[#111827] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_28px_rgba(17,24,39,0.07)] backdrop-blur-xl transition placeholder:text-[#9ca3af] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          placeholder="Search workouts, muscles, goals"
        />
      </label>
    </div>
  );
}
