"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, RefreshCw, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CoachMessage } from "@/components/dashboard/CoachMessage";
import { useCoachingSession } from "@/hooks/useCoachingSession";
import { pushTimelineEvent } from "@/lib/localFitnessState";

type Msg = { role: "user" | "assistant"; text: string };

const QUICK_PROMPTS = [
  {
    label: "Generate workout plan",
    message:
      "Generate a personalized workout plan for this week based on my profile. Use ### headings, bullet steps, and end with **Next step:** one action for today.",
  },
  {
    label: "Check my progress",
    message:
      "Help me check my training progress. Ask one quick question about my last week, then give 3 concrete signals to track (not medical) and a simple weekly review habit.",
  },
  {
    label: "Motivate me",
    message:
      "I'm in a slump. Give a short, motivating coach voice note style message (written), one mindset reframe, and a 5-minute win I can do right now.",
  },
] as const;

type Props = {
  coachDisplayName?: string | null;
  userId?: string;
};

export function CoachChat({ coachDisplayName, userId }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { sessionStartedAt, resetSession } = useCoachingSession();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError("");
      setInput("");
      setMessages((m) => [...m, { role: "user", text: trimmed }]);
      setLoading(true);
      if (userId) {
        pushTimelineEvent(userId, {
          label: "Messaged AI coach",
          tone: "coach",
        });
      }
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        if (!res.ok) {
          setMessages((m) => m.slice(0, -1));
          setError(data.error ?? "Something went wrong.");
          return;
        }
        const replyText =
          typeof data.reply === "string" && data.reply.trim() !== ""
            ? data.reply
            : null;
        if (replyText) {
          setMessages((m) => [...m, { role: "assistant", text: replyText }]);
        }
      } catch {
        setMessages((m) => m.slice(0, -1));
        setError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [loading, userId],
  );

  const send = useCallback(() => void sendText(input), [input, sendText]);

  const sessionLabel = sessionStartedAt
    ? new Date(sessionStartedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="flex h-full min-h-[420px] flex-col overflow-hidden border-[var(--fc-accent)]/15 bg-gradient-to-b from-slate-900/95 to-slate-950 shadow-lg shadow-black/25">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-800/90 px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--fc-accent)] to-[var(--fc-accent-2)] text-slate-950 shadow-md shadow-lime-900/40">
          <Bot className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-white sm:text-sm sm:normal-case sm:tracking-normal">
            AI FITNESS COACH
          </p>
          <p className="truncate text-xs text-slate-500">
            {coachDisplayName
              ? `Personal session for ${coachDisplayName}`
              : "Session-based coaching"}
            {" · "}
            not medical advice
            {sessionLabel ? ` · started ${sessionLabel}` : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              resetSession();
              setMessages([]);
              setError("");
            }}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800/80 hover:text-slate-300"
            title="Start a fresh coaching session"
            aria-label="Start a fresh coaching session"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Sparkles className="h-4 w-4 text-teal-500/50" aria-hidden />
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b border-slate-800/60 px-3 py-3">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Quick questions
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              type="button"
              disabled={loading}
              onClick={() => void sendText(q.message)}
              className="rounded-full border border-slate-700/90 bg-slate-950/60 px-3 py-1.5 text-left text-[11px] font-medium text-slate-300 transition hover:border-[var(--fc-accent)]/40 hover:text-white disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80">
              <MessageSquare className="h-6 w-6 text-[var(--fc-accent)]/70" />
            </span>
            <div className="max-w-[260px] space-y-2">
              <p className="text-sm font-medium text-slate-200">
                Hey{coachDisplayName ? `, ${coachDisplayName}` : ""}—I&apos;m here
                between sessions.
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                Tap a quick question or tell me how today felt. I&apos;ll answer
                like a real coach: short plan, clear cues, one next step.
              </p>
            </div>
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}-${m.text.slice(0, 12)}`}
            className={cn(
              "flex w-full",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[85%]",
                m.role === "user"
                  ? "rounded-br-md bg-gradient-to-br from-[var(--fc-accent)] to-[var(--fc-accent-2)] text-slate-950"
                  : "rounded-bl-md border border-slate-800/90 bg-slate-950/80",
              )}
            >
              {m.role === "assistant" ? (
                <CoachMessage text={m.text} />
              ) : (
                <p className="text-sm font-medium leading-relaxed">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-800/60 bg-slate-950/80 px-4 py-3 text-xs text-slate-500">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--fc-accent)] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--fc-accent)] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--fc-accent)]" />
              </span>
              Coach is thinking…
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 border-t border-red-500/25 bg-red-950/30 px-4 py-2 text-center text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="shrink-0 border-t border-slate-800/90 bg-slate-950/50 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Tell your coach what you need…"
            className="min-w-0 flex-1 rounded-xl border border-slate-800/90 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-[var(--fc-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--fc-accent)]/20"
            disabled={loading}
            aria-label="Message to coach"
          />
          <Button
            type="button"
            className="shrink-0 px-4"
            disabled={loading || !input.trim()}
            loading={loading}
            onClick={() => void send()}
            aria-label="Send message"
          >
            {!loading ? <Send className="h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </Card>
  );
}
