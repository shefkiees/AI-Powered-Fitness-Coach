"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ShieldAlert, Sparkles } from "lucide-react";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getPoseHistory, savePoseSession } from "@/src/utils/supabaseData";

type PoseHistoryRow = {
  id: string;
  exercise_name: string;
  reps: number;
  score: number;
  summary?: string | null;
  completed_at?: string | null;
  created_at: string;
};

export function PoseWorkoutScreen() {
  const [enableLivePose, setEnableLivePose] = useState(false);
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(82);
  const [history, setHistory] = useState<PoseHistoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<string[]>([
    "Start the camera and keep your full body in frame.",
    "Use smooth reps so the form check can read your movement.",
  ]);
  const tickRef = useRef<number | null>(null);

  const pushFeedback = useCallback((line: string) => {
    setFeedback((prev) => (prev[0] === line ? prev : [line, ...prev].slice(0, 5)));
  }, []);

  const handleFormAnalysis = useCallback(
    (analysis: { status: string; headline: string; tips: string[] }) => {
      const nextScore =
        analysis.status === "good" ? 92 : analysis.status === "adjust" ? 74 : 58;
      setFormScore((current) => Math.round(current * 0.7 + nextScore * 0.3));
      pushFeedback([analysis.headline, ...analysis.tips].join(" - "));
    },
    [pushFeedback],
  );

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

  useEffect(() => {
    if (!enableLivePose) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        setFormScore((s) => Math.min(98, Math.max(62, s + (Math.random() > 0.5 ? 1 : -1))));
      }, 2200);
      return () => {
        if (tickRef.current) window.clearInterval(tickRef.current);
      };
    }
    if (tickRef.current) window.clearInterval(tickRef.current);
    return undefined;
  }, [enableLivePose]);

  const logRep = () => {
    setReps((r) => r + 1);
    const cues = [
      "Great form - control the lowering phase.",
      "Keep your back straight.",
      "Go lower on the squat.",
      "Stack knees over toes.",
      "Brace before each rep.",
    ];
    pushFeedback(cues[Math.floor(Math.random() * cues.length)] ?? "Great form");
  };

  const saveSession = async () => {
    setSaving(true);
    setError("");
    try {
      await savePoseSession({
        exercise_name: "Movement check",
        reps,
        score: formScore,
        cues: feedback,
        summary:
          formScore >= 85
            ? "Strong form quality. Keep the same tempo next session."
            : "Useful movement check. Focus on the latest cues before adding intensity.",
      });
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="pulse-kicker">Pose lab</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Camera session with live form cues.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--fc-muted)]">
          Track reps, form score, and coaching cues. Saved sessions create a form history for the athlete.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="fc-glass overflow-hidden rounded-[1.75rem] ring-1 ring-white/[0.05]">
            <PoseCameraPreview
              formFeedback={enableLivePose}
              enablePoseDetection={enableLivePose}
              onFormAnalysis={handleFormAnalysis}
              className="border-none bg-black/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={enableLivePose ? "primary" : "secondary"}
              onClick={() => setEnableLivePose((v) => !v)}
            >
              <Sparkles className="h-4 w-4" />
              {enableLivePose ? "Live form check on" : "Enable live form check"}
            </Button>
            <Button type="button" variant="secondary" onClick={logRep}>
              Log rep + cue
            </Button>
            <Button type="button" onClick={saveSession} loading={saving} disabled={saving || reps === 0}>
              Save form session
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="fc-glass rounded-[1.75rem] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-muted)]">Session</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--fc-border)] bg-black/25 p-4">
                <p className="text-xs text-[var(--fc-muted)]">Rep counter</p>
                <p className="mt-2 text-4xl font-black text-[var(--fc-accent-strong)]">{reps}</p>
              </div>
              <div className="rounded-2xl border border-[var(--fc-border)] bg-black/25 p-4">
                <p className="text-xs text-[var(--fc-muted)]">Form score</p>
                <p className="mt-2 text-4xl font-black text-white">{formScore}</p>
              </div>
            </div>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-6">
            <div className="flex items-center gap-2 text-[var(--fc-accent)]">
              <Camera className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Coach feedback</p>
            </div>
            <ul className="mt-4 space-y-3">
              {feedback.map((line, idx) => (
                <li
                  key={`${idx}-${line.slice(0, 24)}`}
                  className={cn(
                    "rounded-xl border border-[var(--fc-border)] bg-black/20 px-4 py-3 text-sm text-[var(--fc-muted)]",
                    line.toLowerCase().includes("great") && "border-emerald-500/25 text-emerald-100",
                  )}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 rounded-[1.25rem] border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>
              General movement cues only - not a medical device. Stop if you feel sharp pain, dizziness, or
              instability.
            </p>
          </div>

          <div className="fc-glass rounded-[1.75rem] p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--fc-muted)]">Form history</p>
            <div className="mt-4 space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--fc-border)] bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.exercise_name}</p>
                    <span className="rounded-full bg-[var(--fc-accent)]/12 px-3 py-1 text-xs font-black text-[var(--fc-accent)]">
                      {item.score}/100
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--fc-muted)]">
                    {item.reps} reps - {new Date(item.completed_at || item.created_at).toLocaleDateString()}
                  </p>
                  {item.summary ? <p className="mt-2 text-sm text-[var(--fc-muted)]">{item.summary}</p> : null}
                </div>
              ))}
              {history.length === 0 ? (
                <p className="text-sm text-[var(--fc-muted)]">No saved pose sessions yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
