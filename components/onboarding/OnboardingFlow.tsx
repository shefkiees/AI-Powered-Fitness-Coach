"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Cake,
  Dumbbell,
  HeartPulse,
  Mars,
  Ruler,
  Scale,
  Target,
  UserCircle,
  Venus,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  type FitnessProfileInput,
  saveFitnessProfile,
} from "@/lib/fitnessProfiles";
import {
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  ACTIVITY_OPTIONS,
  WORKOUT_PREFERENCE_OPTIONS,
} from "@/lib/profileOptions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";

const STEPS = 7;

const GENDER_ICONS: Record<string, LucideIcon> = {
  male: Mars,
  female: Venus,
  prefer_not_say: UserCircle,
};

const GOAL_ICONS: Record<string, LucideIcon> = {
  lose_weight: Activity,
  build_muscle: Dumbbell,
  stay_fit: HeartPulse,
};

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  low: Activity,
  moderate: HeartPulse,
  high: Target,
};

const WORKOUT_ICONS: Record<string, LucideIcon> = {
  abs: Target,
  chest: Dumbbell,
  legs: Activity,
  full_body: HeartPulse,
  fat_loss: Activity,
  strength: Dumbbell,
  cardio: HeartPulse,
};

type Draft = {
  gender: string | null;
  age: string;
  weight: string;
  height: string;
  goal: string | null;
  activity_level: string | null;
  workout_preference: string | null;
};

const emptyDraft = (): Draft => ({
  gender: null,
  age: "",
  weight: "",
  height: "",
  goal: null,
  activity_level: null,
  workout_preference: null,
});

const stepTitles = [
  "Gender",
  "Age",
  "Weight",
  "Height",
  "Fitness goal",
  "Activity level",
  "Workout focus",
];

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
  sub,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-start gap-3 rounded-[1.5rem] border p-5 text-left transition duration-200",
        selected
          ? "border-[var(--fc-accent)]/25 bg-[var(--fc-accent)]/10 shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
          : "border-white/8 bg-black/15 hover:border-white/14 hover:bg-white/[0.03]",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl border transition",
          selected
            ? "border-[var(--fc-accent)]/20 bg-[var(--fc-accent)] text-slate-950"
            : "border-white/8 bg-white/[0.04] text-slate-400 group-hover:text-slate-200",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <span className="text-base font-semibold text-white">{label}</span>
        {sub ? (
          <span className="mt-1 block text-sm leading-7 text-slate-400">
            {sub}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canNext = () => {
    switch (step) {
      case 0:
        return draft.gender != null;
      case 1: {
        const n = parseInt(draft.age, 10);
        return !Number.isNaN(n) && n >= 13 && n <= 100;
      }
      case 2: {
        const w = parseFloat(draft.weight);
        return !Number.isNaN(w) && w > 0 && w < 500;
      }
      case 3: {
        const h = parseFloat(draft.height);
        return !Number.isNaN(h) && h > 0 && h < 300;
      }
      case 4:
        return draft.goal != null;
      case 5:
        return draft.activity_level != null;
      case 6:
        return draft.workout_preference != null;
      default:
        return false;
    }
  };

  const submit = async () => {
    if (!user) return;
    setError("");
    const age = parseInt(draft.age, 10);
    const weight = parseFloat(draft.weight);
    const height = parseFloat(draft.height);
    const payload: FitnessProfileInput = {
      gender: draft.gender!,
      age,
      weight,
      height,
      goal: draft.goal!,
      activity_level: draft.activity_level!,
      workout_preference: draft.workout_preference!,
    };
    setSaving(true);
    const { error: err } = await saveFitnessProfile(user.id, payload);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  const next = () => {
    if (step < STEPS - 1) setStep((current) => current + 1);
    else void submit();
  };

  const back = () => setStep((current) => Math.max(0, current - 1));
  const pct = Math.round(((step + 1) / STEPS) * 100);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/8 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Profile setup
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {stepTitles[step]}
              </h2>
            </div>
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Step {step + 1} / {STEPS}
            </span>
          </div>

          <div className="mt-5">
            <ProgressBar value={pct} label="Completion" showValue />
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      How do you identify?
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      We use this to tailor tone and training context, not for
                      medical decisions.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {GENDER_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={draft.gender === opt.id}
                        onClick={() =>
                          setDraft((current) => ({ ...current, gender: opt.id }))
                        }
                        icon={GENDER_ICONS[opt.id] ?? UserCircle}
                        label={opt.label}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      What&apos;s your age?
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Enter your age in years. Valid range: 13 to 100.
                    </p>
                  </div>
                  <Input
                    label="Age"
                    type="number"
                    min={13}
                    max={100}
                    placeholder="e.g. 28"
                    value={draft.age}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, age: event.target.value }))
                    }
                    icon={Cake}
                  />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Current weight
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Use kilograms so we can keep training guidance consistent.
                    </p>
                  </div>
                  <Input
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    min={1}
                    placeholder="72.5"
                    value={draft.weight}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        weight: event.target.value,
                      }))
                    }
                    icon={Scale}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Height</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Use centimeters so your profile stays consistent across the app.
                    </p>
                  </div>
                  <Input
                    label="Height (cm)"
                    type="number"
                    step="0.5"
                    min={50}
                    placeholder="175"
                    value={draft.height}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        height: event.target.value,
                      }))
                    }
                    icon={Ruler}
                  />
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Main fitness goal
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Choose the result you want the app to prioritize first.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {GOAL_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={draft.goal === opt.id}
                        onClick={() =>
                          setDraft((current) => ({ ...current, goal: opt.id }))
                        }
                        icon={GOAL_ICONS[opt.id] ?? Target}
                        label={opt.label}
                        sub={opt.sub}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Activity level
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Outside structured workouts, how much do you usually move?
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={draft.activity_level === opt.id}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            activity_level: opt.id,
                          }))
                        }
                        icon={ACTIVITY_ICONS[opt.id] ?? Activity}
                        label={opt.label}
                        sub={opt.sub}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 6 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Workout focus
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      We&apos;ll bias your plan toward this area. You can change it later.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {WORKOUT_PREFERENCE_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={draft.workout_preference === opt.id}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            workout_preference: opt.id,
                          }))
                        }
                        icon={WORKOUT_ICONS[opt.id] ?? Dumbbell}
                        label={opt.label}
                        sub={opt.sub}
                        className="sm:min-h-[148px]"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>

      {error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </motion.div>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={step === 0 || saving}
          onClick={back}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!canNext() || saving}
          loading={saving}
          onClick={next}
        >
          {step === STEPS - 1 ? "Finish and open dashboard" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
