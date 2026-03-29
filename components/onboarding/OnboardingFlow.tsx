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
        "group flex w-full flex-col items-start gap-3 rounded-2xl border p-5 text-left transition duration-200",
        "hover:-translate-y-0.5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-900/20",
        selected
          ? "border-teal-400/70 bg-gradient-to-br from-teal-500/20 to-emerald-600/10 ring-2 ring-teal-400/40"
          : "border-slate-600/80 bg-slate-950/50",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition",
          selected
            ? "bg-teal-500/30 text-teal-200"
            : "bg-slate-800/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-teal-300",
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div>
        <span className="text-base font-semibold text-white">{label}</span>
        {sub ? (
          <span className="mt-1 block text-sm leading-snug text-slate-400">
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
    if (step < STEPS - 1) setStep((s) => s + 1);
    else void submit();
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const pct = Math.round(((step + 1) / STEPS) * 100);

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-300">
            Step {step + 1} of {STEPS}
          </span>
          <span className="text-teal-400/90">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 shadow-sm shadow-teal-500/40"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          {stepTitles[step]}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border-slate-700/60 bg-slate-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-8">
            {step === 0 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">How do you identify?</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    We use this to tailor tone and expectations—not for medical
                    decisions.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                  {GENDER_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      selected={draft.gender === opt.id}
                      onClick={() =>
                        setDraft((d) => ({ ...d, gender: opt.id }))
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
                  <h2 className="text-2xl font-bold text-white">What&apos;s your age?</h2>
                  <p className="mt-2 text-sm text-slate-400">Years (13–100)</p>
                </div>
                <Input
                  label="Age"
                  type="number"
                  min={13}
                  max={100}
                  placeholder="e.g. 28"
                  value={draft.age}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, age: e.target.value }))
                  }
                  icon={Cake}
                  className="border-slate-600/80 bg-slate-950/60"
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Current weight</h2>
                  <p className="mt-2 text-sm text-slate-400">Kilograms (kg)</p>
                </div>
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  min={1}
                  placeholder="72.5"
                  value={draft.weight}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, weight: e.target.value }))
                  }
                  icon={Scale}
                  className="border-slate-600/80 bg-slate-950/60"
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Height</h2>
                  <p className="mt-2 text-sm text-slate-400">Centimeters (cm)</p>
                </div>
                <Input
                  label="Height (cm)"
                  type="number"
                  step="0.5"
                  min={50}
                  placeholder="175"
                  value={draft.height}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, height: e.target.value }))
                  }
                  icon={Ruler}
                  className="border-slate-600/80 bg-slate-950/60"
                />
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Main fitness goal</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    What matters most right now?
                  </p>
                </div>
                <div className="grid gap-3">
                  {GOAL_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      selected={draft.goal === opt.id}
                      onClick={() => setDraft((d) => ({ ...d, goal: opt.id }))}
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
                  <h2 className="text-2xl font-bold text-white">Activity level</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Outside of structured workouts—how much do you move day to
                    day?
                  </p>
                </div>
                <div className="grid gap-3">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      selected={draft.activity_level === opt.id}
                      onClick={() =>
                        setDraft((d) => ({ ...d, activity_level: opt.id }))
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
                  <h2 className="text-2xl font-bold text-white">
                    Workout focus
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    We&apos;ll bias your generated plan toward this area (you can
                    change it later in profile).
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {WORKOUT_PREFERENCE_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      selected={draft.workout_preference === opt.id}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          workout_preference: opt.id,
                        }))
                      }
                      icon={WORKOUT_ICONS[opt.id] ?? Dumbbell}
                      label={opt.label}
                      sub={opt.sub}
                      className="sm:min-h-[140px]"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </motion.div>
      </AnimatePresence>

      {error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </motion.div>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border-slate-600/80 bg-slate-900/80"
          disabled={step === 0 || saving}
          onClick={back}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1 py-3.5 shadow-lg shadow-teal-900/25"
          disabled={!canNext() || saving}
          loading={saving}
          onClick={next}
        >
          {step === STEPS - 1 ? "Finish & go to dashboard" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
