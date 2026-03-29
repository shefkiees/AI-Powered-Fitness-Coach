"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PoseCameraPreview } from "@/components/pose/PoseCameraLazy";

export default function PoseEstimationPage() {
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <div className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-lime-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400/90">
            AI Fitness Coach
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Pose estimation</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Stand in front of the camera and follow your exercises. This screen
            sets up the webcam; a pose model (for example MediaPipe or
            TensorFlow.js) can be wired to the overlay layer later.
          </p>
        </div>

        <PoseCameraPreview />

        <Card className="border-slate-700/60">
          <h2 className="font-semibold text-white">How to use</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-400">
            <li>Find good lighting and step back so your full body is visible.</li>
            <li>Use a stable phone or laptop; avoid pointing the camera at mirrors.</li>
            <li>Wear fitted clothing so joints are easier for a future model to track.</li>
            <li>The skeleton updates every frame; if it lags, try a smaller browser window.</li>
          </ol>
        </Card>
      </main>
    </div>
  );
}
