export type NullableNumber = number | null;

export type DashboardProfile = {
  name: string;
  age: NullableNumber;
  weightKg: NullableNumber;
  goal: string;
  fitnessLevel: string;
  workoutDaysPerWeek: number;
  preferredWorkoutDays: string[];
  targetWeightKg: NullableNumber;
  equipment: string[];
  injuries: string;
  profileComplete: boolean;
};

export type PulseGoal = {
  id: string;
  title: string;
  description: string;
  pct: number;
  target: NullableNumber;
  current: number;
  unit: string | null;
  status: string;
  deadline: string | null;
};

export type PulseActivity = {
  id: string;
  type: "workout" | "activity" | "goal" | "plan";
  title: string;
  at: string;
  meta: string;
};

export type PulseWorkoutSuggestion = {
  id: string;
  title: string;
  category: string | null;
  difficulty: string | null;
  minutes: NullableNumber;
  workoutId: string;
  reason: string;
  isAiGenerated: boolean;
};

export type PulseDayVolume = {
  label: string;
  dateKey: string;
  count: number;
  calories: number;
  steps: number;
  minutes: number;
};

export type PulseScheduleDay = {
  label: string;
  dateKey: string;
  dateLabel: string;
  isToday: boolean;
  title: string | null;
  status: string;
  sessionId: string | null;
  workoutId: string | null;
  href: string | null;
  minutes: NullableNumber;
};

export type PulseNutritionSummary = {
  calories: number;
  caloriesTarget: NullableNumber;
  proteinG: number;
  proteinTargetG: NullableNumber;
  waterMl: number;
  waterTargetMl: NullableNumber;
};

export type PulseInsight = {
  id: string;
  title: string;
  body: string;
  tone: "success" | "warning" | "info";
  actionLabel?: string;
  href?: string;
};

export type PulseWeeklyReview = {
  headline: string;
  wins: string[];
  blockers: string[];
  changes: string[];
  predictions: string[];
  next_best_action: string;
};

export type DashboardActionState = {
  savingWorkout: boolean;
  savingActivity: boolean;
  savingNutrition: boolean;
  savingWater: boolean;
  savingGoal: boolean;
  updatingGoalId: string | null;
  generatingPlan: boolean;
  reviewingCoach: boolean;
  savingWorkoutDays: boolean;
  skippingSessionId: string | null;
  notice: string | null;
  error: string | null;
};

export type QuickWorkoutInput = {
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  rating?: number | null;
};

export type ActivityLogInput = {
  steps?: number | null;
  weightKg?: number | null;
  caloriesBurned?: number | null;
  notes?: string;
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  targetValue?: number | null;
  unit?: string | null;
};

export type NutritionLogInput = {
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  notes?: string;
};

export type PulseDashboardModel = {
  loading: boolean;
  error: string | null;
  profile: DashboardProfile | null;
  workoutsWeek: number;
  caloriesWeek: number;
  minutesWeek: number;
  stepsWeek: number;
  streakDays: number;
  workoutTargetPct: number;
  goalProgressPct: number;
  latestWeightKg: NullableNumber;
  weightDeltaKg: NullableNumber;
  activePlanTitle: string | null;
  activePlanDescription: string | null;
  nextWorkoutTitle: string | null;
  nextWorkoutSubtitle: string | null;
  nextWorkoutHref: string | null;
  todayFocusTag: string;
  estMinutes: NullableNumber;
  coachHeadline: string;
  coachBullets: string[];
  weekSchedule: PulseScheduleDay[];
  weekVolume: PulseDayVolume[];
  monthTrend: PulseDayVolume[];
  nutrition: PulseNutritionSummary;
  recentActivity: PulseActivity[];
  recommendedWorkouts: PulseWorkoutSuggestion[];
  goals: PulseGoal[];
  insights: PulseInsight[];
  weeklyReview: PulseWeeklyReview | null;
  actions: DashboardActionState;
  refresh: () => void;
  refreshWeeklyReview: () => Promise<void>;
  logWorkout: (input: QuickWorkoutInput) => Promise<void>;
  logActivity: (input: ActivityLogInput) => Promise<void>;
  logNutritionIntake: (input: NutritionLogInput) => Promise<void>;
  addWaterIntake: (amountMl: number) => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
  updateGoalProgress: (goalId: string, currentValue: number, status?: string) => Promise<void>;
  updateWorkoutDays: (days: string[]) => Promise<void>;
  skipSession: (sessionId: string) => Promise<void>;
  generateAiPlan: () => Promise<void>;
};
