"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  fetchExerciseLibrary,
  type ExerciseRow,
} from "@/lib/fetchExercises";

const ALL = "all";

export function WorkoutPlansGrid() {
  const [items, setItems] = useState<ExerciseRow[] | null>(null);
  const [filter, setFilter] = useState(ALL);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchExerciseLibrary()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Using offline exercise list.");
          setItems(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const list = items ?? [];
    const g = new Set<string>();
    list.forEach((e) => g.add(e.muscle_group || "general"));
    return [ALL, ...Array.from(g).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const list = items ?? [];
    if (filter === ALL) return list;
    return list.filter((e) => e.muscle_group === filter);
  }, [items, filter]);

  const loading = items === null && !loadError;

  return (
    <Card className="border-slate-700/60 bg-slate-900/40 shadow-xl shadow-black/15">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400/90">
            Exercise library
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">Movement catalog</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filter by muscle group. Images are illustrative—master technique
            first.
          </p>
        </div>
        <Activity className="h-8 w-8 shrink-0 text-lime-500/50" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Muscle
        </span>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              filter === g
                ? "border-lime-500/60 bg-lime-500/15 text-lime-200"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200",
            )}
          >
            {g === ALL ? "All" : g.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loadError ? (
        <p className="mt-3 text-xs text-amber-200/80">{loadError}</p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-slate-800/60"
              />
            ))
          : filtered.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  className={cn(
                    "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/50",
                    "transition duration-200 hover:-translate-y-1 hover:border-lime-500/35 hover:shadow-lg hover:shadow-lime-900/15",
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    <Image
                      src={ex.image_url}
                      alt={ex.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <span className="absolute left-2 top-2 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lime-200 backdrop-blur-sm">
                      {ex.muscle_group.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-white">{ex.name}</h3>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-400">
                      {ex.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          No exercises for this filter.
        </p>
      ) : null}
    </Card>
  );
}
