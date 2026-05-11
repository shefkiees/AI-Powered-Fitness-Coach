import { requireSupabase } from "@/src/services/serviceShared";

function normalizeGoalPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    target_value: values.target_value === "" ? null : Number(values.target_value),
    current_value: values.current_value === "" ? 0 : Number(values.current_value),
    unit: values.unit.trim() || null,
    status: values.status || "active",
    deadline: values.deadline || null,
  };
}

export async function getGoals() {
  const client = requireSupabase();
  const { data, error } = await client.from("goals").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveGoal(_userId, values, goalId = null) {
  const client = requireSupabase();
  const payload = normalizeGoalPayload(values);
  const query = goalId ? client.from("goals").update(payload).eq("id", goalId) : client.from("goals").insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(_userId, goalId) {
  const client = requireSupabase();
  const { error } = await client.from("goals").delete().eq("id", goalId);
  if (error) throw error;
}

export async function updateGoalStatus(_userId, goalId, status) {
  const client = requireSupabase();
  const { data, error } = await client.from("goals").update({ status }).eq("id", goalId).select().single();
  if (error) throw error;
  return data;
}
