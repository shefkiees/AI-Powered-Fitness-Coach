"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Heart,
  Home,
  Trees,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  COACH_ONBOARDING_STORAGE_KEY,
  type CoachOnboardingPayload,
  type FitnessGoalOption,
  type FitnessLevelOption,
  type WorkoutLocationOption,
  emptyCoachOnboarding,
} from "@/lib/coachOnboardingTypes";
import { cn } from "@/lib/cn";

const EQUIPMENT_OPTIONS = [
  "Bodyweight only",
  "Dumbbells",
  "Barbell",
  "Kettlebells",
  "Resistance bands",
  "Pull-up bar",
  "Bench",
  "Cable machine / gym access",
] as const;

const STEPS = [
  "Gender",
  "Age & body",
  "Goals",
  "Training load",
  "Equipment",
  "Health",
  "Location & food",
  "Targets",
  "Motivation",
] as const;

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-[var(--fc-accent)]/40 bg-[var(--fc-accent)]/15 text-[var(--fc-accent-strong)]"
          : "border-[var(--fc-border)] bg-black/20 text-[var(--fc-muted)] hover:border-white/20 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

export function CoachOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CoachOnboardingPayload>(() => emptyCoachOnboarding());

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finishToSignup = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(COACH_ONBOARDING_STORAGE_KEY, JSON.stringify(draft));
    }
    router.push("/signup?next=/dashboard");
  };

  const goLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(COACH_ONBOARDING_STORAGE_KEY, JSON.stringify(draft));
    }
    router.push("/login?next=/dashboard");
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return Boolean(draft.gender);
      case 1:
        return draft.age > 0 && draft.heightCm > 0 && draft.weightKg > 0;
      case 2:
        return Boolean(draft.fitnessGoal && draft.fitnessLevel);
      case 3:
        return draft.workoutDaysPerWeek > 0 && draft.workoutDurationMinutes > 0;
      case 4:
        return draft.equipment.length > 0;
      case 5:
        return true;
      case 6:
        return Boolean(draft.workoutLocation && draft.nutritionPreference);
      case 7:
        return true;
      case 8:
        return draft.mainMotivation.trim().length >= 3;
      default:
        return false;
    }
  };

  return (
    <div className="pulse-page min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--fc-muted)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-accent)]">
            Step {step + 1} / {STEPS.length}
          </p>
        </div>

        <div className="ref-glow-card rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <ProgressBar value={progress} label={STEPS[step]} showValue />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="mt-8"
            >
              {step === 0 ? (
                <div className="space-y-4">
                  <h1 className="text-2xl font-black tracking-tight">How should we refer to your physiology?</h1>
                  <p className="text-sm text-[var(--fc-muted)]">Used to tune volume, recovery, and language in your plan.</p>
                  <div className="flex flex-wrap gap-2">
                    {["female", "male", "non_binary", "prefer_not_say"].map((g) => (
                      <Chip
                        key={g}
                        active={draft.gender === g}
                        onClick={() => setDraft((d) => ({ ...d, gender: g }))}
                      >
                        {g.replace(/_/g, " ")}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-4">
                  <h1 className="text-2xl font-black tracking-tight">Age, height, and weight</h1>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid gap-1 text-sm font-semibold">
                      Age
                      <Input
                        type="number"
                        value={draft.age || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, age: Number(e.target.value) }))}
                        min={14}
                        max={90}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Height (cm)
                      <Input
                        type="number"
                        value={draft.heightCm || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, heightCm: Number(e.target.value) }))}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Weight (kg)
                      <Input
                        type="number"
                        value={draft.weightKg || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, weightKg: Number(e.target.value) }))}
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-black">Primary fitness goal</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ["lose_fat", "Lose fat"],
                          ["build_muscle", "Build muscle"],
                          ["improve_endurance", "Improve endurance"],
                          ["stay_healthy", "Stay healthy"],
                        ] as [FitnessGoalOption, string][]
                      ).map(([value, label]) => (
                        <Chip
                          key={value}
                          active={draft.fitnessGoal === value}
                          onClick={() => setDraft((d) => ({ ...d, fitnessGoal: value }))}
                        >
                          {label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Current fitness level</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ["beginner", "Beginner"],
                          ["intermediate", "Intermediate"],
                          ["advanced", "Advanced"],
                        ] as [FitnessLevelOption, string][]
                      ).map(([value, label]) => (
                        <Chip
                          key={value}
                          active={draft.fitnessLevel === value}
                          onClick={() => setDraft((d) => ({ ...d, fitnessLevel: value }))}
                        >
                          {label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4">
                  <h1 className="text-2xl font-black tracking-tight">Weekly rhythm</h1>
                  <label className="grid gap-1 text-sm font-semibold">
                    Workout days per week
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={draft.workoutDaysPerWeek}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, workoutDaysPerWeek: Number(e.target.value) }))
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Typical session length (minutes)
                    <Input
                      type="number"
                      min={15}
                      max={120}
                      value={draft.workoutDurationMinutes}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, workoutDurationMinutes: Number(e.target.value) }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-3">
                  <h1 className="text-2xl font-black tracking-tight">Available equipment</h1>
                  <p className="text-sm text-[var(--fc-muted)]">Select everything you can use most weeks.</p>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((eq) => {
                      const active = draft.equipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              equipment: active
                                ? d.equipment.filter((x) => x !== eq)
                                : [...d.equipment, eq],
                            }))
                          }
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:text-sm",
                            active
                              ? "border-[var(--fc-accent)]/40 bg-[var(--fc-accent)]/12 text-[var(--fc-accent-strong)]"
                              : "border-[var(--fc-border)] bg-black/20 text-[var(--fc-muted)]",
                          )}
                        >
                          {active ? <Check className="h-3.5 w-3.5" /> : <Dumbbell className="h-3.5 w-3.5 opacity-50" />}
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="grid gap-3">
                  <h1 className="text-2xl font-black tracking-tight">Injuries or limitations</h1>
                  <textarea
                    className="pulse-input min-h-[120px] resize-y rounded-2xl p-4 text-sm"
                    placeholder="e.g. mild knee irritation — avoid deep lunges"
                    value={draft.injuries}
                    onChange={(e) => setDraft((d) => ({ ...d, injuries: e.target.value }))}
                  />
                </div>
              ) : null}

              {step === 6 ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-black">Preferred workout location</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          ["home", "Home", Home],
                          ["gym", "Gym", Building2],
                          ["outdoor", "Outdoor", Trees],
                        ] as [WorkoutLocationOption, string, typeof Home][]
                      ).map(([value, label, Icon]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, workoutLocation: value }))}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition",
                            draft.workoutLocation === value
                              ? "border-[var(--fc-accent)]/35 bg-[var(--fc-accent)]/10"
                              : "border-[var(--fc-border)] bg-black/15 hover:border-white/15",
                          )}
                        >
                          <Icon className="h-5 w-5 text-[var(--fc-accent)]" />
                          <span className="text-sm font-bold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Nutrition preference</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Balanced", "Higher protein", "Low carb", "Plant-forward", "No preference"].map((n) => (
                        <Chip
                          key={n}
                          active={draft.nutritionPreference === n}
                          onClick={() => setDraft((d) => ({ ...d, nutritionPreference: n }))}
                        >
                          {n}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 7 ? (
                <div className="grid gap-3">
                  <h1 className="text-2xl font-black tracking-tight">Target weight (optional)</h1>
                  <p className="text-sm text-[var(--fc-muted)]">Leave blank if you are not targeting the scale.</p>
                  <Input
                    type="number"
                    placeholder="kg"
                    value={draft.targetWeightKg ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        targetWeightKg: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
              ) : null}

              {step === 8 ? (
                <div className="grid gap-3">
                  <h1 className="text-2xl font-black tracking-tight">Main motivation</h1>
                  <p className="text-sm text-[var(--fc-muted)]">We surface this on hard training days.</p>
                  <textarea
                    className="pulse-input min-h-[120px] resize-y rounded-2xl p-4 text-sm"
                    placeholder="e.g. I want more energy for my kids and confidence in my body."
                    value={draft.mainMotivation}
                    onChange={(e) => setDraft((d) => ({ ...d, mainMotivation: e.target.value }))}
                  />
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-col gap-3 border-t border-[var(--fc-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} disabled={!canAdvance()}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button type="button" variant="secondary" onClick={goLogin}>
                  Sign in instead
                </Button>
                <Button type="button" onClick={finishToSignup} disabled={!canAdvance()}>
                  Create account
                  <Heart className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--fc-muted)]">
          By continuing you agree that Pulse provides general fitness information, not medical advice.
        </p>
      </div>
    </div>
  );
}
