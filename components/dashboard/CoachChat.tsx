"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, RefreshCw, Send } from "lucide-react";
import { BrandMark } from "@/components/brand/Brand";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getTextFieldClassName } from "@/components/ui/textFieldStyles";
import { cn } from "@/lib/cn";
import { CoachMessage } from "@/components/dashboard/CoachMessage";
import { useCoachingSession } from "@/hooks/useCoachingSession";

type Msg = { role: "user" | "assistant"; text: string };

const QUICK_PROMPTS = [
  {
    label: "Weekly plan",
    message:
      "Generate a personalized workout plan for this week based on my profile. Keep it short, structured, and practical.",
  },
  {
    label: "Progress check",
    message:
      "Help me review my last week of training and give me 3 useful things to track next.",
  },
  {
    label: "Need motivation",
    message:
      "Give me a short motivation reset, one mindset shift, and one small win I can do right now.",
  },
] as const;

type Props = {
  coachDisplayName?: string | null;
  userId?: string;
  onActivity?: () => void;
};

export function CoachChat({ coachDisplayName, userId, onActivity }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const { sessionStartedAt, resetSession } = useCoachingSession();

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || inFlightRef.current) return;

      inFlightRef.current = true;
      setError("");
      setInput("");
      setMessages((current) => [...current, { role: "user", text: trimmed }]);
      setLoading(true);

      if (userId) onActivity?.();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
        };

        if (!response.ok) {
          setMessages((current) => current.slice(0, -1));
          setError(
            data.error ??
              (response.status === 429
                ? "Coach is getting too many requests right now. Try again in a moment."
                : "Something went wrong."),
          );
          return;
        }

        const replyText =
          typeof data.reply === "string" && data.reply.trim() !== ""
            ? data.reply
            : null;

        if (replyText) {
          setMessages((current) => [
            ...current,
            { role: "assistant", text: replyText },
          ]);
        }
      } catch {
        setMessages((current) => current.slice(0, -1));
        setError("Network error. Try again.");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [onActivity, userId],
  );

  const send = useCallback(() => void sendText(input), [input, sendText]);

  const sessionLabel = sessionStartedAt
    ? new Date(sessionStartedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="flex h-full min-h-[420px] flex-col overflow-hidden border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(247,243,231,0.98)_100%)] p-0 shadow-[0_18px_34px_rgba(0,0,0,0.08)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/8 px-4 py-4">
        <BrandMark tileClassName="h-10 w-10 rounded-xl border-black/8 bg-[#111214]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#17181b]">AI coach</p>
          <p className="truncate text-xs text-[#677150]">
            {coachDisplayName
              ? `Session for ${coachDisplayName}`
              : "Session-based coaching"}
            {sessionLabel ? ` - started ${sessionLabel}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-black/8 bg-[#f7f3e7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#677150]">
          Ready
        </span>
        <button
          type="button"
          onClick={() => {
            resetSession();
            setMessages([]);
            setError("");
          }}
          className="rounded-xl p-2 text-[#677150] transition hover:bg-black/[0.04] hover:text-[#17181b]"
          title="Start a fresh coaching session"
          aria-label="Start a fresh coaching session"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="shrink-0 space-y-2 border-b border-black/8 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#677150]">
          Quick prompts
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              disabled={loading}
              onClick={() => void sendText(prompt.message)}
              className="rounded-2xl border border-black/8 bg-white/74 px-3 py-3 text-left text-xs font-medium text-[#2c2e29] transition hover:border-black/12 hover:bg-white disabled:opacity-50"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white">
              <MessageSquare className="h-5 w-5 text-[var(--fc-accent)]" />
            </span>
            <div className="max-w-xs space-y-2">
              <p className="text-sm font-medium text-[#17181b]">
                Ask for a plan, a reset, or a smarter next step.
              </p>
              <p className="text-xs leading-6 text-[#677150]">
                Keep the conversation practical and focused. This works best for
                daily coaching and quick decisions.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}-${message.text.slice(0, 12)}`}
            className={cn(
              "flex w-full",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[85%]",
                message.role === "user"
                  ? "rounded-br-xl bg-[var(--fc-accent)] text-slate-950"
                  : "rounded-bl-xl border border-black/8 bg-white/74 text-[#17181b]",
              )}
            >
              {message.role === "assistant" ? (
                <CoachMessage text={message.text} />
              ) : (
                <p className="text-sm font-medium leading-7">{message.text}</p>
              )}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-3xl rounded-bl-xl border border-black/8 bg-white/74 px-4 py-3 text-xs text-[#677150]">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--fc-accent)] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--fc-accent)] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--fc-accent)]" />
              </span>
              Coach is thinking...
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 border-t border-red-500/20 bg-red-950/20 px-4 py-2 text-center text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="shrink-0 border-t border-black/8 bg-white/46 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="Ask your coach..."
            className={getTextFieldClassName({
              className:
                "min-w-0 flex-1 border-black/10 bg-white text-[#17181b] placeholder:text-[#7a8067] focus:bg-white",
            })}
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
