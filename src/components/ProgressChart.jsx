"use client";

import { formatNumber } from "@/src/utils/formatters";

export default function ProgressChart({ logs }) {
  const points = (logs || [])
    .filter((log) => log.weight_kg !== null && log.weight_kg !== undefined)
    .slice(-10);

  if (points.length < 2) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[1.15rem] border border-dashed border-[#d1d5db] bg-[#f9fafb] p-6 text-center">
        <div>
          <p className="font-black text-[#111827]">Need 2 valid weight check-ins</p>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">
            Log two realistic weight values to show the trend line.
          </p>
        </div>
      </div>
    );
  }

  const values = points.map((point) => Number(point.weight_kg));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const width = 640;
  const height = 260;
  const padding = 28;

  const coords = points.map((point, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((Number(point.weight_kg) - min) / spread) * (height - padding * 2);
    return { x, y, point };
  });

  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");

  const areaPath = `${path} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${
    height - padding
  } Z`;

  return (
    <div className="rounded-[1.15rem] border border-[#e5e7eb] bg-[#f8fafc] p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7280]">
            Weight trend
          </p>
          <p className="mt-2 text-2xl font-black text-[#111827]">
            {formatNumber(values[values.length - 1], " kg")}
          </p>
        </div>
        <p className="text-sm text-[#6b7280]">
          Range {formatNumber(min, " kg")} - {formatNumber(max, " kg")}
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full overflow-visible">
        <defs>
          <linearGradient id="progressArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b8f53d" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#b8f53d" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5e7eb" />;
        })}
        <path d={areaPath} fill="url(#progressArea)" />
        <path d={path} fill="none" stroke="#b8f53d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((coord) => (
          <circle key={coord.point.id} cx={coord.x} cy={coord.y} r="5" fill="#ffffff" stroke="#22c55e" strokeWidth="3" />
        ))}
      </svg>
    </div>
  );
}
