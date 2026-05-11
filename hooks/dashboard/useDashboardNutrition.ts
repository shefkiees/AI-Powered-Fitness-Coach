"use client";

import { useCallback } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { DashboardActionState, NutritionLogInput, PulseNutritionSummary } from "@/hooks/dashboard/types";
import { asNumber, dateKey } from "@/hooks/dashboard/useDashboardStats";

export function emptyNutrition(): PulseNutritionSummary {
  return {
    calories: 0,
    caloriesTarget: null,
    proteinG: 0,
    proteinTargetG: null,
    waterMl: 0,
    waterTargetMl: null,
  };
}

export function buildNutritionSummary(nutritionRow: Record<string, unknown> | null | undefined, waterRow: Record<string, unknown> | null | undefined): PulseNutritionSummary {
  return {
    calories: Number(nutritionRow?.consumed_calories) || 0,
    caloriesTarget: asNumber(nutritionRow?.target_calories),
    proteinG: Number(nutritionRow?.consumed_protein_g) || 0,
    proteinTargetG: asNumber(nutritionRow?.target_protein_g),
    waterMl: Number(waterRow?.amount_ml) || 0,
    waterTargetMl: asNumber(waterRow?.target_ml),
  };
}

export function useDashboardNutrition({
  userId,
  load,
  setAction,
}: {
  userId: string | undefined;
  load: () => Promise<void>;
  setAction: (patch: Partial<DashboardActionState>) => void;
}) {
  const logNutritionIntake = useCallback(
    async (input: NutritionLogInput) => {
      if (!supabase || !userId) return;
      const calories = input.calories != null ? Math.max(0, Math.round(Number(input.calories) || 0)) : 0;
      const proteinG = input.proteinG != null ? Math.max(0, Math.round(Number(input.proteinG) || 0)) : 0;
      const carbsG = input.carbsG != null ? Math.max(0, Math.round(Number(input.carbsG) || 0)) : 0;
      const fatG = input.fatG != null ? Math.max(0, Math.round(Number(input.fatG) || 0)) : 0;
      const notes = String(input.notes || "").trim();

      if (!calories && !proteinG && !carbsG && !fatG && !notes) {
        setAction({ error: "Add calories, protein, carbs, fat, or a short note before saving nutrition." });
        return;
      }

      setAction({ savingNutrition: true, error: null, notice: null });
      try {
        const today = dateKey(new Date());
        const existing = await supabase
          .from("nutrition_logs")
          .select("id, target_calories, target_protein_g, target_carbs_g, target_fat_g, consumed_calories, consumed_protein_g, consumed_carbs_g, consumed_fat_g, notes")
          .eq("user_id", userId)
          .eq("log_date", today)
          .maybeSingle();
        if (existing.error) throw existing.error;

        const existingRow = existing.data;
        const mergedNotes = notes ? [String(existingRow?.notes || "").trim(), notes].filter(Boolean).join(" | ") : String(existingRow?.notes || "");
        const payload = {
          user_id: userId,
          log_date: today,
          target_calories: Number(existingRow?.target_calories) || 2000,
          target_protein_g: Number(existingRow?.target_protein_g) || 120,
          target_carbs_g: Number(existingRow?.target_carbs_g) || 200,
          target_fat_g: Number(existingRow?.target_fat_g) || 60,
          consumed_calories: (Number(existingRow?.consumed_calories) || 0) + calories,
          consumed_protein_g: (Number(existingRow?.consumed_protein_g) || 0) + proteinG,
          consumed_carbs_g: (Number(existingRow?.consumed_carbs_g) || 0) + carbsG,
          consumed_fat_g: (Number(existingRow?.consumed_fat_g) || 0) + fatG,
          notes: mergedNotes,
        };

        if (existingRow?.id) {
          const update = await supabase.from("nutrition_logs").update(payload).eq("id", existingRow.id).eq("user_id", userId);
          if (update.error) throw update.error;
        } else {
          const insert = await supabase.from("nutrition_logs").insert(payload);
          if (insert.error) throw insert.error;
        }

        setAction({ notice: "Nutrition snapshot updated." });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save nutrition snapshot." });
      } finally {
        setAction({ savingNutrition: false });
      }
    },
    [load, setAction, userId],
  );

  const addWaterIntake = useCallback(
    async (amountMl: number) => {
      if (!supabase || !userId) return;
      const waterMl = Math.max(0, Math.round(Number(amountMl) || 0));
      if (!waterMl) {
        setAction({ error: "Water amount must be greater than 0 ml." });
        return;
      }

      setAction({ savingWater: true, error: null, notice: null });
      try {
        const today = dateKey(new Date());
        const existing = await supabase.from("water_logs").select("id, amount_ml, target_ml").eq("user_id", userId).eq("log_date", today).maybeSingle();
        if (existing.error) throw existing.error;

        const currentAmount = Number(existing.data?.amount_ml) || 0;
        const targetMl = Number(existing.data?.target_ml) || 2500;
        const payload = {
          user_id: userId,
          log_date: today,
          amount_ml: currentAmount + waterMl,
          target_ml: targetMl,
        };

        if (existing.data?.id) {
          const update = await supabase.from("water_logs").update(payload).eq("id", existing.data.id).eq("user_id", userId);
          if (update.error) throw update.error;
        } else {
          const insert = await supabase.from("water_logs").insert(payload);
          if (insert.error) throw insert.error;
        }

        setAction({ notice: `Added ${waterMl} ml water.` });
        await load();
      } catch (error) {
        setAction({ error: error instanceof Error ? error.message : "Could not save water intake." });
      } finally {
        setAction({ savingWater: false });
      }
    },
    [load, setAction, userId],
  );

  return { logNutritionIntake, addWaterIntake };
}
