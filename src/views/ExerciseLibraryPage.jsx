"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import DataTable from "@/src/components/DataTable";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { getExerciseLibrary } from "@/src/utils/supabaseData";

function ExerciseLibraryContent() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const data = await getExerciseLibrary();
      setItems(data);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const muscles = useMemo(() => ["all", ...new Set(items.map((item) => item.muscle_group).filter(Boolean))], [items]);
  const difficulties = useMemo(() => ["all", ...new Set(items.map((item) => item.difficulty).filter(Boolean))], [items]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !normalized ||
        [item.name, item.muscle_group, item.equipment, item.instructions]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesMuscle = muscle === "all" || item.muscle_group === muscle;
      const matchesDifficulty = difficulty === "all" || item.difficulty === difficulty;
      return matchesQuery && matchesMuscle && matchesDifficulty;
    });
  }, [difficulty, items, muscle, query]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Exercise" },
      { key: "muscle_group", label: "Muscle Group" },
      { key: "difficulty", label: "Level" },
      { key: "equipment", label: "Equipment" },
      {
        key: "instructions",
        label: "Instructions",
        render: (row) => (
          <p className="max-w-[42ch] text-[var(--fc-muted)]">
            {row.instructions || "No instructions saved."}
          </p>
        ),
      },
    ],
    [],
  );

  return (
    <AppLayout title="Exercise Library" subtitle="Seeded exercises are readable for every authenticated user.">
      {state === "loading" ? <LoadingSpinner label="Loading exercise library..." /> : null}
      {state === "error" ? <EmptyState title="Could not load exercises" description={error} actionLabel="Retry" onAction={load} /> : null}
      {state === "ready" ? (
        <>
          <section className="pulse-card rounded-[1.5rem] p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fc-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pulse-input py-3 pl-11 pr-4"
                  placeholder="Search exercises"
                />
              </label>
              <select value={muscle} onChange={(event) => setMuscle(event.target.value)} className="pulse-input px-4 py-3">
                {muscles.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "All muscles" : item}
                  </option>
                ))}
              </select>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="pulse-input px-4 py-3">
                {difficulties.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "All levels" : item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="mt-5">
            {filtered.length === 0 ? (
              <EmptyState
                title="No exercises found"
                description="Try a different search or filter. If the table is empty, run supabase-schema.sql to seed the library."
              />
            ) : (
              <DataTable columns={columns} rows={filtered} emptyText="No exercises available." />
            )}
          </section>
        </>
      ) : null}
    </AppLayout>
  );
}

export default function ExerciseLibraryPage() {
  return (
    <ProtectedRoute>
      {() => <ExerciseLibraryContent />}
    </ProtectedRoute>
  );
}
