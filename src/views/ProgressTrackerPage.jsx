"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Dumbbell,
  Flame,
  Footprints,
  Scale,
  Target,
} from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import DataTable from "@/src/components/DataTable";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProgressChart from "@/src/components/ProgressChart";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import {
  addProgressLog,
  getGoals,
  getProgressLogs,
  getProgressSnapshots,
  getUpcomingWorkoutSessions,
  getUserCompletedWorkouts,
} from "@/src/utils/supabaseData";
import { formatNumber, toDateInputValue } from "@/src/utils/formatters";

const emptyForm = {
  weight_kg: "",
  calories: "",
  steps: "",
  note: "",
};

function displayText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    return String(value.title || value.name || value.label || value.message || fallback);
  }
  return String(value);
}

function validateCheckIn(values) {
  const errors = [];
  const weight = values.weight_kg === "" ? null : Number(values.weight_kg);
  const calories = values.calories === "" ? null : Number(values.calories);
  const steps = values.steps === "" ? null : Number(values.steps);

  if (weight === null && calories === null && steps === null) {
    errors.push("Add at least one real value: weight, calories, or steps.");
  }
  if (weight !== null && (!Number.isFinite(weight) || weight < 25 || weight > 400)) {
    errors.push("Weight must be between 25 kg and 400 kg.");
  }
  if (calories !== null && (!Number.isFinite(calories) || calories < 10 || calories > 5000)) {
    errors.push("Calories must be between 10 and 5000.");
  }
  if (steps !== null && (!Number.isFinite(steps) || steps < 100 || steps > 100000)) {
    errors.push("Steps must be between 100 and 100000.");
  }

  return errors;
}

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isThisWeek(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= startOfWeek();
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="rounded-[1.25rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#111827]">{value}</p>
          <p className="mt-1 text-sm text-[#6b7280]">{helper}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function ActivityFeed({ completedWorkouts, progressLogs, sessions }) {
  const items = useMemo(() => {
    const workoutItems = completedWorkouts.map((row) => ({
      id: `workout-${row.id}`,
      type: "Workout",
      icon: Dumbbell,
      title: row.workout_title || "Workout completed",
      detail: `${row.duration_minutes || 0} min - ${row.calories_burned || 0} kcal`,
      date: row.completed_at,
      tone: "bg-emerald-50 text-emerald-600",
    }));
    const progressItems = progressLogs.map((row) => ({
      id: `progress-${row.id}`,
      type: "Check-in",
      icon: Activity,
      title: displayText(row.note, "Progress check-in"),
      detail: [
        row.weight_kg ? `${row.weight_kg} kg` : "",
        row.steps ? `${row.steps} steps` : "",
        row.calories ? `${row.calories} kcal` : "",
      ]
        .filter(Boolean)
        .join(" - "),
      date: row.logged_at,
      tone: "bg-sky-50 text-sky-600",
    }));
    const sessionItems = sessions
      .filter((row) => row.scheduled_for)
      .map((row) => ({
      id: `session-${row.id}`,
      type: row.status || "Scheduled",
      icon: CalendarClock,
      title: displayText(row.title, "Workout session"),
      detail: `Scheduled ${new Date(row.scheduled_for).toLocaleString()}`,
      date: row.scheduled_for,
      tone: "bg-violet-50 text-violet-600",
    }));

    return [...workoutItems, ...progressItems, ...sessionItems]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [completedWorkouts, progressLogs, sessions]);

  return (
    <section className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-[#111827]">Activity Feed</h2>
        <span className="text-sm font-bold text-[#6b7280]">{items.length} items</span>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-[1.15rem] bg-[#f8fafc] p-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-[#111827]">{displayText(item.title)}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#6b7280]">
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6b7280]">{item.detail || "No detail recorded"}</p>
                <p className="mt-1 text-xs font-semibold text-[#9ca3af]">{new Date(item.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-4 text-sm leading-6 text-[#6b7280]">
            No real activity yet. Finish a workout or save a check-in to build your history.
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressContent({ user }) {
  const [logs, setLogs] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const [progressRows, snapshotRows, completedRows, sessionRows, goalRows] = await Promise.all([
        getProgressLogs(),
        getProgressSnapshots(),
        getUserCompletedWorkouts(),
        getUpcomingWorkoutSessions(),
        getGoals(),
      ]);
      setLogs(progressRows);
      setSnapshots(snapshotRows);
      setCompletedWorkouts(completedRows);
      setSessions(sessionRows);
      setGoals(goalRows);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("ready");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const validationErrors = validateCheckIn(form);
    if (validationErrors.length) {
      setError(validationErrors.join(" "));
      return;
    }

    setSaving(true);
    try {
      await addProgressLog(user.id, form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const weekWorkouts = completedWorkouts.filter((row) => isThisWeek(row.completed_at));
  const realWeightLogs = logs.filter((row) => Number(row.weight_kg) >= 25 && Number(row.weight_kg) <= 400);
  const weekProgressLogs = logs.filter((row) => isThisWeek(row.logged_at));
  const caloriesWeek = weekWorkouts.reduce((sum, row) => sum + (Number(row.calories_burned) || 0), 0);
  const stepsWeek = weekProgressLogs.reduce((sum, row) => sum + (Number(row.steps) || 0), 0);
  const latestWeight = [...realWeightLogs].reverse().find((row) => row.weight_kg)?.weight_kg || null;
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const snapshotRows = [...snapshots].reverse().slice(0, 7);
  const logRows = [...logs].reverse().slice(0, 8);

  return (
    <AppLayout title="Activity" subtitle="Real workout history, check-ins, goals, and scheduled sessions.">
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {state === "loading" ? <LoadingSpinner label="Loading activity..." /> : null}

      {state !== "loading" ? (
        <div className="grid gap-5">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={CheckCircle2} label="Workouts" value={weekWorkouts.length} helper="completed this week" />
            <StatCard icon={Flame} label="Burned" value={caloriesWeek} helper="kcal from completed workouts" />
            <StatCard icon={Footprints} label="Steps" value={stepsWeek} helper="from check-ins this week" />
            <StatCard icon={Scale} label="Weight" value={latestWeight ? `${latestWeight} kg` : "-"} helper="latest logged value" />
          </section>

          {state === "error" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Activity loaded partially. Some Supabase tables may need the latest migration.
            </div>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <form onSubmit={submit} className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7280]">Check-in</p>
                <h2 className="mt-2 text-xl font-black text-[#111827]">Log Progress</h2>
                <p className="mt-1 text-sm leading-6 text-[#6b7280]">Save only real numbers you want tracked in Activity.</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  ["weight_kg", "Weight (kg)", "0.1"],
                  ["calories", "Calories", "1"],
                  ["steps", "Steps", "1"],
                ].map(([key, label, step]) => (
                  <label key={key} className="grid gap-2 text-sm font-bold text-[#111827]">
                    {label}
                    <input
                      className="h-11 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 text-sm outline-none transition focus:border-[#22c55e] focus:ring-4 focus:ring-emerald-100"
                      type="number"
                      step={step}
                      min="0"
                      value={form[key]}
                      onChange={(event) => setValue(key, event.target.value)}
                    />
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-bold text-[#111827] sm:col-span-2 lg:col-span-1">
                  Note
                  <textarea
                    className="min-h-24 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#22c55e] focus:ring-4 focus:ring-emerald-100"
                    value={form.note}
                    onChange={(event) => setValue("note", event.target.value)}
                    placeholder="Energy, sleep, workout notes..."
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#1f2937] disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save progress"}
              </button>
            </form>

            <div className="grid gap-5">
              <section className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-[#111827]">Goals</h2>
                    <Target className="h-5 w-5 text-[#16a34a]" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {activeGoals.length ? (
                      activeGoals.slice(0, 3).map((goal) => {
                        const target = Number(goal.target_value) || 0;
                        const current = Number(goal.current_value) || 0;
                        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                        return (
                          <div key={goal.id} className="rounded-2xl bg-[#f8fafc] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-black text-[#111827]">{goal.title}</p>
                              <span className="text-sm font-black text-[#16a34a]">{pct}%</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-[#e5e7eb]">
                              <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-4 text-sm text-[#6b7280]">
                        No active goals yet.
                      </p>
                    )}
                  </div>
                </article>

                <article className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-[#111827]">Upcoming</h2>
                    <CalendarClock className="h-5 w-5 text-[#16a34a]" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {sessions.filter((session) => session.scheduled_for).length ? (
                      sessions.filter((session) => session.scheduled_for).slice(0, 3).map((session) => (
                        <div key={session.id} className="rounded-2xl bg-[#f8fafc] p-3">
                          <p className="font-black text-[#111827]">{displayText(session.title, "Workout session")}</p>
                          <p className="mt-1 text-sm text-[#6b7280]">
                            {new Date(session.scheduled_for).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-4 text-sm text-[#6b7280]">
                        No scheduled sessions.
                      </p>
                    )}
                  </div>
                </article>
              </section>

              <ActivityFeed completedWorkouts={completedWorkouts} progressLogs={logs} sessions={sessions} />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
              <h2 className="mb-2 text-xl font-black text-[#111827]">Weight Trend</h2>
              <p className="mb-4 text-sm text-[#6b7280]">Shows only valid weight check-ins between 25 kg and 400 kg.</p>
              <ProgressChart logs={realWeightLogs} />
            </div>
            <div className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
              <h2 className="mb-2 text-xl font-black text-[#111827]">Weekly Snapshots</h2>
              <p className="mb-4 text-sm text-[#6b7280]">Goal progress is the active goal completion percentage stored in Supabase snapshots.</p>
              <DataTable
                columns={[
                  { key: "snapshot_date", label: "Date", render: (row) => toDateInputValue(row.snapshot_date) },
                  { key: "workouts_completed", label: "Workouts" },
                  { key: "calories_burned", label: "Calories", render: (row) => `${row.calories_burned || 0} kcal` },
                  { key: "goal_progress_percent", label: "Goal progress", render: (row) => `${row.goal_progress_percent || 0}%` },
                ]}
                rows={snapshotRows}
                emptyText="No snapshots yet. Complete a workout or save a check-in."
              />
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
            <h2 className="mb-4 text-xl font-black text-[#111827]">Check-in History</h2>
            <DataTable
              columns={[
                { key: "logged_at", label: "Date", render: (row) => toDateInputValue(row.logged_at) },
                { key: "weight_kg", label: "Weight", render: (row) => formatNumber(row.weight_kg, " kg") },
                { key: "calories", label: "Calories", render: (row) => formatNumber(row.calories) },
                { key: "steps", label: "Steps", render: (row) => formatNumber(row.steps) },
                { key: "note", label: "Note", render: (row) => <p className="max-w-[40ch] text-[#6b7280]">{displayText(row.note)}</p> },
              ]}
              rows={logRows}
              emptyText="No check-ins yet."
            />
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default function ProgressTrackerPage() {
  return (
    <ProtectedRoute>
      {({ user }) => <ProgressContent user={user} />}
    </ProtectedRoute>
  );
}
