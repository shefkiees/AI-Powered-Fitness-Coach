"use client";

import { Activity, MessageCircle, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { TimelineEvent } from "@/lib/localFitnessState";
import { readTimeline } from "@/lib/localFitnessState";
import { cn } from "@/lib/cn";

function toneIcon(tone: TimelineEvent["tone"]) {
  switch (tone) {
    case "workout":
      return Activity;
    case "coach":
      return MessageCircle;
    case "milestone":
      return Trophy;
    default:
      return Activity;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

type Props = { userId: string; refreshKey?: number };

export function ActivityTimeline({ userId, refreshKey = 0 }: Props) {
  void refreshKey;
  const events = readTimeline(userId);

  const seed =
    events.length === 0
      ? [
          {
            id: "seed-1",
            label: "Opened your training hub",
            at: new Date().toISOString(),
            tone: "note" as const,
          },
        ]
      : events;

  const display = events.length === 0 ? seed : [...events].reverse();

  return (
    <Card className="border-slate-800/90 bg-slate-900/50">
      <SectionHeader
        eyebrow="Today"
        title="Activity timeline"
        description="Moments you log on this device appear here—use it as a lightweight training journal."
      />
      <ul className="mt-6 space-y-0">
        {display.map((ev, i) => {
          const Icon = toneIcon(ev.tone);
          const last = i === display.length - 1;
          return (
            <li key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80",
                    ev.tone === "workout" && "text-[var(--fc-accent)]",
                    ev.tone === "coach" && "text-sky-400",
                    ev.tone === "milestone" && "text-amber-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!last ? (
                  <span
                    className="mt-1 w-px flex-1 min-h-[24px] bg-slate-800"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn("pb-6", last && "pb-0")}>
                <p className="text-sm font-medium text-slate-100">{ev.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatTime(ev.at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
