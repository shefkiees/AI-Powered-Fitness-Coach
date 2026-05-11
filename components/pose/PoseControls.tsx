"use client";

import { Camera, CameraOff, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type PoseControlsProps = {
  active?: boolean;
  cameraStarting?: boolean;
  embedded?: boolean;
  saving?: boolean;
  showCameraControls?: boolean;
  showSessionControls?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onSave?: () => void;
};

export function PoseControls({
  active = false,
  cameraStarting = false,
  embedded = false,
  saving = false,
  showCameraControls = false,
  showSessionControls = false,
  onStart,
  onStop,
  onReset,
  onSave,
}: PoseControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {showCameraControls ? (
        !active ? (
          <Button
            type="button"
            className={cn(
              embedded ? "px-4 py-2 text-xs" : "",
              "focus-visible:ring-2 focus-visible:ring-[var(--fc-accent)]/40",
            )}
            disabled={cameraStarting}
            onClick={onStart}
          >
            <Camera className="h-4 w-4" />
            {cameraStarting ? "Starting..." : embedded ? "Start camera" : "Start camera and tracking"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            className={embedded ? "px-4 py-2 text-xs" : ""}
            onClick={onStop}
          >
            <CameraOff className="h-4 w-4" />
            Stop
          </Button>
        )
      ) : null}

      {showSessionControls ? (
        <>
          <Button type="button" variant="ghost" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            Reset session
          </Button>
          <Button type="button" onClick={onSave} loading={saving} disabled={saving}>
            <Save className="h-4 w-4" />
            End and save
          </Button>
        </>
      ) : null}
    </div>
  );
}
