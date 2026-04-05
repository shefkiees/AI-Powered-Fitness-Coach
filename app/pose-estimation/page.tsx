"use client";

import { FitnessAppShell } from "@/components/layout/FitnessAppShell";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function PoseEstimationPage() {
  return (
    <FitnessAppShell
      title="AI form check"
      subtitle="Live camera with MoveNet skeleton overlay and heuristic posture cues—not a medical device."
    >
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <PoseCameraPreview
            formFeedback
            enablePoseDetection
            className="border-white/10 bg-black/40"
          />
        </div>
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90">
              Status
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">How it works</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-[var(--fc-accent)]">1.</span>
                Allow camera access and stand 6–8 feet back.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--fc-accent)]">2.</span>
                Wait for the model to load—skeleton draws in green.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--fc-accent)]">3.</span>
                Read live cues: Good form (green), Adjust (amber), or framing tips.
              </li>
            </ul>
            <div className="mt-5">
              <ProgressBar value={100} label="Camera pipeline" showValue />
              <p className="mt-2 text-[11px] text-slate-600">
                Progress is illustrative; tracking quality depends on lighting and GPU.
              </p>
            </div>
          </Card>
          <Card className="border-amber-500/25 bg-amber-950/20 text-sm text-amber-100/90">
            <strong className="text-amber-200">Safety:</strong> stop if you feel
            pain, dizziness, or imbalance. This tool offers general movement cues
            only—not injury assessment.
          </Card>
        </div>
      </div>
    </FitnessAppShell>
  );
}
