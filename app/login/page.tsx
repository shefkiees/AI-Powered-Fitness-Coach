"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchFitnessProfile } from "@/lib/fitnessProfiles";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const registered = searchParams.get("registered");

  const { signIn, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    void (async () => {
      const { data } = await fetchFitnessProfile(user.id);
      router.replace(data ? "/dashboard" : "/onboarding");
    })();
  }, [user, authLoading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      footer={
        <p>
          No account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-lime-400 transition hover:text-lime-300"
          >
            Create one free
          </Link>
        </p>
      }
    >
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 shadow-lg shadow-lime-900/40"
        >
          <LogIn className="h-7 w-7 text-slate-950" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.85rem]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[0.9375rem]">
          Sign in to your dashboard, workout plan, and AI coach.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {registered ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden rounded-2xl border border-lime-500/35 bg-lime-500/10 px-4 py-3 text-sm text-lime-100"
          >
            Account created. Confirm your email if prompted, then sign in.
          </motion.div>
        ) : null}
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            {error}
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Input
            label="Email"
            type="email"
            name="email"
            id="login-email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={Mail}
            className="border-slate-600/80 bg-slate-950/60 focus:ring-lime-500/40"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PasswordInput
            label="Password"
            name="password"
            id="login-password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-slate-600/80 bg-slate-950/60 focus:ring-lime-500/40"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            type="submit"
            className="mt-1 w-full py-3.5 text-base shadow-lg shadow-lime-900/25"
            loading={submitting}
          >
            Sign in
          </Button>
        </motion.div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-slate-400">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-lime-500/30 border-t-lime-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
