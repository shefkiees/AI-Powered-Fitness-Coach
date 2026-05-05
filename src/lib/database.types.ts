export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Nullable<T> = T | null;

export type PulseTable<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export type Database = {
  public: {
    Tables: {
      profiles: PulseTable<{
        id: string;
        name: Nullable<string>;
        age: Nullable<number>;
        gender: Nullable<string>;
        height_cm: Nullable<number>;
        weight_kg: Nullable<number>;
        goal: Nullable<string>;
        fitness_level: string;
        workout_days_per_week: number;
        dietary_preference: string;
        injuries: string;
        preferred_workout_days: string[];
        equipment_available: string[];
        profile_image: Nullable<string>;
        created_at: string;
        updated_at: string;
      }>;
      fitness_profiles: PulseTable<{
        id: string;
        user_id: string;
        fitness_level: string;
        main_goal: string;
        target_weight_kg: Nullable<number>;
        weekly_workout_target: number;
        preferred_workout_days: string[];
        equipment_available: string[];
        injuries_limitations: Nullable<string>;
        coaching_style: string;
        created_at: string;
        updated_at: string;
      }>;
      goals: PulseTable<{
        id: string;
        user_id: string;
        title: string;
        description: Nullable<string>;
        goal_type: string;
        target_value: Nullable<number>;
        current_value: number;
        unit: Nullable<string>;
        status: "active" | "completed" | "paused";
        deadline: Nullable<string>;
        milestones: Json;
        created_at: string;
        updated_at: string;
      }>;
      workouts: PulseTable<{
        id: string;
        user_id: Nullable<string>;
        slug: Nullable<string>;
        title: string;
        description: Nullable<string>;
        category: string;
        muscle_group: string;
        difficulty: string;
        duration_minutes: Nullable<number>;
        equipment: Nullable<string>;
        thumbnail_url: Nullable<string>;
        video_url: Nullable<string>;
        image_url: Nullable<string>;
        goal_tags: string[];
        is_public: boolean;
        source: string;
        created_at: string;
        updated_at: string;
      }>;
      exercises: PulseTable<{
        id: string;
        user_id: Nullable<string>;
        workout_id: Nullable<string>;
        slug: Nullable<string>;
        name: string;
        description: Nullable<string>;
        category: string;
        muscle_group: string;
        difficulty: string;
        instructions: Nullable<string>;
        sets: Nullable<number>;
        reps: Nullable<string>;
        time_seconds: Nullable<number>;
        rest_seconds: Nullable<number>;
        equipment: Nullable<string>;
        video_url: Nullable<string>;
        image_url: Nullable<string>;
        is_public: boolean;
        order_index: number;
        created_at: string;
        updated_at: string;
      }>;
      workout_exercises: PulseTable<{
        id: string;
        user_id: Nullable<string>;
        workout_id: string;
        exercise_id: Nullable<string>;
        exercise_name: Nullable<string>;
        sets: Nullable<number>;
        reps: Nullable<string>;
        time_seconds: Nullable<number>;
        rest_seconds: Nullable<number>;
        notes: Nullable<string>;
        order_index: number;
        created_at: string;
        updated_at: string;
      }>;
      user_workout_plans: PulseTable<{
        id: string;
        user_id: string;
        title: string;
        description: Nullable<string>;
        goal: Nullable<string>;
        difficulty: Nullable<string>;
        start_date: Nullable<string>;
        end_date: Nullable<string>;
        status: "active" | "archived" | "paused" | "completed";
        plan_data: Json;
        created_at: string;
        updated_at: string;
      }>;
      user_workout_sessions: PulseTable<{
        id: string;
        user_id: string;
        workout_id: Nullable<string>;
        plan_id: Nullable<string>;
        title: string;
        scheduled_for: Nullable<string>;
        started_at: Nullable<string>;
        completed_at: Nullable<string>;
        status: "scheduled" | "in_progress" | "completed" | "skipped" | "cancelled";
        duration_minutes: Nullable<number>;
        calories_burned: Nullable<number>;
        notes: Nullable<string>;
        session_data: Json;
        created_at: string;
        updated_at: string;
      }>;
      completed_workouts: PulseTable<{
        id: string;
        user_id: string;
        workout_id: Nullable<string>;
        session_id: Nullable<string>;
        workout_title: string;
        duration_minutes: Nullable<number>;
        calories_burned: Nullable<number>;
        rating: Nullable<number>;
        notes: Nullable<string>;
        completed_at: string;
        created_at: string;
        updated_at: string;
      }>;
      favorite_workouts: PulseTable<{
        id: string;
        user_id: string;
        workout_id: string;
        notes: Nullable<string>;
        created_at: string;
        updated_at: string;
      }>;
      nutrition_logs: PulseTable<{
        id: string;
        user_id: string;
        log_date: string;
        target_calories: number;
        target_protein_g: number;
        target_carbs_g: number;
        target_fat_g: number;
        consumed_calories: number;
        consumed_protein_g: number;
        consumed_carbs_g: number;
        consumed_fat_g: number;
        notes: Nullable<string>;
        created_at: string;
        updated_at: string;
      }>;
      meals: PulseTable<{
        id: string;
        user_id: Nullable<string>;
        nutrition_log_id: Nullable<string>;
        title: string;
        description: Nullable<string>;
        meal_type: string;
        calories: Nullable<number>;
        protein_g: Nullable<number>;
        carbs_g: Nullable<number>;
        fat_g: Nullable<number>;
        order_index: number;
        is_template: boolean;
        created_at: string;
        updated_at: string;
      }>;
      water_logs: PulseTable<{
        id: string;
        user_id: string;
        log_date: string;
        amount_ml: number;
        target_ml: number;
        created_at: string;
        updated_at: string;
      }>;
      weight_logs: PulseTable<{
        id: string;
        user_id: string;
        weight_kg: Nullable<number>;
        calories_burned: Nullable<number>;
        steps: Nullable<number>;
        notes: Nullable<string>;
        logged_at: string;
        created_at: string;
        updated_at: string;
      }>;
      body_measurements: PulseTable<{
        id: string;
        user_id: string;
        measured_at: string;
        chest_cm: Nullable<number>;
        waist_cm: Nullable<number>;
        hips_cm: Nullable<number>;
        arm_cm: Nullable<number>;
        thigh_cm: Nullable<number>;
        body_fat_percent: Nullable<number>;
        notes: Nullable<string>;
        created_at: string;
        updated_at: string;
      }>;
      ai_coach_messages: PulseTable<{
        id: string;
        user_id: string;
        role: "user" | "assistant" | "system";
        content: string;
        category: Nullable<string>;
        metadata: Json;
        created_at: string;
        updated_at: string;
      }>;
      progress_snapshots: PulseTable<{
        id: string;
        user_id: string;
        snapshot_date: string;
        weight_kg: Nullable<number>;
        calories_burned: number;
        workouts_completed: number;
        streak_days: number;
        goal_progress_percent: number;
        summary: Json;
        created_at: string;
        updated_at: string;
      }>;
      onboarding_answers: PulseTable<{
        id: string;
        user_id: string;
        answers: Json;
        completed_at: string;
        created_at: string;
        updated_at: string;
      }>;
      pose_sessions: PulseTable<{
        id: string;
        user_id: string;
        exercise_name: string;
        started_at: string;
        completed_at: Nullable<string>;
        reps: number;
        score: number;
        summary: Nullable<string>;
        created_at: string;
        updated_at: string;
      }>;
      pose_feedback: PulseTable<{
        id: string;
        user_id: string;
        pose_session_id: string;
        exercise_name: string;
        rep_index: Nullable<number>;
        score: Nullable<number>;
        cue: string;
        severity: "positive" | "info" | "warning";
        created_at: string;
        updated_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
