import { supabase } from "@/lib/supabaseClient";

export async function fetchWorkoutCount(_userId: string): Promise<number> {
  void _userId;
  try {
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    void authError;
    void authData;

    const { count, error } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true });

    if (error) {
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}
