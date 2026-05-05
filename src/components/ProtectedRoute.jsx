"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import EmptyState from "@/src/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabaseConfigError } from "@/src/lib/supabaseClient";
import { ensureProfile, isProfileComplete } from "@/src/utils/supabaseData";

export default function ProtectedRoute({
  children,
  requireProfile = true,
  redirectIfProfile = false,
}) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setState("loading");
    setError("");
    try {
      const data = await ensureProfile(user);
      const profileComplete = isProfileComplete(data);
      setProfile(data);
      setState("ready");

      if (redirectIfProfile && profileComplete) {
        window.location.replace("/dashboard");
        return;
      }

      if (requireProfile && !profileComplete) {
        window.location.replace("/profile-setup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }, [redirectIfProfile, requireProfile, user]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = window.location.pathname + window.location.search;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    queueMicrotask(() => {
      void loadProfile();
    });
  }, [loadProfile, loading, user]);

  if (supabaseConfigError) {
    return (
      <div className="pulse-page min-h-screen p-4 text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center">
          <EmptyState title="Supabase configuration missing" description={supabaseConfigError} />
        </div>
      </div>
    );
  }

  if (loading || state === "loading" || !user) {
    return (
      <div className="pulse-page min-h-screen text-white">
        <LoadingSpinner label="Loading your secure workspace..." />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="pulse-page min-h-screen p-4 text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center">
          <EmptyState
            title="Could not load your profile"
            description={error}
            actionLabel="Retry"
            onAction={loadProfile}
          />
        </div>
      </div>
    );
  }

  if (requireProfile && !isProfileComplete(profile)) {
    return (
      <div className="pulse-page min-h-screen text-white">
        <LoadingSpinner label="Opening profile setup..." />
      </div>
    );
  }

  if (typeof children === "function") {
    return children({ user, profile, refreshProfile: loadProfile });
  }

  return children;
}
