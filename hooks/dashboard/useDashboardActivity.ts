"use client";

import { useCallback } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { ActivityLogInput, DashboardActionState, PulseActivity, PulseDayVolume, PulseGoal } from "@/hooks/dashboard/types";
import { asNumber } from "@/hooks/dashboard/useDashboardStats";

export function addWorkoutVolume(days: PulseDayVolume[], rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const key = String(row.completed_at || "").slice(0, 10);
    const slot = days.find((day) => day.dateKey === key);
    if (!slot) continue;
    slot.count += 1;
    slot.calories += Number(row.calories_burned) || 0;
    slot.minutes += Number(row.duration_minutes) || 0;
  }
}

export function addActivityVolume(days: PulseDayVolume[], rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const key = String(row.logged_at || "").slice(0, 10);
    const slot = days.find((day) => day.dateKey === key);
    if (!slot) continue;
    slot.steps += Number(row.steps) || 0;
    slot.calories += Number(row.calories_burned) || 0;
  }
}

export function buildTimeline(input: {
  completed: Record<string, unknown>[];
  activity: Record<string, unknown>[];
  goals: PulseGoal[];
  planTitle: string | null;
  planCreatedAt?: string | null;
}): PulseActivity[] {
  const events: PulseActivity[] = [];

  input.completed.slice(0, 10).forEach((row) => {
    events.push({
      id: `workout-${row.id}`,
      type: "workout",
      title: String(row.workout_title || "Completed workout"),
      at: String(row.completed_at || new Date().toISOString()),
      meta: `${Number(row.duration_minutes) || 0} min - ${Number(row.calories_burned) || 0} kcal`,
    });
  });

  input.activity.slice(0, 8).forEach((row) => {
    const details = [
      Number(row.steps) ? `${Number(row.steps).toLocaleString()} steps` : "",
      asNumber(row.weight_kg) ? `${Number(row.weight_kg)} kg` : "",
      Number(row.calories_burned) ? `${Number(row.calories_burned)} kcal` : "",
    ].filter(Boolean);
    events.push({
      id: `activity-${row.id}`,
      type: "activity",
      title: details.length ? "Activity log" : "Progress note",
      at: String(row.logged_at || new Date().toISOString()),
      meta: details.join(" - ") || String(row.notes || "Saved progress"),
    });
  });

  input.goals.slice(0, 4).forEach((goal) => {
    events.push({
      id: `goal-${goal.id}`,
      type: "goal",
      title: goal.title,
      at: goal.deadline || new Date().toISOString(),
      meta: `${goal.pct}% complete`,
    });
  });

  if (input.planTitle && input.planCreatedAt) {
    events.push({
      id: "plan-active",
      type: "plan",
      title: input.planTitle,
      at: input.planCreatedAt,
      meta: "Active AI workout plan",
    });
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 10);
}

export function useDashboardActivity({
  userId,
  load,
  setAction,
}: {
  userId: string | undefined;
  load: () => Promise<void>;
  setAction: (patch: Partial<DashboardActionState>) => void;
}) {
  const logActivity = useCallback(
    async (input: ActivityLogInput) => {
      if (!supabase || !userId) return;
      setAction({ savingActivity: true, error: null, notice: null });
      try {
        const payload = {
          user_id: userId,
          steps: input.steps !== null && input.steps !== undefined ? Math.max(0, Math.round(input.steps)) : null,
          weight_kg: input.weightKg !== null && input.weightKg !== undefined ? input.weightKg : null,
          calories_burned:
            input.caloriesBurned !== null && input.caloriesBurned !== undefined
              ? Math.max(0, Math.round(input.caloriesBurned))
              : null,
          notes: input.notes?.trim() || "",
          logged_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("weight_logs").insert(payload);
        if (error) throw error;
        if (payload.weight_kg) {
          await supabase.from("profiles").update({ weight_kg: payload.weight_kg }).eq("id", userId);
        }
        setAction({ notice: "Activity saved." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save activity." });
      } finally {
        setAction({ savingActivity: false });
      }
    },
    [load, setAction, userId],
  );

  return { logActivity };
}
