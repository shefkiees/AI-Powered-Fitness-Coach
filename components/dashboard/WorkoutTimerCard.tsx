"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";

const PRESETS_SEC = [5 * 60, 10 * 60, 15 * 60, 20 * 60];

function formatMMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  onSessionComplete?: () => void;
  className?: string;
};

export function WorkoutTimerCard({ onSessionComplete, className }: Props) {
  const [durationSec, setDurationSec] = useState(PRESETS_SEC[1]);
  const [remaining, setRemaining] = useState(PRESETS_SEC[1]);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      clearTick();
      return;
    }
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearTick();
          setRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            onSessionComplete?.();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return clearTick;
  }, [running, clearTick, onSessionComplete]);

  const reset = useCallback(() => {
    completedRef.current = false;
    setRunning(false);
    clearTick();
    setRemaining(durationSec);
  }, [durationSec, clearTick]);

  const pickPreset = (sec: number) => {
    completedRef.current = false;
    setRunning(false);
    clearTick();
    setDurationSec(sec);
    setRemaining(sec);
  };

  const pct =
    durationSec > 0 ? Math.round((remaining / durationSec) * 100) : 0;

  return (
    <Card
      className={cn(
        "border-slate-800/90 bg-slate-900/50 shadow-xl shadow-black/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Session tools"
          title="Workout timer"
          description="Set a work block for intervals, planks, or rest. Audio-free—stay present."
        />
        <Timer className="h-8 w-8 shrink-0 text-[var(--fc-accent)]/60" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS_SEC.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => pickPreset(sec)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              durationSec === sec
                ? "border-[var(--fc-accent)]/50 bg-[var(--fc-accent)]/10 text-lime-100"
                : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200",
            )}
          >
            {sec / 60} min
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div
          className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950/80 shadow-inner"
          style={{
            background: `conic-gradient(var(--fc-accent) ${pct * 3.6}deg, rgba(30,41,59,0.9) 0deg)`,
          }}
        >
          <div className="flex h-[calc(100%-16px)] w-[calc(100%-16px)] flex-col items-center justify-center rounded-full bg-slate-950">
            <span className="font-mono text-3xl font-bold tabular-nums text-white">
              {formatMMSS(remaining)}
            </span>
            <span className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
              {running ? "Running" : "Ready"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="min-w-[120px] border-slate-700"
          onClick={() => {
            if (remaining === 0) reset();
            else setRunning((r) => !r);
          }}
        >
          {running ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />{" "}
              {remaining === 0 ? "Restart" : "Start"}
            </>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </Card>
  );
}
