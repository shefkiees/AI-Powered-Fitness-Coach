"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoachChat } from "@/components/dashboard/CoachChat";
import { useAuth } from "@/context/AuthContext";

export default function DashboardChatPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--fc-muted)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to overview
      </Link>
      <div>
        <p className="pulse-kicker">AI coach</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Ask anything about training, recovery, or your plan.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--fc-muted)]">
          Replies are for general fitness education only — not medical advice. Connect your OpenAI
          key on the server to enable live answers.
        </p>
      </div>
      <CoachChat userId={user?.id} coachDisplayName="Pulse" />
    </div>
  );
}
