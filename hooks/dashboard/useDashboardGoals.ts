"use client";

import { useCallback } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { CreateGoalInput, DashboardActionState, PulseGoal } from "@/hooks/dashboard/types";
import { asNumber } from "@/hooks/dashboard/useDashboardStats";

export function mapGoals(rows: Record<string, unknown>[]): PulseGoal[] {
  return rows.map((goal) => {
    const target = asNumber(goal.target_value);
    const current = Number(goal.current_value) || 0;
    const pct = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      id: String(goal.id),
      title: String(goal.title || "Goal"),
      description: String(goal.description || ""),
      pct,
      target,
      current,
      unit: goal.unit != null ? String(goal.unit) : null,
      status: String(goal.status || "active"),
      deadline: goal.deadline != null ? String(goal.deadline) : null,
    };
  });
}

export function useDashboardGoals({
  userId,
  load,
  setAction,
}: {
  userId: string | undefined;
  load: () => Promise<void>;
  setAction: (patch: Partial<DashboardActionState>) => void;
}) {
  const createGoal = useCallback(
    async (input: CreateGoalInput) => {
      if (!supabase || !userId) return;
      setAction({ savingGoal: true, error: null, notice: null });
      try {
        const { error } = await supabase.from("goals").insert({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || "",
          target_value: input.targetValue || null,
          current_value: 0,
          unit: input.unit?.trim() || null,
          status: "active",
        });
        if (error) throw error;
        setAction({ notice: "Goal created." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not create goal." });
      } finally {
        setAction({ savingGoal: false });
      }
    },
    [load, setAction, userId],
  );

  const updateGoalProgress = useCallback(
    async (goalId: string, currentValue: number, status = "active") => {
      if (!supabase || !userId) return;
      setAction({ updatingGoalId: goalId, error: null, notice: null });
      try {
        const { error } = await supabase.from("goals").update({ current_value: Math.max(0, currentValue), status }).eq("id", goalId).eq("user_id", userId);
        if (error) throw error;
        setAction({ notice: "Goal updated." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not update goal." });
      } finally {
        setAction({ updatingGoalId: null });
      }
    },
    [load, setAction, userId],
  );

  return { createGoal, updateGoalProgress };
}
