"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";

/**
 * Maze grid: 0 = open passage, 1 = wall
 * 13×13 grid. The robot traverses only cells with value 0.
 */
const MAZE_GRID: number[][] = [
  //0  1  2  3  4  5  6  7  8  9 10 11 12
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], // 1
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 2
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], // 3
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1], // 4
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1], // 5
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1], // 6
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 7
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1], // 8
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], // 9
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1], // 10
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 11
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 12
];

const GRID_ROWS = MAZE_GRID.length;
const GRID_COLS = MAZE_GRID[0].length;

const START: [number, number] = [1, 1];
const END: [number, number] = [11, 11];

/**
 * BFS shortest-path: only open cells (0), cardinal directions only.
 */
function bfs(
  grid: number[][],
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );
  const queue: { pos: [number, number]; path: [number, number][] }[] = [];
  queue.push({ pos: start, path: [start] });
  visited[start[0]][start[1]] = true;

  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    const [r, c] = pos;
    if (r === end[0] && c === end[1]) return path;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] !== 0) continue;
      if (visited[nr][nc]) continue;
      visited[nr][nc] = true;
      queue.push({ pos: [nr, nc], path: [...path, [nr, nc]] });
    }
  }
  return [start];
}

/** Convert grid [row, col] to pixel center. */
function cellCenter(row: number, col: number, cellSize: number) {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
}

export default function MazeAnimation({
  size = 240,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const cellSize = size / GRID_COLS;
  const path = useMemo(() => bfs(MAZE_GRID, START, END), []);
  const pixelPath = useMemo(
    () => path.map(([r, c]) => cellCenter(r, c, cellSize)),
    [path, cellSize]
  );

  // ── requestAnimationFrame-based animation ──
  const [robotPos, setRobotPos] = useState(pixelPath[0]);
  const [trailPos, setTrailPos] = useState(pixelPath[0]);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const SEGMENT_MS = 180; // ms per cell-to-cell step
  const totalMs = (pixelPath.length - 1) * SEGMENT_MS;
  const PAUSE_MS = 1200;
  const LOOP_MS = totalMs + PAUSE_MS;
  const TRAIL_DELAY_MS = SEGMENT_MS * 2;

  const posAtTime = useCallback(
    (ms: number) => {
      if (pixelPath.length < 2) return pixelPath[0];
      const t = Math.min(ms, totalMs);
      const seg = Math.min(Math.floor(t / SEGMENT_MS), pixelPath.length - 2);
      const frac = Math.max(0, Math.min(1, (t - seg * SEGMENT_MS) / SEGMENT_MS));
      const a = pixelPath[seg];
      const b = pixelPath[seg + 1];
      return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
    },
    [pixelPath, totalMs]
  );

  const tick = useCallback(
    (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = (ts - startTimeRef.current) % LOOP_MS;
      setRobotPos(posAtTime(elapsed));
      setTrailPos(posAtTime(Math.max(0, elapsed - TRAIL_DELAY_MS)));
      animRef.current = requestAnimationFrame(tick);
    },
    [posAtTime, LOOP_MS, TRAIL_DELAY_MS]
  );

  useEffect(() => {
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [tick]);

  // ── Sizing ──
  // Keep robot small relative to cell so it never visually touches walls.
  // cellSize ≈ 29px (at size=380). robotRadius ≈ 4.4px.
  const robotRadius = cellSize * 0.15;

  // Build an SVG clipPath from all open cells so the robot + glow
  // can NEVER render over wall areas, even via blur or glow.
  const passageClipId = "passageClip";

  return (
    <div className={`relative ${className}`}>
      {/* Faint background glow */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(44, 125, 160, 0.1) 0%, transparent 70%)",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10"
      >
        <defs>
          {/* Wall edge glow — very subtle */}
          <filter id="mzWallGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Robot glow — tightly bounded */}
          <filter id="mzRobotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Robot gradient */}
          <radialGradient id="mzRobotGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0F4FF" />
            <stop offset="50%" stopColor="#61A5C2" />
            <stop offset="100%" stopColor="#2C7DA0" />
          </radialGradient>

          {/*
            ClipPath covering ONLY open passage cells.
            The robot and all its visual effects are clipped to this region,
            guaranteeing zero visual bleed into wall cells.
          */}
          <clipPath id={passageClipId}>
            {MAZE_GRID.map((row, ri) =>
              row.map((cell, ci) =>
                cell === 0 ? (
                  <rect
                    key={`pc-${ri}-${ci}`}
                    x={ci * cellSize}
                    y={ri * cellSize}
                    width={cellSize}
                    height={cellSize}
                  />
                ) : null
              )
            )}
          </clipPath>
        </defs>

        {/* ── Maze grid cells ── */}
        {MAZE_GRID.map((row, ri) =>
          row.map((cell, ci) => (
            <rect
              key={`g-${ri}-${ci}`}
              x={ci * cellSize}
              y={ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill={cell === 1 ? "#0A2A3E" : "#061826"}
              stroke={cell === 1 ? "#143A53" : "#0D2E42"}
              strokeWidth={cell === 1 ? "0.5" : "0.2"}
            />
          ))
        )}

        {/* ── Glowing wall edges ── */}
        {MAZE_GRID.map((row, ri) =>
          row.map((cell, ci) => {
            if (cell !== 1) return null;
            const segs: React.JSX.Element[] = [];

            if (ri > 0 && MAZE_GRID[ri - 1][ci] === 0) {
              segs.push(
                <line key={`et-${ri}-${ci}`} x1={ci * cellSize} y1={ri * cellSize} x2={(ci + 1) * cellSize} y2={ri * cellSize} stroke="#2C7DA0" strokeWidth="1.5" filter="url(#mzWallGlow)" />
              );
            }
            if (ri < GRID_ROWS - 1 && MAZE_GRID[ri + 1][ci] === 0) {
              segs.push(
                <line key={`eb-${ri}-${ci}`} x1={ci * cellSize} y1={(ri + 1) * cellSize} x2={(ci + 1) * cellSize} y2={(ri + 1) * cellSize} stroke="#2C7DA0" strokeWidth="1.5" filter="url(#mzWallGlow)" />
              );
            }
            if (ci > 0 && MAZE_GRID[ri][ci - 1] === 0) {
              segs.push(
                <line key={`el-${ri}-${ci}`} x1={ci * cellSize} y1={ri * cellSize} x2={ci * cellSize} y2={(ri + 1) * cellSize} stroke="#2C7DA0" strokeWidth="1.5" filter="url(#mzWallGlow)" />
              );
            }
            if (ci < GRID_COLS - 1 && MAZE_GRID[ri][ci + 1] === 0) {
              segs.push(
                <line key={`er-${ri}-${ci}`} x1={(ci + 1) * cellSize} y1={ri * cellSize} x2={(ci + 1) * cellSize} y2={(ri + 1) * cellSize} stroke="#2C7DA0" strokeWidth="1.5" filter="url(#mzWallGlow)" />
              );
            }
            return segs;
          })
        )}

        {/* ── Faint solved path ── */}
        <polyline
          points={pixelPath.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#2C7DA0"
          strokeWidth="1"
          opacity="0.06"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Start / End markers ── */}
        <rect x={START[1] * cellSize + cellSize * 0.12} y={START[0] * cellSize + cellSize * 0.12} width={cellSize * 0.76} height={cellSize * 0.76} rx={3} fill="#2C7DA0" opacity="0.2" />
        <text x={START[1] * cellSize + cellSize / 2} y={START[0] * cellSize + cellSize / 2} textAnchor="middle" dominantBaseline="middle" fill="#61A5C2" fontSize={Math.max(7, cellSize * 0.38)} fontFamily="monospace" fontWeight="bold">S</text>

        <rect x={END[1] * cellSize + cellSize * 0.12} y={END[0] * cellSize + cellSize * 0.12} width={cellSize * 0.76} height={cellSize * 0.76} rx={3} fill="#61A5C2" opacity="0.2" />
        <text x={END[1] * cellSize + cellSize / 2} y={END[0] * cellSize + cellSize / 2} textAnchor="middle" dominantBaseline="middle" fill="#A9D6E5" fontSize={Math.max(7, cellSize * 0.38)} fontFamily="monospace" fontWeight="bold">E</text>

        {/*
          ═══════════════════════════════════════════════
          Robot group — CLIPPED to passage cells only.
          This clipPath guarantees that even glow/blur
          effects cannot render over wall cells.
          ═══════════════════════════════════════════════
        */}
        <g clipPath={`url(#${passageClipId})`}>
          {/* Trail dot */}
          <circle
            cx={trailPos.x}
            cy={trailPos.y}
            r={robotRadius * 0.55}
            fill="#2C7DA0"
            opacity="0.3"
          />

          {/* Outer glow halo */}
          <circle
            cx={robotPos.x}
            cy={robotPos.y}
            r={robotRadius * 2.2}
            fill="none"
            stroke="#61A5C2"
            strokeWidth="0.6"
            opacity="0.2"
          >
            <animate attributeName="opacity" values="0.2;0.08;0.2" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Soft background glow behind robot */}
          <circle
            cx={robotPos.x}
            cy={robotPos.y}
            r={robotRadius * 1.8}
            fill="#61A5C2"
            opacity="0.08"
          />

          {/* Main robot dot */}
          <circle
            cx={robotPos.x}
            cy={robotPos.y}
            r={robotRadius}
            fill="url(#mzRobotGrad)"
            filter="url(#mzRobotGlow)"
          >
            <animate attributeName="opacity" values="1;0.8;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}
