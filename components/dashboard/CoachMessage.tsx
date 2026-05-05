"use client";

import { Fragment } from "react";
import { cn } from "@/lib/cn";

function segmentLine(text: string, keyBase: string) {
  const boldParts = text.split(/\*\*(.+?)\*\*/g);
  return boldParts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyBase}-b-${i}`} className="font-semibold text-[#17181b]">
        {part}
      </strong>
    ) : (
      <Fragment key={`${keyBase}-t-${i}`}>{part}</Fragment>
    ),
  );
}

export function CoachMessage({ text, className }: { text: string; className?: string }) {
  const lines = text.split(/\n/);
  return (
    <div className={cn("space-y-2 text-sm leading-relaxed text-[#2b2e25]", className)}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (/^#{1,3}\s/.test(trimmed)) {
          const level = trimmed.match(/^#+/)?.[0].length ?? 1;
          const content = trimmed.replace(/^#{1,3}\s*/, "");
          const Tag = level <= 1 ? "h4" : "h5";
          return (
            <Tag
              key={i}
              className={cn(
                "font-bold text-[#17181b]",
                level <= 1 ? "text-[15px] mt-1" : "text-sm mt-0.5",
              )}
            >
              {segmentLine(content, `h-${i}`)}
            </Tag>
          );
        }
        if (/^[-•*]\s/.test(trimmed)) {
          const content = trimmed.replace(/^[-•*]\s*/, "");
          return (
            <div key={i} className="flex gap-2 pl-0.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--fc-accent)]" />
              <span>{segmentLine(content, `li-${i}`)}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, "");
          return (
            <div key={i} className="flex gap-2">
              <span className="w-5 shrink-0 text-right text-xs font-semibold text-[#6a734d]">
                {trimmed.match(/^\d+/)?.[0]}.
              </span>
              <span>{segmentLine(content, `ol-${i}`)}</span>
            </div>
          );
        }
        return <p key={i}>{segmentLine(trimmed, `p-${i}`)}</p>;
      })}
    </div>
  );
}
