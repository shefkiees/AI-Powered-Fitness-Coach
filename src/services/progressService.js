import {
  isMissingColumnError,
  isMissingRelationError,
  nullableNumber,
  requireSupabase,
  todayKey,
} from "@/src/services/serviceShared";

function normalizeLegacyProgressPayload(values) {
  return {
    weight_kg: nullableNumber(values.weight_kg),
    calories: nullableNumber(values.calories ?? values.calories_burned),
    steps: values.steps === "" || values.steps === null || values.steps === undefined ? null : Number(values.steps),
    note: values.note?.trim?.() || values.notes?.trim?.() || "",
  };
}

function normalizeProgressPayload(values) {
  return {
    weight_kg: nullableNumber(values.weight_kg),
    calories_burned: nullableNumber(values.calories ?? values.calories_burned),
    steps: values.steps === "" || values.steps === null || values.steps === undefined ? null : Number(values.steps),
    notes: values.note?.trim?.() || values.notes?.trim?.() || "",
    logged_at: values.logged_at || undefined,
  };
}

function normalizeProgressRow(row) {
  return {
    ...row,
    calories: row.calories_burned ?? row.calories ?? null,
    note: row.notes ?? row.note ?? "",
  };
}

async function getLegacyProgressLogs(client) {
  const { data, error } = await client.from("progress").select("*").order("logged_at", { ascending: true });
  if (error) {
    if (isMissingRelationError(error, "progress")) return [];
    throw error;
  }
  return (data || []).map(normalizeProgressRow);
}

async function addLegacyProgressLog(client, values) {
  const { data, error } = await client.from("progress").insert(normalizeLegacyProgressPayload(values)).select().single();
  if (error) throw error;
  return normalizeProgressRow(data);
}

export async function refreshProgressSnapshot() {
  const client = requireSupabase();
  const { data: completed } = await client.from("completed_workouts").select("completed_at, calories_burned").order("completed_at", { ascending: false }).limit(60);
  const { data: goals } = await client.from("goals").select("target_value,current_value,status").eq("status", "active").limit(6);

  const rows = completed || [];
  const dates = new Set(rows.map((row) => String(row.completed_at).slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 60; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekRows = rows.filter((row) => new Date(row.completed_at) >= weekStart);
  const workoutsCompleted = weekRows.length;
  const caloriesBurned = weekRows.reduce((sum, row) => sum + (Number(row.calories_burned) || 0), 0);
  const goalProgress = (goals || []).reduce((sum, goal) => {
    const target = Number(goal.target_value) || 0;
    const current = Number(goal.current_value) || 0;
    return sum + (target > 0 ? Math.min(100, (current / target) * 100) : 0);
  }, 0);
  const goalCount = goals?.length || 0;

  await client.from("progress_snapshots").upsert(
    {
      snapshot_date: todayKey(),
      calories_burned: caloriesBurned,
      workouts_completed: workoutsCompleted,
      streak_days: streak,
      goal_progress_percent: goalCount ? Math.round(goalProgress / goalCount) : Math.min(100, workoutsCompleted * 15),
      summary: {
        tip:
          workoutsCompleted >= 3
            ? "Great weekly rhythm. Protect recovery with one lighter mobility block."
            : "Book one short session today and keep the weekly chain alive.",
      },
    },
    { onConflict: "user_id,snapshot_date" },
  );
}

export async function getProgressLogs() {
  const client = requireSupabase();
  const { data, error } = await client.from("weight_logs").select("*").order("logged_at", { ascending: true });
  if (error) {
    if (isMissingRelationError(error, "weight_logs")) return getLegacyProgressLogs(client);
    throw error;
  }
  const rows = (data || []).map(normalizeProgressRow);
  if (rows.length) return rows;
  return getLegacyProgressLogs(client);
}

export async function addProgressLog(_userId, values) {
  const client = requireSupabase();
  const modern = await client.from("weight_logs").insert(normalizeProgressPayload(values)).select().single();
  let data = modern.data;
  let error = modern.error;

  if (error && isMissingColumnError(error)) {
    const legacy = await client.from("weight_logs").insert(normalizeLegacyProgressPayload(values)).select().single();
    data = legacy.data;
    error = legacy.error;
  }

  if (error && (isMissingRelationError(error, "weight_logs") || isMissingColumnError(error))) {
    const legacyProgress = await addLegacyProgressLog(client, values);
    await refreshProgressSnapshot();
    return legacyProgress;
  }

  if (error) throw error;
  await refreshProgressSnapshot();
  return normalizeProgressRow(data);
}

export async function getProgressSnapshots() {
  const client = requireSupabase();
  const { data, error } = await client.from("progress_snapshots").select("*").order("snapshot_date", { ascending: true }).limit(30);
  if (error) throw error;
  return data || [];
}
