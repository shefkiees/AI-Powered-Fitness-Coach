"use client";

import { TrendingUp } from "lucide-react";
import { formatMetricValue } from "@/lib/pose/poseSessionSummary";

const DEFAULT_METRIC_KEYS = [
  "knee_angle",
  "elbow_angle",
  "body_angle",
  "ankle_width_ratio",
  "hip_offset",
  "visible_keypoints",
];

export type PoseLiveMetricsProps = {
  metrics?: Record<string, number>;
  metricKeys?: string[];
};

export function PoseLiveMetrics({ metrics, metricKeys = DEFAULT_METRIC_KEYS }: PoseLiveMetricsProps) {
  return (
    <div className="fc-glass rounded-[1.75rem] p-5">
      <div className="flex items-center gap-2 text-[var(--fc-accent)]">
        <TrendingUp className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em]">Live metrics</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {metricKeys.map((key) => {
          const value = metrics?.[key];
          return (
            <div
              key={key}
              className="rounded-xl border border-[var(--fc-border)] bg-black/20 px-3 py-2"
            >
              <p className="text-[11px] font-bold capitalize text-[var(--fc-muted)]">
                {key.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {typeof value === "number" ? formatMetricValue(key, value) : "--"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
