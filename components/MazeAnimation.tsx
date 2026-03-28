"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
} from "react";

const MAZE_GRID: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const GRID_ROWS = MAZE_GRID.length;
const GRID_COLS = MAZE_GRID[0].length;

const START: [number, number] = [1, 1];
const END: [number, number] = [11, 11];

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

    if (r === end[0] && c === end[1]) {
      return path;
    }

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
  const mazeId = useId().replace(/:/g, "");
  const cellSize = size / GRID_COLS;
  const path = useMemo(() => bfs(MAZE_GRID, START, END), []);
  const pixelPath = useMemo(
    () => path.map(([r, c]) => cellCenter(r, c, cellSize)),
    [path, cellSize]
  );

  const [robotPos, setRobotPos] = useState(pixelPath[0]);
  const [trailPos, setTrailPos] = useState(pixelPath[0]);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const segmentMs = 180;
  const totalMs = (pixelPath.length - 1) * segmentMs;
  const pauseMs = 1200;
  const loopMs = totalMs + pauseMs;
  const trailDelayMs = segmentMs * 2;

  const posAtTime = useCallback(
    (ms: number) => {
      if (pixelPath.length < 2) return pixelPath[0];

      const t = Math.min(ms, totalMs);
      const seg = Math.min(Math.floor(t / segmentMs), pixelPath.length - 2);
      const frac = Math.max(0, Math.min(1, (t - seg * segmentMs) / segmentMs));
      const a = pixelPath[seg];
      const b = pixelPath[seg + 1];

      return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
    },
    [pixelPath, totalMs]
  );

  useEffect(() => {
    const step = (ts: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = ts;
      }

      const elapsed = (ts - startTimeRef.current) % loopMs;
      setRobotPos(posAtTime(elapsed));
      setTrailPos(posAtTime(Math.max(0, elapsed - trailDelayMs)));
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [loopMs, posAtTime, trailDelayMs]);

  const robotRadius = cellSize * 0.15;
  const passageClipId = `${mazeId}-passage-clip`;
  const wallGlowId = `${mazeId}-wall-glow`;
  const robotGlowId = `${mazeId}-robot-glow`;
  const robotGradId = `${mazeId}-robot-grad`;

  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(129, 140, 248, 0.12) 0%, transparent 72%)",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10"
      >
        <defs>
          <filter id={wallGlowId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={robotGlowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id={robotGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#818CF8" />
          </radialGradient>

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

        {MAZE_GRID.map((row, ri) =>
          row.map((cell, ci) => (
            <rect
              key={`g-${ri}-${ci}`}
              x={ci * cellSize}
              y={ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill={cell === 1 ? "#0F1730" : "#050915"}
              stroke={cell === 1 ? "#1B2440" : "#11182D"}
              strokeWidth={cell === 1 ? "0.5" : "0.2"}
            />
          ))
        )}

        {MAZE_GRID.map((row, ri) =>
          row.map((cell, ci) => {
            if (cell !== 1) return null;

            const segs: React.JSX.Element[] = [];

            if (ri > 0 && MAZE_GRID[ri - 1][ci] === 0) {
              segs.push(
                <line
                  key={`et-${ri}-${ci}`}
                  x1={ci * cellSize}
                  y1={ri * cellSize}
                  x2={(ci + 1) * cellSize}
                  y2={ri * cellSize}
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  filter={`url(#${wallGlowId})`}
                />
              );
            }

            if (ri < GRID_ROWS - 1 && MAZE_GRID[ri + 1][ci] === 0) {
              segs.push(
                <line
                  key={`eb-${ri}-${ci}`}
                  x1={ci * cellSize}
                  y1={(ri + 1) * cellSize}
                  x2={(ci + 1) * cellSize}
                  y2={(ri + 1) * cellSize}
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  filter={`url(#${wallGlowId})`}
                />
              );
            }

            if (ci > 0 && MAZE_GRID[ri][ci - 1] === 0) {
              segs.push(
                <line
                  key={`el-${ri}-${ci}`}
                  x1={ci * cellSize}
                  y1={ri * cellSize}
                  x2={ci * cellSize}
                  y2={(ri + 1) * cellSize}
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  filter={`url(#${wallGlowId})`}
                />
              );
            }

            if (ci < GRID_COLS - 1 && MAZE_GRID[ri][ci + 1] === 0) {
              segs.push(
                <line
                  key={`er-${ri}-${ci}`}
                  x1={(ci + 1) * cellSize}
                  y1={ri * cellSize}
                  x2={(ci + 1) * cellSize}
                  y2={(ri + 1) * cellSize}
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  filter={`url(#${wallGlowId})`}
                />
              );
            }

            return segs;
          })
        )}

        <polyline
          points={pixelPath.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#818CF8"
          strokeWidth="1"
          opacity="0.12"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <rect
          x={START[1] * cellSize + cellSize * 0.12}
          y={START[0] * cellSize + cellSize * 0.12}
          width={cellSize * 0.76}
          height={cellSize * 0.76}
          rx={3}
          fill="#A855F7"
          opacity="0.22"
        />
        <text
          x={START[1] * cellSize + cellSize / 2}
          y={START[0] * cellSize + cellSize / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#C084FC"
          fontSize={Math.max(7, cellSize * 0.38)}
          fontFamily="monospace"
          fontWeight="bold"
        >
          S
        </text>

        <rect
          x={END[1] * cellSize + cellSize * 0.12}
          y={END[0] * cellSize + cellSize * 0.12}
          width={cellSize * 0.76}
          height={cellSize * 0.76}
          rx={3}
          fill="#818CF8"
          opacity="0.22"
        />
        <text
          x={END[1] * cellSize + cellSize / 2}
          y={END[0] * cellSize + cellSize / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#E2E8F0"
          fontSize={Math.max(7, cellSize * 0.38)}
          fontFamily="monospace"
          fontWeight="bold"
        >
          E
        </text>

        <g clipPath={`url(#${passageClipId})`}>
          <circle
            cx={trailPos.x}
            cy={trailPos.y}
            r={robotRadius * 0.55}
            fill="#A855F7"
            opacity="0.3"
          />

          <circle
            cx={robotPos.x}
            cy={robotPos.y}
            r={robotRadius * 2.2}
            fill="none"
            stroke="#818CF8"
            strokeWidth="0.6"
            opacity="0.2"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.08;0.2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          <circle
            cx={robotPos.x}
            cy={robotPos.y}
            r={robotRadius * 1.8}
            fill="#C084FC"
            opacity="0.12"
          />

          <circle
            cx={robotPos.x}
            cy={robotPos.y}
            r={robotRadius}
            fill={`url(#${robotGradId})`}
            filter={`url(#${robotGlowId})`}
          >
            <animate
              attributeName="opacity"
              values="1;0.8;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}
