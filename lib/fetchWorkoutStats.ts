import { supabase } from "@/lib/supabaseClient";

export async function fetchWorkoutCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}
