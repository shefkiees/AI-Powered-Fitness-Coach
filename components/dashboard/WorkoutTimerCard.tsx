"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";

const PRESETS_SEC = [5 * 60, 10 * 60, 15 * 60, 20 * 60];

function formatMMSS(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
      setRemaining((value) => {
        if (value <= 1) {
          clearTick();
          setRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            onSessionComplete?.();
          }
          return 0;
        }
        return value - 1;
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

  const pickPreset = (seconds: number) => {
    completedRef.current = false;
    setRunning(false);
    clearTick();
    setDurationSec(seconds);
    setRemaining(seconds);
  };

  const progress =
    durationSec > 0 ? Math.round((remaining / durationSec) * 100) : 0;

  return (
    <Card
      className={cn(
        "border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,243,231,0.98)_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Session tools"
          title="Premium timer"
          description="Use it for focused blocks, intervals, recovery, or fast guided finishers."
          eyebrowClassName="text-[#677150]"
          titleClassName="text-[#17181b]"
          descriptionClassName="text-[#5d654f]"
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[#111214] text-[#ecfb94]">
          <Timer className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS_SEC.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => pickPreset(seconds)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] transition",
              durationSec === seconds
                ? "border-black/10 bg-[var(--fc-accent)] text-slate-950"
                : "border-black/10 bg-white/60 text-[#5f664f] hover:border-black/14 hover:text-[#17181b]",
            )}
          >
            {seconds / 60} min
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div
          className="relative flex h-44 w-44 items-center justify-center rounded-full border border-black/8 shadow-[inset_0_0_40px_rgba(0,0,0,0.04)]"
          style={{
            background: `conic-gradient(var(--fc-accent) ${progress * 3.6}deg, rgba(17,18,20,0.08) 0deg)`,
          }}
        >
          <div className="flex h-[calc(100%-18px)] w-[calc(100%-18px)] flex-col items-center justify-center rounded-full bg-[#f7f3e7]">
            <span className="font-mono text-4xl font-black tabular-nums text-[#17181b]">
              {formatMMSS(remaining)}
            </span>
            <span className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#6b7452]">
              {running ? "Running" : "Ready"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant={running ? "secondary" : "primary"}
          className={cn(
            "min-w-[130px]",
            running && "border-black/10 bg-white text-[#17181b] hover:bg-white",
          )}
          onClick={() => {
            if (running) {
              setRunning(false);
              return;
            }
            if (remaining === 0) reset();
            else setRunning(true);
          }}
        >
          {running ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> {remaining === 0 ? "Restart" : "Start"}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[#5f664f] hover:bg-black/[0.04] hover:text-[#17181b]"
          onClick={reset}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </Card>
  );
}
