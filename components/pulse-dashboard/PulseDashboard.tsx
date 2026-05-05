"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  Apple,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Loader2,
  MessageCircle,
  Plus,
  Scale,
  Sparkles,
  SkipForward,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  usePulseDashboard,
  type PulseActivity,
  type PulseInsight,
  type PulseScheduleDay,
} from "@/hooks/usePulseDashboard";

const fieldClass =
  "min-h-10 w-full rounded-xl border border-[#dce4de] bg-white px-3 text-sm font-semibold text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const workoutDayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function firstName(name: string | undefined, email: string | undefined) {
  return name?.split(" ")?.[0] || email?.split("@")?.[0] || "Athlete";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value || 0);
}

function formatWeight(value: number | null) {
  if (value === null) return "Not logged";
  return `${Number(value).toFixed(1).replace(/\.0$/, "")} kg`;
}

function formatWeightDelta(value: number | null) {
  if (value === null) return "No trend";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(1).replace(/\.0$/, "")} kg`;
}

function formatMl(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")} L`;
  return `${formatNumber(value)} ml`;
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const activityIconMap: Record<PulseActivity["type"], LucideIcon> = {
  goal: Target,
  plan: Sparkles,
  workout: Dumbbell,
  activity: Plus,
};

function insightToneClass(tone: PulseInsight["tone"]) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

function scheduleLabel(status: string) {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Done";
  if (status === "skipped") return "Skipped";
  if (status === "preferred") return "Workout day";
  if (status === "scheduled") return "Scheduled";
  return "Rest";
}

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_8px_22px_rgba(17,24,39,0.05)] ring-1 ring-black/[0.015] ${className}`}>
      {children}
    </article>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#6b7280]">{eyebrow}</p>
        ) : null}
        <h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-[#111827]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function EmptyPanel({
  title,
  body,
  icon: Icon = Sparkles,
}: {
  title: string;
  body: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cdd8d0] bg-[linear-gradient(135deg,#f8fafc_0%,#f0fdf4_100%)] p-4 text-sm leading-6 text-[#5f6b63]">
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-black text-[#111827]">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="rounded-[1.15rem] border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.045)]">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ecfdf3] text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#6b7280]">
          {label}
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#111827]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#6b7280]">{helper}</p>
    </article>
  );
}

function ScheduleRow({
  day,
  skipping,
  onSkip,
}: {
  day: PulseScheduleDay;
  skipping: boolean;
  onSkip: (sessionId: string) => void;
}) {
  const canStart = Boolean(day.href && day.status !== "completed" && day.status !== "skipped");
  const canSkip = Boolean(day.sessionId && (day.status === "scheduled" || day.status === "in_progress"));

  return (
    <li className={`flex items-center gap-3 border-b border-[#eef2f0] py-2.5 last:border-b-0 ${day.isToday ? "text-[#111827]" : "text-[#6b7280]"}`}>
      <div className="w-12 shrink-0">
        <p className="text-xs font-black uppercase tracking-[0.14em]">{day.label}</p>
        {day.isToday ? <p className="mt-0.5 text-[0.62rem] font-black text-[#16a34a]">Today</p> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${day.title ? "font-black text-[#111827]" : "font-semibold text-[#9ca3af]"}`}>
          {day.title || "Rest"}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#9ca3af]">
          {day.status === "rest"
            ? "Open day"
            : day.status === "preferred"
              ? "Ready for a generated plan"
              : `${scheduleLabel(day.status)}${day.minutes ? ` - ${day.minutes} min` : ""}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {canStart ? (
          <Link
            href={day.href || "/workout-plan"}
            className="inline-flex min-h-8 items-center justify-center rounded-full bg-[#111827] px-3 text-xs font-black text-white transition hover:bg-black"
          >
            Start
          </Link>
        ) : null}
        {canSkip ? (
          <button
            type="button"
            disabled={skipping}
            onClick={() => day.sessionId && onSkip(day.sessionId)}
            className="inline-flex min-h-8 items-center justify-center gap-1 rounded-full border border-[#e5e7eb] bg-white px-2.5 text-xs font-black text-[#6b7280] transition hover:bg-[#f8fafc] disabled:opacity-60"
          >
            {skipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SkipForward className="h-3.5 w-3.5" />}
            Skip
          </button>
        ) : null}
      </div>
    </li>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#6b7280]">{children}</label>;
}

function GoalRow({
  title,
  pct,
  current,
  target,
  unit,
  value,
  busy,
  onChange,
  onSave,
}: {
  title: string;
  pct: number;
  current: number;
  target: number | null;
  unit: string | null;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <li className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#111827]">{title}</p>
          <p className="mt-1 text-xs font-semibold text-[#6b7280]">
            {current}
            {unit ? ` ${unit}` : ""} / {target ?? "--"}
            {unit ? ` ${unit}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[0.65rem] font-black text-[#111827] ring-1 ring-[#e5e7eb]">
          {pct}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="number"
          min="0"
          step="0.1"
          className={fieldClass}
          placeholder="Update progress"
        />
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-[#111827] px-3 text-xs font-black text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>
    </li>
  );
}

function ActivityRow({ item }: { item: PulseActivity }) {
  const Icon = activityIconMap[item.type] || Plus;
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#16a34a] ring-1 ring-[#e5e7eb]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-[#111827]">{item.title}</span>
        <span className="mt-1 block text-xs font-semibold text-[#6b7280]">{item.meta}</span>
        <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
          {formatActivityTime(item.at)}
        </span>
      </span>
    </li>
  );
}

export function PulseDashboard() {
  const { user } = useAuth();
  const d = usePulseDashboard(user?.id);
  const [workoutForm, setWorkoutForm] = useState({ title: "", duration: "30", calories: "180", rating: "4" });
  const [activityForm, setActivityForm] = useState({ steps: "", weight: "", calories: "", notes: "" });
  const [nutritionForm, setNutritionForm] = useState({ calories: "", protein: "", water: "250" });
  const [goalForm, setGoalForm] = useState({ title: "", target: "", unit: "" });
  const [goalProgressDraft, setGoalProgressDraft] = useState<Record<string, string>>({});
  const [logOpen, setLogOpen] = useState(false);
  const [logMode, setLogMode] = useState<"workout" | "activity">("activity");
  const [formErrors, setFormErrors] = useState<{ workout?: string; activity?: string; goal?: string; goalProgress?: string; nutrition?: string; water?: string }>({});
  const [selectedWorkoutDays, setSelectedWorkoutDays] = useState<string[] | null>(null);

  const displayName = firstName(d.profile?.name, user?.email);
  const coachInsight = d.coachBullets[0] || d.coachHeadline || "Log one activity today so your coach can tune the next step.";
  const hasWorkoutDays = d.weekSchedule.some((day) => day.status !== "rest");
  const draftWorkoutDays = selectedWorkoutDays ?? d.profile?.preferredWorkoutDays ?? [];

  const toggleWorkoutDay = (day: string) => {
    setSelectedWorkoutDays((current) => {
      const base = current ?? d.profile?.preferredWorkoutDays ?? [];
      return base.includes(day) ? base.filter((item) => item !== day) : [...base, day];
    });
  };

  const saveWorkoutDays = async () => {
    await d.updateWorkoutDays(draftWorkoutDays);
    setSelectedWorkoutDays(null);
  };

  const submitWorkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const duration = Number(workoutForm.duration);
    const calories = Number(workoutForm.calories);
    const rating = workoutForm.rating ? Number(workoutForm.rating) : null;

    if (!Number.isFinite(duration) || duration < 1) {
      setFormErrors((current) => ({ ...current, workout: "Duration must be at least 1 minute." }));
      return;
    }
    if (!Number.isFinite(calories) || calories < 0) {
      setFormErrors((current) => ({ ...current, workout: "Calories must be 0 or higher." }));
      return;
    }
    if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
      setFormErrors((current) => ({ ...current, workout: "Rating must be between 1 and 5." }));
      return;
    }

    setFormErrors((current) => ({ ...current, workout: undefined }));
    await d.logWorkout({
      title: workoutForm.title || "Workout",
      durationMinutes: duration,
      caloriesBurned: calories,
      rating,
    });
    setWorkoutForm({ title: "", duration: "30", calories: "180", rating: "4" });
  };

  const submitActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const steps = activityForm.steps ? Number(activityForm.steps) : null;
    const weight = activityForm.weight ? Number(activityForm.weight) : null;
    const calories = activityForm.calories ? Number(activityForm.calories) : null;
    const hasActivity = steps !== null || weight !== null || calories !== null || Boolean(activityForm.notes.trim());

    if (!hasActivity) {
      setFormErrors((current) => ({
        ...current,
        activity: "Add steps, weight, calories, or a note before saving activity.",
      }));
      return;
    }
    if (steps !== null && (!Number.isFinite(steps) || steps < 0)) {
      setFormErrors((current) => ({ ...current, activity: "Steps must be 0 or higher." }));
      return;
    }
    if (weight !== null && (!Number.isFinite(weight) || weight < 25 || weight > 400)) {
      setFormErrors((current) => ({ ...current, activity: "Weight must be between 25 kg and 400 kg." }));
      return;
    }
    if (calories !== null && (!Number.isFinite(calories) || calories < 0)) {
      setFormErrors((current) => ({ ...current, activity: "Calories must be 0 or higher." }));
      return;
    }

    setFormErrors((current) => ({ ...current, activity: undefined }));
    await d.logActivity({
      steps,
      weightKg: weight,
      caloriesBurned: calories,
      notes: activityForm.notes,
    });
    setActivityForm({ steps: "", weight: "", calories: "", notes: "" });
  };

  const submitNutrition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const calories = nutritionForm.calories ? Number(nutritionForm.calories) : null;
    const protein = nutritionForm.protein ? Number(nutritionForm.protein) : null;

    if (calories !== null && (!Number.isFinite(calories) || calories < 0)) {
      setFormErrors((current) => ({ ...current, nutrition: "Calories must be 0 or higher." }));
      return;
    }
    if (protein !== null && (!Number.isFinite(protein) || protein < 0)) {
      setFormErrors((current) => ({ ...current, nutrition: "Protein must be 0 or higher." }));
      return;
    }
    if (calories === null && protein === null) {
      setFormErrors((current) => ({ ...current, nutrition: "Add calories or protein before saving." }));
      return;
    }

    setFormErrors((current) => ({ ...current, nutrition: undefined }));
    await d.logNutritionIntake({
      calories,
      proteinG: protein,
    });
    setNutritionForm((current) => ({ ...current, calories: "", protein: "" }));
  };

  const addWaterQuick = async (preset?: number) => {
    const water = preset ?? Number(nutritionForm.water);
    if (!Number.isFinite(water) || water <= 0) {
      setFormErrors((current) => ({ ...current, water: "Water amount must be greater than 0 ml." }));
      return;
    }
    setFormErrors((current) => ({ ...current, water: undefined }));
    await d.addWaterIntake(water);
  };

  const submitGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetValue = goalForm.target ? Number(goalForm.target) : null;

    if (goalForm.title.trim().length < 2) {
      setFormErrors((current) => ({ ...current, goal: "Goal title must be at least 2 characters." }));
      return;
    }
    if (targetValue !== null && (!Number.isFinite(targetValue) || targetValue <= 0)) {
      setFormErrors((current) => ({ ...current, goal: "Target must be a positive number or empty." }));
      return;
    }

    setFormErrors((current) => ({ ...current, goal: undefined }));
    await d.createGoal({
      title: goalForm.title.trim(),
      targetValue,
      unit: goalForm.unit.trim() || null,
    });
    setGoalForm({ title: "", target: "", unit: "" });
  };

  const saveGoalProgress = async (goalId: string, fallbackCurrent: number, target: number | null) => {
    const draft = goalProgressDraft[goalId];
    const nextValue = draft === undefined || draft === "" ? fallbackCurrent : Number(draft);
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      setFormErrors((current) => ({ ...current, goalProgress: "Goal progress must be 0 or higher." }));
      return;
    }

    setFormErrors((current) => ({ ...current, goalProgress: undefined }));
    const status = target !== null && target > 0 && nextValue >= target ? "completed" : "active";
    await d.updateGoalProgress(goalId, nextValue, status);
    setGoalProgressDraft((current) => {
      const next = { ...current };
      delete next[goalId];
      return next;
    });
  };

  if (d.loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.35rem] bg-[#ececf1]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-3 text-[#171717]">
      <section className="overflow-hidden rounded-[1.45rem] border border-[#dce7df] bg-[#06120b] p-5 text-white shadow-[0_24px_70px_rgba(5,18,11,0.16)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200/75">Next workout</p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black tracking-[-0.055em] sm:text-5xl">
              {d.nextWorkoutTitle || `No workout scheduled yet, ${displayName}`}
            </h2>
            <p className="mt-3 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold leading-6 text-emerald-50">
              {coachInsight}
            </p>
          </div>

          {d.nextWorkoutHref ? (
            <Link
              href={d.nextWorkoutHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-black text-emerald-950 transition hover:bg-emerald-300"
            >
              Start workout
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLogMode("activity");
                setLogOpen(true);
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-black text-emerald-950 transition hover:bg-emerald-300"
            >
              <Plus className="h-4 w-4" />
              Log activity
            </button>
          )}
        </div>
      </section>

      {d.actions.notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {d.actions.notice}
        </div>
      ) : null}
      {d.actions.error || d.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {d.actions.error || `Dashboard data warning: ${d.error}`}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Flame}
          label="Streak"
          value={`${d.streakDays} day${d.streakDays === 1 ? "" : "s"}`}
          helper={d.streakDays ? "current rhythm" : "start with one workout"}
        />
        <StatTile
          icon={Dumbbell}
          label="Workouts"
          value={`${d.workoutsWeek}/${d.profile?.workoutDaysPerWeek ?? 3}`}
          helper={`${d.workoutTargetPct}% of weekly target`}
        />
        <StatTile
          icon={Scale}
          label="Weight"
          value={formatWeight(d.latestWeightKg)}
          helper={`Trend: ${formatWeightDelta(d.weightDeltaKg)}`}
        />
        <StatTile
          icon={Target}
          label="Goals"
          value={`${d.goalProgressPct}%`}
          helper="average active goal progress"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
        <div className="grid min-w-0 gap-5">
          <ShellCard className="p-5 sm:p-6">
            <SectionTitle
              eyebrow="This week"
              title="Schedule"
              action={<CalendarDays className="h-5 w-5 text-[#6b7280]" />}
            />
            {hasWorkoutDays ? (
              <ul className="mt-3">
                {d.weekSchedule.map((day) => (
                  <ScheduleRow
                    key={day.dateKey}
                    day={day}
                    skipping={d.actions.skippingSessionId === day.sessionId}
                    onSkip={(sessionId) => void d.skipSession(sessionId)}
                  />
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4">
                <p className="text-sm font-black text-[#111827]">Which days do you want to train?</p>
                <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                  Pick the days once, then generate a plan. The schedule will stop showing every day as rest.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {workoutDayOptions.map((day) => {
                    const active = draftWorkoutDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkoutDay(day)}
                        className={`rounded-full px-3 py-2 text-xs font-black transition ${
                          active
                            ? "bg-[#111827] text-white"
                            : "bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] hover:text-[#111827]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={d.actions.savingWorkoutDays || draftWorkoutDays.length === 0}
                    onClick={() => void saveWorkoutDays()}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-black text-white disabled:opacity-60"
                  >
                    {d.actions.savingWorkoutDays ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save days
                  </button>
                  <button
                    type="button"
                    onClick={d.generateAiPlan}
                    disabled={d.actions.generatingPlan}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#d1d5db] bg-white px-4 text-sm font-black text-[#111827] disabled:opacity-60"
                  >
                    {d.actions.generatingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate plan
                  </button>
                </div>
              </div>
            )}
          </ShellCard>

          <div className="grid gap-5 lg:grid-cols-2">
          <ShellCard className="p-5 sm:p-6">
            <SectionTitle
              eyebrow="Recommended"
              title="1-2 good options"
              action={<Link href="/workout-plan" className="text-sm font-black text-[#16a34a]">See all</Link>}
            />
            <div className="mt-4 grid gap-3">
              {d.recommendedWorkouts.length ? (
                d.recommendedWorkouts.slice(0, 2).map((workout) => (
                  <Link
                    key={workout.id}
                    href={`/workout/session?workout=${workout.workoutId}`}
                    className="flex items-center gap-3 rounded-2xl bg-[#f8fafc] p-3 transition hover:bg-[#f0fdf4]"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#16a34a] shadow-sm">
                      <Dumbbell className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#111827]">{workout.title}</span>
                      <span className="block truncate text-xs font-semibold text-[#6b7280]">
                        {workout.minutes ? `${workout.minutes} min` : "No duration"} - {workout.reason}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyPanel icon={Sparkles} title="No recommendations yet" body="Generate a plan or log a workout to unlock better suggestions." />
              )}
            </div>
          </ShellCard>

          <ShellCard className="p-5 sm:p-6">
            <SectionTitle
              eyebrow="Coach"
              title="Insights"
              action={<MessageCircle className="h-5 w-5 text-[#6b7280]" />}
            />
            <div className="mt-4 grid gap-3">
              {d.insights.length ? (
                d.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`rounded-2xl border px-3 py-3 text-sm ${insightToneClass(insight.tone)}`}
                  >
                    <p className="font-black">{insight.title}</p>
                    <p className="mt-1 font-semibold opacity-90">{insight.body}</p>
                    {insight.href && insight.actionLabel ? (
                      <Link
                        href={insight.href}
                        className="mt-2 inline-flex min-h-8 items-center justify-center rounded-full bg-white px-3 text-xs font-black text-[#111827] ring-1 ring-black/10"
                      >
                        {insight.actionLabel}
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyPanel
                  icon={MessageCircle}
                  title="Insights will appear here"
                  body="As soon as workouts and activity are logged, your coach notes become more specific."
                />
              )}
            </div>
          </ShellCard>
          </div>

          <ShellCard className="p-5 sm:p-6">
            <SectionTitle
              eyebrow="Feed"
              title="Recent activity"
              action={<Link href="/progress-tracker" className="text-sm font-black text-[#16a34a]">Progress</Link>}
            />
            <div className="mt-4 grid gap-2">
              {d.recentActivity.length ? (
                d.recentActivity.map((item) => <ActivityRow key={item.id} item={item} />)
              ) : (
                <EmptyPanel
                  icon={Plus}
                  title="No activity logged yet"
                  body="Use Quick log to add your first workout or activity entry. It will show up here instantly."
                />
              )}
            </div>
          </ShellCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5 xl:sticky xl:top-5">
          <ShellCard className="p-5 sm:p-6">
            <SectionTitle eyebrow="Goals" title="Progress targets" action={<Target className="h-5 w-5 text-[#16a34a]" />} />
            <form onSubmit={submitGoal} className="mt-4 grid gap-2 rounded-2xl bg-[#f8fafc] p-3">
              <FieldLabel>
                New goal
                <input
                  value={goalForm.title}
                  onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: 3 workouts this week"
                  className={fieldClass}
                />
              </FieldLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <FieldLabel>
                  Target
                  <input
                    value={goalForm.target}
                    onChange={(event) => setGoalForm((current) => ({ ...current, target: event.target.value }))}
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="3"
                    className={fieldClass}
                  />
                </FieldLabel>
                <FieldLabel>
                  Unit
                  <input
                    value={goalForm.unit}
                    onChange={(event) => setGoalForm((current) => ({ ...current, unit: event.target.value }))}
                    placeholder="workouts, kg..."
                    className={fieldClass}
                  />
                </FieldLabel>
              </div>
              {formErrors.goal ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  {formErrors.goal}
                </p>
              ) : null}
              <button type="submit" disabled={d.actions.savingGoal} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-white disabled:opacity-60">
                {d.actions.savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add goal
              </button>
            </form>

            <div className="mt-4 grid gap-2">
              {d.goals.length ? (
                <ul className="grid gap-2">
                  {d.goals.map((goal) => (
                    <GoalRow
                      key={goal.id}
                      title={goal.title}
                      pct={goal.pct}
                      current={goal.current}
                      target={goal.target}
                      unit={goal.unit}
                      value={goalProgressDraft[goal.id] ?? String(goal.current)}
                      busy={d.actions.updatingGoalId === goal.id}
                      onChange={(value) =>
                        setGoalProgressDraft((current) => ({
                          ...current,
                          [goal.id]: value,
                        }))
                      }
                      onSave={() => void saveGoalProgress(goal.id, goal.current, goal.target)}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyPanel
                  icon={Target}
                  title="No goals yet"
                  body="Add one measurable goal above and track it from this dashboard."
                />
              )}
            </div>
            {formErrors.goalProgress ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                {formErrors.goalProgress}
              </p>
            ) : null}
          </ShellCard>

          <ShellCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle eyebrow="Track" title="Quick log" />
              <button
                type="button"
                onClick={() => setLogOpen((value) => !value)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-black text-white"
              >
                <Plus className="h-4 w-4" />
                Log
              </button>
            </div>

            {!logOpen ? (
              <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm leading-6 text-[#6b7280]">
                Add one finished workout or a quick activity check-in. Keep it light; the dashboard only needs the next useful signal.
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 rounded-full bg-[#f3f4f6] p-1">
                  {[
                    ["activity", "Activity"],
                    ["workout", "Workout"],
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setLogMode(mode as "workout" | "activity")}
                      className={`rounded-full px-3 py-2 text-xs font-black transition ${
                        logMode === mode ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {logMode === "activity" ? (
                  <form onSubmit={submitActivity} className="grid gap-3 rounded-2xl bg-[#f8fafc] p-3">
                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                      <FieldLabel>
                        Steps
                        <input value={activityForm.steps} onChange={(event) => setActivityForm((current) => ({ ...current, steps: event.target.value }))} type="number" min="0" placeholder="6500" className={fieldClass} />
                      </FieldLabel>
                      <FieldLabel>
                        Weight
                        <input value={activityForm.weight} onChange={(event) => setActivityForm((current) => ({ ...current, weight: event.target.value }))} type="number" min="25" step="0.1" placeholder="kg" className={fieldClass} />
                      </FieldLabel>
                      <FieldLabel>
                        Kcal
                        <input value={activityForm.calories} onChange={(event) => setActivityForm((current) => ({ ...current, calories: event.target.value }))} type="number" min="0" placeholder="120" className={fieldClass} />
                      </FieldLabel>
                    </div>
                    <FieldLabel>
                      Note
                      <input value={activityForm.notes} onChange={(event) => setActivityForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Easy walk, felt good" className={fieldClass} />
                    </FieldLabel>
                    {formErrors.activity ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                        {formErrors.activity}
                      </p>
                    ) : null}
                    <button type="submit" disabled={d.actions.savingActivity} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-white disabled:opacity-60">
                      {d.actions.savingActivity ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save activity
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submitWorkout} className="grid gap-3 rounded-2xl bg-[#f8fafc] p-3">
                    <FieldLabel>
                      Title
                      <input
                        value={workoutForm.title}
                        onChange={(event) => setWorkoutForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Upper body strength"
                        className={fieldClass}
                      />
                    </FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                      <FieldLabel>
                        Min
                        <input value={workoutForm.duration} onChange={(event) => setWorkoutForm((current) => ({ ...current, duration: event.target.value }))} type="number" min="1" className={fieldClass} />
                      </FieldLabel>
                      <FieldLabel>
                        Kcal
                        <input value={workoutForm.calories} onChange={(event) => setWorkoutForm((current) => ({ ...current, calories: event.target.value }))} type="number" min="0" className={fieldClass} />
                      </FieldLabel>
                      <FieldLabel>
                        Rating
                        <input value={workoutForm.rating} onChange={(event) => setWorkoutForm((current) => ({ ...current, rating: event.target.value }))} type="number" min="1" max="5" className={fieldClass} />
                      </FieldLabel>
                    </div>
                    {formErrors.workout ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                        {formErrors.workout}
                      </p>
                    ) : null}
                    <button type="submit" disabled={d.actions.savingWorkout} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-white disabled:opacity-60">
                      {d.actions.savingWorkout ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save workout
                    </button>
                  </form>
                )}
              </div>
            )}
          </ShellCard>

          <ShellCard className="p-5 sm:p-6">
            <SectionTitle eyebrow="Nutrition" title="Small snapshot" action={<Apple className="h-5 w-5 text-[#16a34a]" />} />
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                <span className="font-bold text-[#6b7280]">Calories</span>
                <span className="font-black text-[#111827]">
                  {formatNumber(d.nutrition.calories)}
                  <span className="ml-1 text-xs text-[#9ca3af]">
                    / {d.nutrition.caloriesTarget ? formatNumber(d.nutrition.caloriesTarget) : "--"}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                <span className="font-bold text-[#6b7280]">Protein</span>
                <span className="font-black text-[#111827]">
                  {formatNumber(d.nutrition.proteinG)} g
                  <span className="ml-1 text-xs text-[#9ca3af]">
                    / {d.nutrition.proteinTargetG ? formatNumber(d.nutrition.proteinTargetG) : "--"} g
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                <span className="font-bold text-[#6b7280]">Water</span>
                <span className="font-black text-[#111827]">
                  {formatMl(d.nutrition.waterMl)}
                  <span className="ml-1 text-xs text-[#9ca3af]">
                    / {d.nutrition.waterTargetMl ? formatMl(d.nutrition.waterTargetMl) : "--"}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-3 grid gap-2 rounded-2xl bg-[#f8fafc] p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6b7280]">Quick water</p>
              <div className="flex flex-wrap gap-2">
                {[250, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={d.actions.savingWater}
                    onClick={() => void addWaterQuick(amount)}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white px-3 text-xs font-black text-[#111827] disabled:opacity-60"
                  >
                    +{amount} ml
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={nutritionForm.water}
                  onChange={(event) => setNutritionForm((current) => ({ ...current, water: event.target.value }))}
                  type="number"
                  min="1"
                  placeholder="Custom ml"
                  className={fieldClass}
                />
                <button
                  type="button"
                  disabled={d.actions.savingWater}
                  onClick={() => void addWaterQuick()}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-[#111827] px-3 text-xs font-black text-white disabled:opacity-60"
                >
                  {d.actions.savingWater ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Droplets className="h-3.5 w-3.5" />}
                  Add
                </button>
              </div>
              {formErrors.water ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  {formErrors.water}
                </p>
              ) : null}
            </div>

            <form onSubmit={submitNutrition} className="mt-3 grid gap-2 rounded-2xl bg-[#f8fafc] p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6b7280]">Quick food log</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={nutritionForm.calories}
                  onChange={(event) => setNutritionForm((current) => ({ ...current, calories: event.target.value }))}
                  type="number"
                  min="0"
                  placeholder="Calories"
                  className={fieldClass}
                />
                <input
                  value={nutritionForm.protein}
                  onChange={(event) => setNutritionForm((current) => ({ ...current, protein: event.target.value }))}
                  type="number"
                  min="0"
                  placeholder="Protein g"
                  className={fieldClass}
                />
              </div>
              {formErrors.nutrition ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  {formErrors.nutrition}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={d.actions.savingNutrition}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {d.actions.savingNutrition ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save intake
              </button>
            </form>
          </ShellCard>
        </aside>
      </section>
    </div>
  );
}
