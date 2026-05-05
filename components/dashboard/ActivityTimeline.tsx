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
    <Card className="border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,243,231,0.98)_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.08)]">
      <SectionHeader
        eyebrow="Today"
        title="Activity timeline"
        description="Moments you log on this device appear here and act like a lightweight training journal."
        eyebrowClassName="text-[#677150]"
        titleClassName="text-[#17181b]"
        descriptionClassName="text-[#5d654f]"
      />
      <ul className="mt-6 space-y-0">
        {display.map((event, index) => {
          const Icon = toneIcon(event.tone);
          const last = index === display.length - 1;
          return (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8 bg-white",
                    event.tone === "workout" && "text-[var(--fc-accent)]",
                    event.tone === "coach" && "text-sky-400",
                    event.tone === "milestone" && "text-amber-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!last ? (
                  <span
                    className="mt-1 min-h-[24px] w-px flex-1 bg-black/8"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn("pb-6", last && "pb-0")}>
                <p className="text-sm font-medium text-[#17181b]">{event.label}</p>
                <p className="mt-1 text-xs text-[#677150]">{formatTime(event.at)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
