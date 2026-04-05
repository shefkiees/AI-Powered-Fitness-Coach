"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE = "afc_coach_session";

type SessionInfo = {
  id: string;
  startedAt: string;
};

function readSession(): SessionInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return null;
    return JSON.parse(raw) as SessionInfo;
  } catch {
    return null;
  }
}

function writeSession(s: SessionInfo) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function useCoachingSession() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    let s = readSession();
    if (!s) {
      s = {
        id: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
      };
      writeSession(s);
    }
    startTransition(() => setSession(s));
  }, []);

  const resetSession = useCallback(() => {
    const next: SessionInfo = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
    };
    writeSession(next);
    setSession(next);
  }, []);

  return useMemo(
    () => ({
      sessionId: session?.id ?? null,
      sessionStartedAt: session?.startedAt ?? null,
      resetSession,
    }),
    [session, resetSession],
  );
}
