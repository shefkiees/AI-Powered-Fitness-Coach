"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Msg = { role: "user" | "assistant"; text: string };

export function CoachChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError("");
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
  }, [input, loading]);

  return (
    <Card className="flex h-full min-h-[420px] flex-col overflow-hidden border-lime-500/15 bg-gradient-to-b from-slate-900/90 to-slate-950/95 shadow-lg shadow-black/20">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-800/90 px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 text-slate-950 shadow-md shadow-lime-900/40">
          <Bot className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">AI Coach</p>
          <p className="truncate text-xs text-slate-500">
            Workout & nutrition tips · not medical advice
          </p>
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-teal-500/50" />
      </div>

      <div
        ref={scrollRef}
        className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="max-w-[240px] text-sm leading-relaxed text-slate-500">
              Ask anything about training, recovery, or healthy habits. I&apos;ll
              keep answers short and practical.
            </p>
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
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[85%]",
                m.role === "user"
                  ? "rounded-br-md bg-gradient-to-br from-lime-600 to-emerald-700 text-white"
                  : "rounded-bl-md border border-slate-700/70 bg-slate-900/80 text-slate-200",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-xs text-slate-500">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-400 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-400 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-400" />
              </span>
              Coach is typing…
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
            placeholder="Message your coach…"
            className="min-w-0 flex-1 rounded-xl border border-slate-700/90 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-lime-500/50 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
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
