"use client";

import { useId } from "react";

export default function HexBackground({ opacity = 0.03 }: { opacity?: number }) {
  const patternId = useId().replace(/:/g, "");

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0H120V120H0Z"
              fill="none"
              stroke="rgba(129,140,248,0.08)"
              strokeWidth="1"
            />
            <path
              d="M24 24H60V60H96V96"
              fill="none"
              stroke="rgba(192,132,252,0.14)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M96 24H72V48H48V72H24"
              fill="none"
              stroke="rgba(129,140,248,0.1)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="24" r="3" fill="rgba(248,250,252,0.08)" />
            <circle cx="96" cy="24" r="3" fill="rgba(168,85,247,0.1)" />
            <circle cx="96" cy="96" r="3" fill="rgba(129,140,248,0.1)" />
            <circle cx="24" cy="72" r="2.5" fill="rgba(56,189,248,0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
