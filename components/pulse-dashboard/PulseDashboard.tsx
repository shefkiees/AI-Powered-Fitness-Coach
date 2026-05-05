"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Clock3,
  Dumbbell,
  Flame,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePulseDashboard } from "@/hooks/usePulseDashboard";

function firstName(user: ReturnType<typeof useAuth>["user"]) {
  return (
    user?.user_metadata?.full_name?.toString?.().split(" ")?.[0] ||
    user?.email?.split("@")?.[0] ||
    "Athlete"
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  helper: string;
}) {
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

export function PulseDashboard() {
  const { user } = useAuth();
  const d = usePulseDashboard(user?.id);
  const progress = Math.max(0, Math.min(100, Math.round(d.goalProgressPct || 0)));
  const ringStyle = { background: `conic-gradient(#22c55e ${progress}%, #e5e7eb ${progress}% 100%)` };

  if (d.loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.35rem] bg-[#ececf1]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-3 text-[#171717]">
      <section className="overflow-hidden rounded-[1.35rem] border border-[#e5e7eb] bg-white shadow-[0_12px_34px_rgba(17,24,39,0.06)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#6b7280]">Welcome back</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#111827]">{firstName(user)}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7280]">
              Your training overview, progress, and next workout in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={d.refresh}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 text-sm font-black text-[#111827] shadow-sm transition hover:bg-[#f3f4f6]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="border-t border-[#eef0f4] bg-[#f8fafc] p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-[1.2rem] border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7280]">Next session</p>
                  {d.todayPlanTitle ? (
                    <>
                      <span className="mt-3 inline-flex rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-black capitalize text-[#16a34a]">
                        {d.todayFocusTag}
                      </span>
                      <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#111827]">{d.todayPlanTitle}</h3>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
                        <Clock3 className="h-4 w-4" />
                        {d.estMinutes ? `${d.estMinutes} min` : "Duration not set"}
                      </p>
                      {d.todayPlanSubtitle ? <p className="mt-2 text-sm text-[#6b7280]">{d.todayPlanSubtitle}</p> : null}
                    </>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-4">
                      <h3 className="text-xl font-black text-[#111827]">No real session yet</h3>
                      <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                        Generate a workout plan or add workouts in Supabase to show a next session here.
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-1" style={ringStyle}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-white text-sm font-black text-[#16a34a]">
                    {progress}%
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {d.todayWorkoutHref ? (
                  <Link
                    href={d.todayWorkoutHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111827] px-5 text-sm font-black text-white transition hover:translate-y-[-1px]"
                  >
                    Start workout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/workout-plan"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111827] px-5 text-sm font-black text-white transition hover:translate-y-[-1px]"
                  >
                    Open library
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href="/workout-plan"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e5e7eb] bg-white px-5 text-sm font-black text-[#111827] transition hover:bg-[#f3f4f6]"
                >
                  Browse all
                </Link>
              </div>
            </article>

            <article className="rounded-[1.2rem] border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7280]">This week</p>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {d.weekStrip.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-black ${day.done ? "bg-[#22c55e] text-white" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                      {day.day.slice(0, 1)}
                    </div>
                    <p className="mt-2 truncate text-[0.65rem] font-semibold text-[#6b7280]">{day.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-[#f8fafc] p-4">
                <p className="text-sm font-black text-[#111827]">{d.coachHeadline || "No coach summary yet"}</p>
                <div className="mt-3 grid gap-2">
                  {d.coachBullets.length ? (
                    d.coachBullets.map((item) => (
                      <p key={item} className="text-sm leading-6 text-[#6b7280]">{item}</p>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[#6b7280]">Log a workout or add an active goal to generate real coaching context.</p>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Dumbbell} label="Workouts" value={d.workoutsWeek} helper="completed this week" />
        <StatTile icon={Flame} label="Burned" value={d.caloriesWeek} helper="kcal from logs" />
        <StatTile icon={TrendingUp} label="Streak" value={d.streakDays} helper="completed days" />
        <StatTile icon={Target} label="Goal" value={`${progress}%`} helper="active goal progress" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <article className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[#111827]">Recommended Workouts</h3>
            <Link href="/workout-plan" className="text-sm font-black text-[#16a34a]">See all</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {d.recommendedWorkouts.length ? (
              d.recommendedWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workout/session?workout=${workout.workoutId}`}
                  className="flex items-center gap-3 rounded-[1.2rem] bg-[#f8fafc] p-3 transition hover:bg-[#f3f4f6]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e5e7eb]">
                    <Dumbbell className="h-5 w-5 text-[#16a34a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-[#111827]">{workout.title}</p>
                    <p className="text-xs font-semibold text-[#6b7280]">
                      {workout.minutes ? `${workout.minutes} min` : "No duration"} - {workout.difficulty || "No level"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-black text-[#16a34a]">
                    {workout.category || "Workout"}
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-4 text-sm leading-6 text-[#6b7280]">
                No workouts are available yet. Add catalog rows or apply the workout migration.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.35rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[#111827]">Recent Activity</h3>
            <CalendarDays className="h-5 w-5 text-[#6b7280]" />
          </div>
          <div className="mt-4 grid gap-3">
            {d.recentActivity.length ? (
              d.recentActivity.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[1.15rem] bg-[#f8fafc] p-3">
                  <p className="font-black text-[#111827]">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold text-[#6b7280]">
                    {new Date(item.at).toLocaleDateString()} - {item.minutes ?? 0} min - {item.calories ?? 0} kcal
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-4 text-sm leading-6 text-[#6b7280]">
                No completed workouts yet. Finish a session and it will appear here.
              </div>
            )}
          </div>
        </article>
      </section>

      {d.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Dashboard data warning: {d.error}
        </div>
      ) : null}
    </div>
  );
}
