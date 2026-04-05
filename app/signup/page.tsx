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

const fieldContainer = {
  hidden: { opacity: 0, x: 18 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.14 + i * 0.055,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

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
            className="font-semibold text-[var(--fc-accent)] transition duration-300 hover:text-lime-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.06, type: "spring", stiffness: 260, damping: 22 }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-accent)] via-emerald-500 to-cyan-500 shadow-lg shadow-lime-900/40"
        >
          <UserPlus className="h-7 w-7 text-slate-950" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
          Start your journey
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Create your <span className="font-semibold text-slate-300">AI FITNESS COACH</span>{" "}
          account—quick setup, then we personalize your plan.
        </p>
      </motion.div>

      <motion.form
        onSubmit={onSubmit}
        className="space-y-5"
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
        }}
      >
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

        <motion.div custom={0} variants={fieldContainer}>
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            placeholder="How should we greet you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={User}
            className="border-slate-600/80 bg-slate-950/50 transition-colors duration-300 focus:border-cyan-500/50 focus:ring-cyan-500/30"
          />
        </motion.div>

        <motion.div custom={1} variants={fieldContainer}>
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
            className="border-slate-600/80 bg-slate-950/50 transition-colors duration-300 focus:border-cyan-500/50 focus:ring-cyan-500/30"
          />
        </motion.div>

        <motion.div custom={2} variants={fieldContainer}>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-slate-600/80 bg-slate-950/50 transition-colors duration-300 focus:border-cyan-500/50 focus:ring-cyan-500/30"
          />
        </motion.div>

        <motion.div custom={3} variants={fieldContainer}>
          <Button
            type="submit"
            className="mt-1 w-full py-3.5 text-base"
            loading={submitting}
          >
            Create account
          </Button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
