"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigError } from "@/src/lib/supabaseClient";

type AuthResult = {
  error: AuthError | null;
  session: Session | null;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthError(error: unknown, fallback = "Authentication failed.") {
  if (error && typeof error === "object" && "message" in error) {
    return error as AuthError;
  }

  return {
    name: "AuthenticationError",
    message: error instanceof Error ? error.message : fallback,
  } as AuthError;
}

async function getActiveSession() {
  if (!supabase) {
    return {
      error: {
        name: "SupabaseConfigurationError",
        message: supabaseConfigError,
      } as AuthError,
      session: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    return { error, session: data.session ?? null };
  } catch (error) {
    return { error: toAuthError(error, "Could not read Supabase session."), session: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let cancelled = false;

    void getActiveSession().then(({ session }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!supabase) {
        return {
          error: {
            name: "SupabaseConfigurationError",
            message: supabaseConfigError,
          } as AuthError,
          session: null,
        };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            ...(displayName ? { data: { full_name: displayName } } : {}),
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback?next=/dashboard`
                : undefined,
          },
        });

        if (error) return { error, session: null };
        if (!data.session) return { error: null, session: null };

        const current = await getActiveSession();
        return { error: current.error, session: current.session ?? data.session };
      } catch (error) {
        return { error: toAuthError(error), session: null };
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return {
        error: {
          name: "SupabaseConfigurationError",
          message: supabaseConfigError,
        } as AuthError,
        session: null,
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error, session: null };

      const current = await getActiveSession();
      return { error: current.error, session: current.session ?? data.session ?? null };
    } catch (error) {
      return { error: toAuthError(error), session: null };
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    if (!supabase) {
      return {
        error: {
          name: "SupabaseConfigurationError",
          message: supabaseConfigError,
        } as AuthError,
      };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=/dashboard`
              : undefined,
        },
      });
      return { error };
    } catch (error) {
      return { error: toAuthError(error, "Could not resend confirmation email.") };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, resendConfirmation, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
