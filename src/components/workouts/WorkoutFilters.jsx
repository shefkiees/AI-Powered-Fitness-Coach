"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Check, Clock3, Filter, RefreshCw, Sparkles, Target, X } from "lucide-react";
import WorkoutSearchBar from "@/src/components/workouts/WorkoutSearchBar";

export const allValue = "all";

const viewFilters = [
  ["recommended", "Recommended"],
  ["all", "All"],
  ["favorites", "Favorites"],
  ["completed", "Completed"],
];

export const durationFilters = [
  { value: allValue, label: "Any duration", test: () => true },
  { value: "short", label: "Under 20 min", test: (minutes) => Number(minutes || 0) <= 20 },
  { value: "medium", label: "20-40 min", test: (minutes) => Number(minutes || 0) > 20 && Number(minutes || 0) <= 40 },
  { value: "long", label: "40+ min", test: (minutes) => Number(minutes || 0) > 40 },
];

export const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "duration", label: "Duration" },
  { value: "difficulty", label: "Difficulty" },
  { value: "popularity", label: "Popularity" },
];

function labelFromValue(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SelectControl({ icon: Icon, label, value, onChange, options, includeAll = true, labelFor = labelFromValue }) {
  const finalOptions = includeAll ? [allValue, ...options] : options;

  return (
    <label className="grid gap-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#6b7280]">
      {label}
      <span className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-white/70 bg-white/72 px-10 pr-9 text-sm font-black normal-case tracking-normal text-[#111827] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_28px_rgba(17,24,39,0.06)] backdrop-blur-xl transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
          {finalOptions.map((option) => (
            <option key={option} value={option}>
              {option === allValue && includeAll ? `All ${label.toLowerCase()}` : labelFor(option)}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

export default function WorkoutFilters({
  filters,
  categories,
  difficulties,
  muscleGroups,
  resultCount,
  totalCount,
  setFilter,
  resetFilters,
}) {
  const chips = [
    filters.search ? ["search", `"${filters.search}"`] : null,
    filters.category !== allValue ? ["category", labelFromValue(filters.category)] : null,
    filters.difficulty !== allValue ? ["difficulty", labelFromValue(filters.difficulty)] : null,
    filters.duration !== allValue ? ["duration", durationFilters.find((item) => item.value === filters.duration)?.label] : null,
    filters.muscle !== allValue ? ["muscle", labelFromValue(filters.muscle)] : null,
    filters.view !== "recommended" ? ["view", labelFromValue(filters.view)] : null,
    filters.sortBy !== "newest" ? ["sortBy", sortOptions.find((item) => item.value === filters.sortBy)?.label] : null,
  ].filter(Boolean);

  return (
    <motion.section
      layout
      className="sticky top-[5.8rem] z-10 mb-7 rounded-[1.6rem] border border-white/70 bg-white/72 p-4 shadow-[0_18px_46px_rgba(17,24,39,0.08)] backdrop-blur-2xl sm:p-5"
    >
      <WorkoutSearchBar
        value={filters.search}
        onChange={(value) => setFilter("search", value)}
        resultCount={resultCount}
        totalCount={totalCount}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.85fr_0.9fr_1fr_0.85fr]">
        <SelectControl
          icon={Filter}
          label="Category"
          value={filters.category}
          onChange={(value) => setFilter("category", value)}
          options={categories}
        />
        <SelectControl
          icon={Sparkles}
          label="Level"
          value={filters.difficulty}
          onChange={(value) => setFilter("difficulty", value)}
          options={difficulties}
        />
        <SelectControl
          icon={Clock3}
          label="Duration"
          value={filters.duration}
          onChange={(value) => setFilter("duration", value)}
          options={durationFilters.map((item) => item.value)}
          includeAll={false}
          labelFor={(value) => durationFilters.find((item) => item.value === value)?.label || value}
        />
        <SelectControl
          icon={Target}
          label="Muscle"
          value={filters.muscle}
          onChange={(value) => setFilter("muscle", value)}
          options={muscleGroups}
        />
        <SelectControl
          icon={ArrowDownUp}
          label="Sort"
          value={filters.sortBy}
          onChange={(value) => setFilter("sortBy", value)}
          options={sortOptions.map((item) => item.value)}
          includeAll={false}
          labelFor={(value) => sortOptions.find((item) => item.value === value)?.label || value}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {viewFilters.map(([value, label]) => (
          <motion.button
            key={value}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter("view", value)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
              filters.view === value
                ? "bg-[#111827] text-white shadow-[0_14px_28px_rgba(17,24,39,0.18)]"
                : "border border-white/70 bg-white/70 text-[#6b7280] hover:bg-white hover:text-[#111827]"
            }`}
          >
            {filters.view === value ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : null}
            {label}
          </motion.button>
        ))}

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={resetFilters}
          className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-black text-[#111827] shadow-sm transition hover:bg-[#f3f4f6]"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {chips.length ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e7eb] pt-4"
          >
            {chips.map(([key, label]) => (
              <motion.button
                layout
                key={`${key}:${label}`}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(key, key === "search" ? "" : key === "sortBy" ? "newest" : key === "view" ? "recommended" : allValue)}
                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#111827] px-3 py-1.5 text-xs font-black text-white"
              >
                {label}
                <X className="h-3.5 w-3.5 text-emerald-300" />
              </motion.button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
