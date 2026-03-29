/** Minimal keypoint shape (matches MoveNet output; no TF imports for bundler safety). */
export type PoseKeypoint = {
  x: number;
  y: number;
  score?: number;
};

/** MoveNet Lightning adjacent keypoint pairs (indices) */
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [5, 11],
  [6, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
];

const SCORE_MIN = 0.25;

export function drawPoseOnCanvas(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  keypoints: PoseKeypoint[],
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = video.getBoundingClientRect();
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const sx = rect.width / vw;
  const sy = rect.height / vh;

  const map = (kp: PoseKeypoint) => ({
    x: kp.x * sx,
    y: kp.y * sy,
    score: kp.score ?? 0,
  });

  const pts = keypoints.map(map);

  ctx.strokeStyle = "rgba(163, 230, 53, 0.95)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (const [a, b] of EDGES) {
    const pa = pts[a];
    const pb = pts[b];
    if (!pa || !pb) continue;
    if (pa.score < SCORE_MIN || pb.score < SCORE_MIN) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(217, 249, 157, 0.95)";
  for (const p of pts) {
    if (p.score < SCORE_MIN) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
