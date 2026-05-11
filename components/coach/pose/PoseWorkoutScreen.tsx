"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Brain,
  Clock,
  Move3D,
  Play,
  RefreshCw,
  Save,
  ShieldAlert,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  EXERCISE_LABELS,
  type AutoExercise,
  type AutoWorkoutState,
  type ExerciseTotal,
  type LiveFeedbackItem,
  type RepSummary,
} from "@/lib/pose/autoWorkoutTracker";
import { getPoseHistory, savePoseSession } from "@/src/services/workoutService";

type PoseHistoryRow = {
  id: string;
  exercise_name: string;
  reps: number;
  score: number;
  form_score?: number | null;
  summary?: string | null;
  feedback_summary?: string | null;
  ai_coach_summary?: string | null;
  exercise_totals?: Record<string, ExerciseTotal> | null;
  duration_seconds?: number | null;
  completed_at?: string | null;
  created_at: string;
  final_session_result?: FinalSessionResult | null;
};

type AiSummary = {
  headline: string;
  summary: string;
  focus_next: string;
  cues: string[];
};

type FinalSessionResult = {
  startedAt: string;
  endedAt: string;
  duration: number;
  selectedExercise: AutoExercise;
  detectedExercises: AutoExercise[];
  totalReps: number;
  repsByExercise: Record<AutoExercise, ExerciseTotal>;
  formScore: number;
  avgConfidence: number;
  validReps: number;
  invalidReps: number;
  partialReps: number;
  plankDuration: number;
  repEvents: RepSummary[];
  coachCues: string[];
  improvementTips: string[];
  feedbackSummary: string;
  bestExercise: string;
  weakestMovement: string;
  saved: boolean;
  historySavedStatus: string;
};

const EXERCISE_OPTIONS: AutoExercise[] = [
  "general",
  "squat",
  "pushup",
  "lunge",
  "biceps_curl",
  "shoulder_press",
  "jumping_jack",
  "plank",
  "situp",
  "lateral_raise",
  "deadlift",
];

const TRACKED_EXERCISES = EXERCISE_OPTIONS.filter((exercise) => exercise !== "general");
const panelClass = "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_18px_60px_rgba(0,0,0,0.28)]";

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function emptyTotals() {
  return EXERCISE_OPTIONS.reduce<Record<AutoExercise, ExerciseTotal>>((acc, exercise) => {
    acc[exercise] = {
      exercise,
      label: EXERCISE_LABELS[exercise],
      reps: 0,
      valid_reps: 0,
      invalid_reps: 0,
      partial_reps: 0,
      duration_seconds: 0,
      hold_seconds: 0,
      average_form_score: 0,
      average_confidence: 0,
      issues: [],
      best_rep: null,
      worst_rep: null,
      rep_events: [],
      average_tempo_ms: 0,
      last_rep_at: null,
    };
    return acc;
  }, {} as Record<AutoExercise, ExerciseTotal>);
}

function metricValue(label: string, value: ReactNode, accent = false) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/42">{label}</p>
      <p className={cn("mt-1 text-sm font-black text-white", accent ? "text-[var(--fc-accent-strong)]" : "")}>{value}</p>
    </div>
  );
}

function scoreLabel(score: number) {
  if (score >= 90) return "Elite";
  if (score >= 80) return "Strong";
  if (score >= 65) return "Building";
  return "Needs work";
}

function issueLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\bjack\b/g, "jumping jack");
}

function cleanCueText(item?: LiveFeedbackItem) {
  if (!item?.text) return "";
  return item.text.replace(/^[A-Za-z -]+:\s*/, "");
}

function topExercises(totals: Record<AutoExercise, ExerciseTotal>) {
  return TRACKED_EXERCISES
    .map((exercise) => totals[exercise])
    .filter((item) => item && (item.reps > 0 || item.hold_seconds > 0 || item.invalid_reps > 0))
    .sort((a, b) => {
      const aValue = a.exercise === "plank" ? a.hold_seconds : a.reps;
      const bValue = b.exercise === "plank" ? b.hold_seconds : b.reps;
      return bValue - aValue;
    });
}

function bestExerciseLabel(totals: Record<AutoExercise, ExerciseTotal>) {
  const best = topExercises(totals)[0];
  return best ? best.label : "No completed exercise";
}

function weakestMovementLabel(totals: Record<AutoExercise, ExerciseTotal>) {
  const worstRep = topExercises(totals)
    .flatMap((item) => (item.worst_rep ? [{ label: item.label, score: item.worst_rep.score }] : []))
    .sort((a, b) => a.score - b.score)[0];
  return worstRep ? `${worstRep.label} ${worstRep.score}/100` : "No weak movement detected";
}

function repBadge(event: RepSummary) {
  const tone =
    event.kind === "invalid"
      ? "bg-red-500/12 text-red-100 ring-red-400/20"
      : event.partial
        ? "bg-amber-500/12 text-amber-100 ring-amber-400/20"
        : "bg-emerald-500/12 text-emerald-100 ring-emerald-400/20";
  return (
    <div key={event.id} className={cn("rounded-2xl px-3 py-3 ring-1", tone)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{event.exercise_label}</p>
        <span className="text-[10px] font-black uppercase tracking-[0.16em]">
          {event.kind === "invalid" ? "Invalid" : event.partial ? "Partial" : "Valid"}
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold opacity-90">
        {new Date(event.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="mt-2 text-sm font-semibold opacity-90">
        Score {event.score}/100
        {typeof event.confidence === "number" ? ` - Confidence ${Math.round(event.confidence * 100)}%` : ""}
      </p>
    </div>
  );
}

function ExerciseSelector({
  selectedExercise,
  onChange,
}: {
  selectedExercise: AutoExercise;
  onChange: (exercise: AutoExercise) => void;
}) {
  return (
    <div className={cn(panelClass, "p-4")}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--fc-accent-strong)]">
        <Target className="h-4 w-4" />
        Exercise mode
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXERCISE_OPTIONS.map((exercise) => {
          const active = selectedExercise === exercise;
          return (
            <button
              key={exercise}
              type="button"
              onClick={() => onChange(exercise)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition",
                active
                  ? "bg-[var(--fc-accent)] text-black"
                  : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
              )}
            >
              {exercise === "general" ? "Auto detect" : EXERCISE_LABELS[exercise]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PoseWorkoutScreen() {
  const [cameraActive, setCameraActive] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [history, setHistory] = useState<PoseHistoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [workoutState, setWorkoutState] = useState<AutoWorkoutState | null>(null);
  const [finalSessionResult, setFinalSessionResult] = useState<FinalSessionResult | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<AutoExercise>("general");
  const [resetKey, setResetKey] = useState(0);
  const sessionStartedAtRef = useRef<number | null>(null);
  const historySectionRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory((await getPoseHistory()) as PoseHistoryRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setCameraActive(active);
    if (active && !sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }
  }, []);

  const handleWorkoutAnalysis = useCallback((analysis: AutoWorkoutState) => {
    if (!sessionStartedAtRef.current) sessionStartedAtRef.current = Date.now();
    setWorkoutState(analysis);
  }, []);

  useEffect(() => {
    if (!cameraActive) return undefined;
    const updateTimer = () => {
      if (sessionStartedAtRef.current) {
        setDurationSeconds(Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
      }
    };
    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [cameraActive]);

  const liveTotals = workoutState?.totals || emptyTotals();
  const liveRepEvents = workoutState?.repTimeline || [];
  const activeExercise = workoutState?.activeExercise || selectedExercise;
  const activeTotal = liveTotals[activeExercise] || liveTotals.general;
  const liveCue = cleanCueText(workoutState?.feedback?.[0]) || workoutState?.tips?.[0] || "Move into frame or select an exercise.";

  const resetSession = useCallback(() => {
    sessionStartedAtRef.current = cameraActive ? Date.now() : null;
    setDurationSeconds(0);
    setWorkoutState(null);
    setFinalSessionResult(null);
    setError("");
    setResetKey((value) => value + 1);
  }, [cameraActive]);

  const startNewSession = useCallback(() => {
    sessionStartedAtRef.current = null;
    setCameraActive(false);
    setDurationSeconds(0);
    setWorkoutState(null);
    setFinalSessionResult(null);
    setError("");
    setResetKey((value) => value + 1);
  }, []);

  const buildFinalSessionResult = useCallback((): FinalSessionResult => {
    const now = new Date();
    const startedAt = sessionStartedAtRef.current ? new Date(sessionStartedAtRef.current) : new Date(now.getTime() - durationSeconds * 1000);
    const totals = workoutState?.totals || emptyTotals();
    const feedbackSummary = workoutState?.headline || "Session completed.";
    return {
      startedAt: startedAt.toISOString(),
      endedAt: now.toISOString(),
      duration: Math.max(durationSeconds, Math.round((now.getTime() - startedAt.getTime()) / 1000)),
      selectedExercise,
      detectedExercises: workoutState?.detectedExercises || topExercises(totals).map((item) => item.exercise),
      totalReps: workoutState?.totalReps || 0,
      repsByExercise: totals,
      formScore: workoutState?.averageFormScore || workoutState?.score || 0,
      avgConfidence: workoutState?.averageConfidence || workoutState?.confidence || 0,
      validReps: workoutState?.validReps || 0,
      invalidReps: workoutState?.invalidReps || 0,
      partialReps: workoutState?.partialReps || 0,
      plankDuration: workoutState?.plankDuration || totals.plank.hold_seconds || 0,
      repEvents: workoutState?.repEvents || [],
      coachCues: workoutState?.coachCues || [],
      improvementTips: workoutState?.improvementTips || [],
      feedbackSummary,
      bestExercise: bestExerciseLabel(totals),
      weakestMovement: weakestMovementLabel(totals),
      saved: false,
      historySavedStatus: "Not saved yet",
    };
  }, [durationSeconds, selectedExercise, workoutState]);

  const endSession = useCallback(() => {
    setFinalSessionResult(buildFinalSessionResult());
    setCameraActive(false);
  }, [buildFinalSessionResult]);

  const saveSession = useCallback(async (session = finalSessionResult) => {
    if (!session) return;
    setSaving(true);
    setError("");
    try {
      const movementDurations = Object.fromEntries(
        TRACKED_EXERCISES.map((exercise) => {
          const total = session.repsByExercise[exercise];
          return [exercise, exercise === "plank" ? total.hold_seconds : total.duration_seconds];
        }).filter(([, value]) => Number(value) > 0),
      );

      const feedbackLines = session.coachCues.length ? session.coachCues : [session.feedbackSummary];
      const summaryResponse = await fetch("/api/coach/pose-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_name: "AI Form Coach",
          exercise_type: selectedExercise === "general" ? "auto" : selectedExercise,
          detected_exercises: session.detectedExercises,
          exercise_totals: session.repsByExercise,
          reps: session.totalReps,
          score: session.formScore,
          average_form_score: session.formScore,
          duration_seconds: session.duration,
          movement_durations: movementDurations,
          detected_issues: TRACKED_EXERCISES.flatMap((exercise) => session.repsByExercise[exercise]?.issues || []),
          cues: feedbackLines.slice(0, 8),
        }),
      });
      const summaryData = (await summaryResponse.json().catch(() => ({}))) as { summary?: AiSummary };
      const aiSummary = summaryResponse.ok ? summaryData.summary : null;

      const nextSession = {
        ...session,
        coachCues: aiSummary?.cues?.length ? aiSummary.cues : session.coachCues,
        improvementTips: aiSummary?.focus_next ? [aiSummary.focus_next, ...session.improvementTips] : session.improvementTips,
        feedbackSummary: aiSummary?.summary || session.feedbackSummary,
        saved: true,
        historySavedStatus: "Saved to history",
      };

      await savePoseSession({
        exercise_name: "AI Form Coach",
        exercise_type: selectedExercise === "general" ? "auto" : selectedExercise,
        movement: selectedExercise === "general" ? "auto" : selectedExercise,
        started_at: session.startedAt,
        completed_at: session.endedAt,
        ended_at: session.endedAt,
        duration_seconds: session.duration,
        reps: session.totalReps,
        score: session.formScore,
        form_score: session.formScore,
        exercise_totals: session.repsByExercise,
        detected_issues: TRACKED_EXERCISES.flatMap((exercise) => session.repsByExercise[exercise]?.issues || []),
        ai_coach_summary: aiSummary?.summary || session.feedbackSummary,
        feedback_summary: aiSummary?.summary || session.feedbackSummary,
        summary: aiSummary?.summary || session.feedbackSummary,
        cues: nextSession.coachCues,
        final_session_result: nextSession,
      });

      setFinalSessionResult(nextSession);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [finalSessionResult, loadHistory, selectedExercise]);

  const report = finalSessionResult;
  const advancedMetrics = workoutState?.metrics || {};
  const historyCards = history.filter((item) => item.final_session_result);

  if (report) {
    const scoredExercises = topExercises(report.repsByExercise);
    return (
      <div className="min-h-screen bg-[#070707] px-3 py-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
          <section className={cn(panelClass, "overflow-hidden p-6")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--fc-accent-strong)]">Session completed</p>
                <h1 className="mt-2 text-4xl font-black">Performance report</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">{report.feedbackSummary}</p>
              </div>
              <div className="rounded-full bg-[var(--fc-accent)]/12 px-4 py-2 text-sm font-black text-[var(--fc-accent-strong)]">
                {scoreLabel(report.formScore)}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricValue("Duration", formatDuration(report.duration))}
              {metricValue("Total reps", report.totalReps)}
              {metricValue("Form score", `${Math.round(report.formScore)}/100`, true)}
              {metricValue("Average confidence", `${Math.round(report.avgConfidence)}%`)}
              {metricValue("Best exercise", report.bestExercise)}
              {metricValue("Weakest movement", report.weakestMovement)}
              {metricValue("Valid vs invalid", `${report.validReps} / ${report.invalidReps}`)}
              {metricValue("Plank duration", report.plankDuration ? formatDuration(report.plankDuration) : "0:00")}
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-5">
              <section className={cn(panelClass, "p-6")}>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Reps by exercise</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {scoredExercises.length ? scoredExercises.map((item) => (
                    <div key={item.exercise} className="rounded-2xl bg-white/[0.04] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black">{item.label}</p>
                        <p className="text-xs font-black text-[var(--fc-accent-strong)]">
                          {item.exercise === "plank" ? formatDuration(item.hold_seconds) : `${item.reps} reps`}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-white/60">
                        Valid {item.valid_reps} - Invalid {item.invalid_reps} - Partial {item.partial_reps}
                      </p>
                    </div>
                  )) : <p className="text-sm text-white/55">No tracked movement was saved for this session.</p>}
                </div>
              </section>

              <section className={cn(panelClass, "p-6")}>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Rep timeline</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {report.repEvents.length ? report.repEvents.slice(0, 9).map(repBadge) : <p className="text-sm text-white/55">No rep events were recorded.</p>}
                </div>
              </section>

              <section className={cn(panelClass, "p-6")}>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Feedback summary</p>
                    <p className="mt-3 text-sm leading-6 text-white/65">{report.feedbackSummary}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Improvement tips</p>
                    <div className="mt-3 grid gap-2">
                      {report.improvementTips.length ? report.improvementTips.slice(0, 5).map((tip) => (
                        <div key={tip} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/72">
                          {tip}
                        </div>
                      )) : <p className="text-sm text-white/55">No improvement tips captured.</p>}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="grid gap-5">
              <section className={cn(panelClass, "p-5")}>
                <div className="grid place-items-center rounded-[24px] bg-[#060606] px-4 py-8 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--fc-accent)]/12 text-[var(--fc-accent-strong)]">
                    <BadgeCheck className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-xl font-black">History status</p>
                  <p className="mt-2 text-sm text-white/55">{report.historySavedStatus}</p>
                </div>
                <div className="mt-4 grid gap-2">
                  <Button type="button" className="justify-center shadow-none" onClick={() => void saveSession(report)} disabled={saving || report.saved} loading={saving}>
                    <Save className="h-4 w-4" />
                    {report.saved ? "Session saved" : "Save session"}
                  </Button>
                  <Button type="button" variant="ghost" className="border border-white/10 bg-white/[0.03]" onClick={startNewSession}>
                    <Play className="h-4 w-4" />
                    Start new session
                  </Button>
                  <Button type="button" variant="ghost" className="border border-white/10 bg-white/[0.03]" onClick={() => historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    <Clock className="h-4 w-4" />
                    View history
                  </Button>
                </div>
              </section>
            </aside>
          </div>

          <section ref={historySectionRef} className={cn(panelClass, "p-6")}>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Saved history</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {historyCards.length ? historyCards.slice(0, 6).map((item) => {
                const session = item.final_session_result as FinalSessionResult;
                return (
                  <div key={item.id} className="rounded-2xl bg-white/[0.04] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black">{session.bestExercise}</p>
                      <p className="text-xs font-black text-white/45">{new Date(item.completed_at || item.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-2 text-sm text-white/60">{formatDuration(session.duration)} - {session.totalReps} reps - {Math.round(session.formScore)}/100</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/65">{session.feedbackSummary}</p>
                  </div>
                );
              }) : <p className="text-sm text-white/55">No saved final reports yet.</p>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] px-3 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--fc-accent-strong)]">AI Form Coach</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Professional movement tracking</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
              Multi-exercise rep counting, joint-aware coaching, and a final performance report built for real training sessions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="border border-white/10 bg-white/[0.03]" onClick={resetSession}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="button" className="shadow-none" onClick={endSession}>
              <Save className="h-4 w-4" />
              End session
            </Button>
          </div>
        </header>

        {error ? <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 ring-1 ring-red-400/20">{error}</div> : null}

        <ExerciseSelector selectedExercise={selectedExercise} onChange={setSelectedExercise} />

        {workoutState?.manualSelectionRecommended ? (
          <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 ring-1 ring-amber-400/20">
            Auto-detect confidence is low. Select an exercise manually for more accurate rep counting.
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <div className="grid gap-5">
            <div className={cn(panelClass, "overflow-hidden p-4")}>
              <PoseCameraPreview
                autoDetect={selectedExercise === "general"}
                selectedExercise={selectedExercise}
                formFeedback
                enablePoseDetection
                sessionResetKey={resetKey}
                showHeader={false}
                showTrackingStatus={false}
                feedbackMode="hidden"
                controlsMode="minimal"
                cameraFrameClassName="aspect-video min-h-[320px] max-h-[520px]"
                onCameraActiveChange={handleCameraActiveChange}
                onWorkoutAnalysis={handleWorkoutAnalysis}
                className="!rounded-[24px] !border-white/10 !bg-[#090909] !p-0 !shadow-none"
              />
            </div>

            <section className={cn(panelClass, "p-5")}>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                <Move3D className="h-4 w-4" />
                Rep timeline
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {liveRepEvents.length ? liveRepEvents.map(repBadge) : <p className="text-sm text-white/55">No advanced tracking data yet. Start moving or select an exercise.</p>}
              </div>
            </section>
          </div>

          <aside className="grid gap-5">
            <section className={cn(panelClass, "p-5")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--fc-accent-strong)]">Live stats</p>
                  <h2 className="mt-2 text-2xl font-black">{activeExercise === "general" ? "Awaiting movement" : EXERCISE_LABELS[activeExercise]}</h2>
                </div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/72">
                  {workoutState?.currentRepPhase || "ready"}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {metricValue("Selected exercise", selectedExercise === "general" ? "Auto detect" : EXERCISE_LABELS[selectedExercise])}
                {metricValue("Detected exercise", workoutState?.detectedExercise === "general" ? "Unknown" : workoutState?.detectedLabel || "Unknown")}
                {metricValue("Reps", activeExercise === "plank" ? formatDuration(activeTotal.hold_seconds || 0) : workoutState?.totalReps || 0, true)}
                {metricValue("Form score", `${Math.round(workoutState?.averageFormScore || workoutState?.score || 0)}/100`)}
                {metricValue("Confidence", `${workoutState?.confidence || 0}%`)}
                {metricValue("Current phase", String(workoutState?.phase || "unknown"))}
                {metricValue("Session timer", formatDuration(durationSeconds))}
                <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/42">Coach cue</p>
                  <p className="mt-2 text-sm font-black leading-6 text-white">{liveCue}</p>
                </div>
              </div>
            </section>

            <section className={cn(panelClass, "p-5")}>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                <Timer className="h-4 w-4" />
                Session details
              </div>
              <div className="mt-4 grid gap-3">
                {metricValue("Total reps", workoutState?.totalReps || 0)}
                {metricValue("Valid vs invalid", `${workoutState?.validReps || 0} / ${workoutState?.invalidReps || 0}`)}
                {metricValue("Partial reps", workoutState?.partialReps || 0)}
                {metricValue("Plank duration", formatDuration(workoutState?.plankDuration || 0))}
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <section className={cn(panelClass, "p-5")}>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
              <TrendingUp className="h-4 w-4" />
              Advanced tracking
            </div>
            {workoutState ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {metricValue("Visible joints", workoutState.visibleJoints.length)}
                {metricValue("Tracking confidence", `${Math.round(Number(advancedMetrics.tracking_confidence || 0))}%`)}
                {metricValue("Current rep phase", String(workoutState.currentRepPhase))}
                {metricValue("ROM percentage", `${Math.round(Number(advancedMetrics.rom_progress || 0))}%`)}
                {metricValue("Joint angles", `${Math.round(Number(advancedMetrics.knee_angle || advancedMetrics.elbow_angle || 0))} deg`)}
                {metricValue("Average tempo", advancedMetrics.average_tempo_ms ? `${Math.round(Number(advancedMetrics.average_tempo_ms))} ms` : "No data")}
                {metricValue("Last rep timestamp", advancedMetrics.last_rep_timestamp ? new Date(Number(advancedMetrics.last_rep_timestamp)).toLocaleTimeString() : "No rep yet")}
                {metricValue("Warnings", workoutState.warnings.length ? workoutState.warnings.map(issueLabel).join(", ") : "None")}
                {metricValue("Missing joints", workoutState.missingJoints.length ? workoutState.missingJoints.join(", ") : "None")}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/55">No advanced tracking data yet. Start moving or select an exercise.</p>
            )}
          </section>

          <section className={cn(panelClass, "p-5")}>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
              <Brain className="h-4 w-4" />
              Live coaching
            </div>
            <div className="mt-4 grid gap-2">
              {workoutState?.coachCues?.length ? workoutState.coachCues.slice(0, 6).map((cue) => (
                <div key={cue} className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-semibold leading-6 text-white/72">
                  {cue}
                </div>
              )) : <p className="text-sm text-white/55">Move into frame or select an exercise.</p>}
            </div>
          </section>
        </section>

        <section ref={historySectionRef} className={cn(panelClass, "p-5")}>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
            <Clock className="h-4 w-4" />
            Saved history
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {historyCards.length ? historyCards.slice(0, 6).map((item) => {
              const session = item.final_session_result as FinalSessionResult;
              return (
                <div key={item.id} className="rounded-2xl bg-white/[0.04] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">{session.bestExercise}</p>
                    <p className="text-xs font-black text-white/45">{new Date(item.completed_at || item.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{formatDuration(session.duration)} - {session.totalReps} reps - {Math.round(session.formScore)}/100</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/65">{session.feedbackSummary}</p>
                </div>
              );
            }) : <p className="text-sm text-white/55">No saved final reports yet.</p>}
          </div>
        </section>

        <div className="flex items-start gap-2 pb-4 text-xs leading-5 text-white/40">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Coaching cues are movement-specific and non-medical. Stop if you feel pain, dizziness, or instability.</p>
        </div>
      </div>
    </div>
  );
}
