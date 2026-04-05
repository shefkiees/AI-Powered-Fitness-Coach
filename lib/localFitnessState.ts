const streakKey = (userId: string) => `afc_streak_${userId}`;
const goalsKey = (userId: string) => `afc_daily_goals_${userId}`;
const timelineKey = (userId: string) => `afc_timeline_${userId}`;

export type DailyGoalsState = {
  workoutDone: boolean;
  hydrationCups: number;
  mobilityMinutes: number;
};

export type TimelineEvent = {
  id: string;
  label: string;
  at: string;
  tone: "workout" | "coach" | "milestone" | "note";
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type StreakStored = { lastDate: string; count: number };

export function readStreak(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(streakKey(userId));
    if (!raw) return 0;
    const s = JSON.parse(raw) as StreakStored;
    const today = todayISO();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    if (s.lastDate === today) return s.count;
    if (s.lastDate === y) return s.count;
    return 0;
  } catch {
    return 0;
  }
}

export function recordActiveDay(userId: string): number {
  if (typeof window === "undefined") return 0;
  const today = todayISO();
  let count = 1;
  try {
    const raw = localStorage.getItem(streakKey(userId));
    const prev = raw ? (JSON.parse(raw) as StreakStored) : null;
    if (prev?.lastDate === today) {
      count = prev.count;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const y = yesterday.toISOString().slice(0, 10);
      if (prev?.lastDate === y) count = prev.count + 1;
      else count = 1;
    }
    localStorage.setItem(
      streakKey(userId),
      JSON.stringify({ lastDate: today, count }),
    );
  } catch {
    /* ignore */
  }
  return count;
}

const defaultGoals = (): DailyGoalsState => ({
  workoutDone: false,
  hydrationCups: 0,
  mobilityMinutes: 0,
});

export function readDailyGoals(userId: string): DailyGoalsState {
  if (typeof window === "undefined") return defaultGoals();
  try {
    const raw = localStorage.getItem(goalsKey(userId));
    if (!raw) return defaultGoals();
    const parsed = JSON.parse(raw) as {
      date: string;
      goals: DailyGoalsState;
    };
    if (parsed.date !== todayISO()) return defaultGoals();
    return { ...defaultGoals(), ...parsed.goals };
  } catch {
    return defaultGoals();
  }
}

export function writeDailyGoals(
  userId: string,
  goals: DailyGoalsState,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      goalsKey(userId),
      JSON.stringify({ date: todayISO(), goals }),
    );
  } catch {
    /* ignore */
  }
}

export function readTimeline(userId: string): TimelineEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(timelineKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; events: TimelineEvent[] };
    if (parsed.date !== todayISO()) return [];
    return parsed.events.slice(-12);
  } catch {
    return [];
  }
}

export function pushTimelineEvent(
  userId: string,
  event: Omit<TimelineEvent, "id" | "at"> & { id?: string },
): TimelineEvent[] {
  if (typeof window === "undefined") return [];
  const today = todayISO();
  const prev = readTimeline(userId);
  const entry: TimelineEvent = {
    id: event.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: event.label,
    at: new Date().toISOString(),
    tone: event.tone,
  };
  const events = [...prev, entry].slice(-20);
  try {
    localStorage.setItem(
      timelineKey(userId),
      JSON.stringify({ date: today, events }),
    );
  } catch {
    /* ignore */
  }
  return events;
}
