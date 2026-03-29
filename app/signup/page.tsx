"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, UserPlus, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchFitnessProfile } from "@/lib/fitnessProfiles";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: authError, session } = await signUp(
        email,
        password,
        name.trim() || undefined,
      );
      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }
      if (session?.user) {
        router.replace("/");
        return;
      }
      router.replace("/login?registered=1");
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
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-400 transition hover:text-teal-300"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/90 to-teal-500 shadow-lg shadow-violet-900/40"
        >
          <UserPlus className="h-7 w-7 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Join in seconds—your profile and workouts stay private in Supabase.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
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

        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Alex"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={User}
          className="border-slate-600/80 bg-slate-950/60"
        />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={Mail}
          className="border-slate-600/80 bg-slate-950/60"
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-slate-600/80 bg-slate-950/60"
        />

        <Button
          type="submit"
          className="mt-2 w-full py-3.5 text-base shadow-lg shadow-teal-900/30"
          loading={submitting}
        >
          Sign up
        </Button>
      </form>
    </AuthShell>
  );
}
