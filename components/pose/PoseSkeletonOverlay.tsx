"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { drawPoseOnCanvas, type PoseKeypoint } from "@/lib/pose/drawPose";

export type PoseSkeletonOverlayHandle = {
  draw: (video: HTMLVideoElement, keypoints: PoseKeypoint[]) => void;
  clear: () => void;
};

export const PoseSkeletonOverlay = forwardRef<PoseSkeletonOverlayHandle>(function PoseSkeletonOverlay(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    draw(video, keypoints) {
      if (!canvasRef.current) return;
      drawPoseOnCanvas(canvasRef.current, video, keypoints);
    },
    clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      aria-hidden
      style={{ transform: "scaleX(-1)" }}
    />
  );
});
