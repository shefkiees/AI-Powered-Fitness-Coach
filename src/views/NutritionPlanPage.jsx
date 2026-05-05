"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Droplets, Flame, Plus, RefreshCw, Utensils } from "lucide-react";
import AppLayout from "@/src/components/AppLayout";
import EmptyState from "@/src/components/EmptyState";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import NutritionCard from "@/src/components/NutritionCard";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import {
  addMealLog,
  addWaterLog,
  createNutritionPlan,
  getLatestNutritionPlan,
} from "@/src/utils/supabaseData";

const emptyMeal = {
  title: "",
  meal_type: "meal",
  calories: "",
  protein_g: "",
  carbs_g: "",
  fat_g: "",
  description: "",
};

function pct(value, target) {
  const t = Number(target || 0);
  if (!t) return 0;
  return Math.min(100, Math.round((Number(value || 0) / t) * 100));
}

function MacroBar({ label, value, target, tone }) {
  const percent = pct(value, target);
  return (
    <div className="rounded-2xl border border-[var(--fc-border)] bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-[var(--fc-muted)]">
          {Math.round(Number(value || 0))} / {Math.round(Number(target || 0))}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function NutritionContent({ user, profile }) {
  const [plan, setPlan] = useState(null);
  const [mealForm, setMealForm] = useState(emptyMeal);
  const [water, setWater] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const data = await getLatestNutritionPlan(user.id);
      setPlan(data);
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

  const consumed = useMemo(
    () => ({
      calories: Number(plan?.consumed_calories || 0),
      protein: Number(plan?.consumed_protein_g || 0),
      carbs: Number(plan?.consumed_carbs_g || 0),
      fat: Number(plan?.consumed_fat_g || 0),
    }),
    [plan],
  );

  const regenerate = async () => {
    setBusy("plan");
    setError("");
    try {
      const data = await createNutritionPlan(user.id, profile);
      setPlan(data);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  };

  const submitMeal = async (event) => {
    event.preventDefault();
    if (!mealForm.title.trim()) {
      setError("Meal name is required.");
      return;
    }
    setBusy("meal");
    setError("");
    try {
      const data = await addMealLog(mealForm);
      setPlan(data);
      setMealForm(emptyMeal);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  };

  const addWater = async (amount) => {
    setBusy(`water:${amount}`);
    setError("");
    try {
      const row = await addWaterLog(amount);
      setWater(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  };

  const waterAmount = Number(water?.amount_ml || plan?.water_ml || 0);
  const waterTarget = Number(water?.target_ml || plan?.water_target_ml || 2500);

  return (
    <AppLayout
      title="Nutrition"
      subtitle="Daily targets, meal logging, and hydration tracking. Simple guidance only, not medical advice."
      actions={
        <button
          type="button"
          onClick={regenerate}
          disabled={busy === "plan"}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-accent)] px-4 py-2.5 text-sm font-black text-[var(--fc-accent-ink)] transition hover:bg-[var(--fc-accent-strong)] disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${busy === "plan" ? "animate-spin" : ""}`} />
          Recalculate targets
        </button>
      }
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {state === "loading" ? <LoadingSpinner label="Loading nutrition tracker..." /> : null}
      {state === "error" ? <EmptyState title="Could not load nutrition" description={error} actionLabel="Retry" onAction={load} /> : null}
      {state === "ready" && !plan ? (
        <EmptyState
          title="No nutrition target yet"
          description="Create today's calorie and macro target from your profile."
          actionLabel={busy === "plan" ? "Creating..." : "Create target"}
          onAction={regenerate}
        />
      ) : null}
      {state === "ready" && plan ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="pulse-card rounded-[1.4rem] p-5">
              <Flame className="h-5 w-5 text-[var(--fc-accent)]" />
              <p className="mt-3 text-3xl font-black text-white">{Math.round(consumed.calories)}</p>
              <p className="text-sm text-[var(--fc-muted)]">of {plan.calories} kcal consumed</p>
            </div>
            <MacroBar label="Protein" value={consumed.protein} target={plan.protein_g} tone="bg-emerald-300" />
            <MacroBar label="Carbs" value={consumed.carbs} target={plan.carbs_g} tone="bg-[var(--fc-accent)]" />
            <MacroBar label="Fat" value={consumed.fat} target={plan.fat_g} tone="bg-amber-300" />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <NutritionCard plan={plan} />

              <section className="pulse-card rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-cyan-200" />
                  <h2 className="text-lg font-black text-white">Water</h2>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black text-white">{waterAmount} ml</p>
                    <p className="text-sm text-[var(--fc-muted)]">target {waterTarget} ml</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[250, 500, 750].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        disabled={busy === `water:${amount}`}
                        onClick={() => addWater(amount)}
                        className="rounded-full border border-[var(--fc-border)] bg-white/[0.04] px-4 py-2 text-sm font-bold text-white"
                      >
                        +{amount} ml
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-cyan-200" style={{ width: `${pct(waterAmount, waterTarget)}%` }} />
                </div>
              </section>
            </div>

            <aside className="pulse-card rounded-[1.5rem] p-5">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-[var(--fc-accent)]" />
                <h2 className="text-lg font-black text-white">Log food</h2>
              </div>
              <form onSubmit={submitMeal} className="mt-5 grid gap-3">
                <input
                  value={mealForm.title}
                  onChange={(event) => setMealForm((current) => ({ ...current, title: event.target.value }))}
                  className="pulse-input px-4 py-3"
                  placeholder="Meal name"
                />
                <select
                  value={mealForm.meal_type}
                  onChange={(event) => setMealForm((current) => ({ ...current, meal_type: event.target.value }))}
                  className="pulse-input px-4 py-3"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="meal">Meal</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["calories", "Calories"],
                    ["protein_g", "Protein g"],
                    ["carbs_g", "Carbs g"],
                    ["fat_g", "Fat g"],
                  ].map(([key, label]) => (
                    <input
                      key={key}
                      value={mealForm[key]}
                      onChange={(event) => setMealForm((current) => ({ ...current, [key]: event.target.value }))}
                      className="pulse-input px-4 py-3"
                      type="number"
                      min="0"
                      placeholder={label}
                    />
                  ))}
                </div>
                <textarea
                  value={mealForm.description}
                  onChange={(event) => setMealForm((current) => ({ ...current, description: event.target.value }))}
                  className="pulse-input min-h-24 px-4 py-3"
                  placeholder="Notes or ingredients"
                />
                <button
                  type="submit"
                  disabled={busy === "meal"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-accent)] px-5 py-3 text-sm font-black text-[var(--fc-accent-ink)] disabled:opacity-70"
                >
                  <Plus className="h-4 w-4" />
                  {busy === "meal" ? "Saving..." : "Add meal"}
                </button>
              </form>
            </aside>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default function NutritionPlanPage() {
  return (
    <ProtectedRoute>
      {({ user, profile }) => <NutritionContent user={user} profile={profile} />}
    </ProtectedRoute>
  );
}
