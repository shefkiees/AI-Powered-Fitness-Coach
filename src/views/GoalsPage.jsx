"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/src/components/AppLayout";
import DataTable from "@/src/components/DataTable";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { deleteGoal, getGoals, saveGoal, updateGoalStatus } from "@/src/utils/supabaseData";
import { toDateInputValue } from "@/src/utils/formatters";

const initialGoal = {
  title: "",
  description: "",
  target_value: "",
  current_value: "",
  unit: "kg",
  status: "active",
  deadline: "",
};

function GoalsContent({ user }) {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(initialGoal);
  const [editingId, setEditingId] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const data = await getGoals(user.id);
      setGoals(data);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }, [user.id]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.title.trim().length < 2) {
      setError("Goal title is required.");
      return;
    }
    setSaving(true);
    try {
      await saveGoal(user.id, form, editingId);
      setForm(initialGoal);
      setEditingId(null);
      const data = await getGoals(user.id);
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const editGoal = (goal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title || "",
      description: goal.description || "",
      target_value: goal.target_value ?? "",
      current_value: goal.current_value ?? "",
      unit: goal.unit || "",
      status: goal.status || "active",
      deadline: toDateInputValue(goal.deadline),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeGoal = async (goalId) => {
    const confirmed = window.confirm("Delete this goal? This cannot be undone.");
    if (!confirmed) return;

    setBusyId(goalId);
    setError("");
    try {
      await deleteGoal(user.id, goalId);
      setGoals((current) => current.filter((goal) => goal.id !== goalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId("");
    }
  };

  const toggleStatus = async (goal) => {
    setBusyId(goal.id);
    setError("");
    try {
      const nextStatus = goal.status === "completed" ? "active" : "completed";
      const updated = await updateGoalStatus(user.id, goal.id, nextStatus);
      setGoals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId("");
    }
  };

  const statusPill = (status) => (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${
        status === "completed"
          ? "bg-emerald-300/12 text-emerald-100"
          : "bg-[var(--fc-accent)]/12 text-[var(--fc-accent)]"
      }`}
    >
      {status}
    </span>
  );

  return (
    <AppLayout title="Goals" subtitle="Create, update, complete, or delete your fitness goals.">
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.74fr_1.26fr]">
        <form onSubmit={submit} className="pulse-card rounded-[1.5rem] p-5">
          <h2 className="text-lg font-black text-white">{editingId ? "Edit goal" : "Create goal"}</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["title", "Title", "text"],
              ["target_value", "Target value", "number"],
              ["current_value", "Current value", "number"],
              ["unit", "Unit", "text"],
              ["deadline", "Deadline", "date"],
            ].map(([key, label, type]) => (
              <label key={key} className="grid gap-2 text-sm font-semibold text-white">
                {label}
                <input
                  className="pulse-input px-4 py-3"
                  type={type}
                  step={type === "number" ? "0.1" : undefined}
                  value={form[key]}
                  onChange={(event) => setValue(key, event.target.value)}
                />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-semibold text-white">
              Status
              <select
                value={form.status}
                onChange={(event) => setValue("status", event.target.value)}
                className="pulse-input px-4 py-3"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-white">
              Description
              <textarea
                className="pulse-input min-h-24 px-4 py-3"
                value={form.description}
                onChange={(event) => setValue("description", event.target.value)}
              />
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-[var(--fc-accent)] px-5 py-3 text-sm font-black text-[var(--fc-accent-ink)] transition hover:bg-[var(--fc-accent-strong)] disabled:opacity-70"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create goal"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialGoal);
                }}
                className="rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <section>
          {state === "loading" ? <LoadingSpinner label="Loading goals..." /> : null}
          {state === "error" ? <EmptyState title="Could not load goals" description={error} actionLabel="Retry" onAction={load} /> : null}
          {state === "ready" && goals.length === 0 ? (
            <EmptyState title="No goals yet" description="Create your first goal and track it from the dashboard." />
          ) : null}
          {state === "ready" && goals.length > 0 ? (
            <DataTable
              columns={[
                { key: "title", label: "Goal" },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => statusPill(row.status || "active"),
                },
                {
                  key: "progress",
                  label: "Progress",
                  render: (row) =>
                    `${row.current_value ?? 0} / ${row.target_value ?? 0}${row.unit ? ` ${row.unit}` : ""}`,
                },
                {
                  key: "deadline",
                  label: "Deadline",
                  render: (row) => (row.deadline ? toDateInputValue(row.deadline) : "-"),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editGoal(row)}
                        className="rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => toggleStatus(row)}
                        className="rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                      >
                        {row.status === "completed" ? "Reopen" : "Complete"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => removeGoal(row.id)}
                        className="rounded-full border border-red-300/25 bg-red-300/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-300/20 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={goals}
              emptyText="No goals yet."
            />
          ) : null}
        </section>
      </div>
    </AppLayout>
  );
}

export default function GoalsPage() {
  return (
    <ProtectedRoute>
      {({ user }) => <GoalsContent user={user} />}
    </ProtectedRoute>
  );
}
