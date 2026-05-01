"use client";

import { Layer, Rect } from "react-konva";

interface SafeZoneOverlayProps {
  width: number;
  height: number;
}

const ZONES: Record<string, { top: number; bottom: number; left: number; right: number }> = {
  "9:16": { top: 210, bottom: 310, left: 85, right: 85 },
  "1:1":  { top: 50,  bottom: 50,  left: 50, right: 50 },
  "4:5":  { top: 150, bottom: 175, left: 50, right: 50 },
};

function getFormatKey(w: number, h: number): string {
  const ratio = w / h;
  if (ratio > 0.9 && ratio < 1.1) return "1:1";
  if (ratio > 0.7) return "4:5";
  return "9:16";
}

export default function SafeZoneOverlay({ width, height }: SafeZoneOverlayProps) {
  const key = getFormatKey(width, height);
  const m = ZONES[key];

  const sx = m.left;
  const sy = m.top;
  const sw = width - m.left - m.right;
  const sh = height - m.top - m.bottom;

  return (
    <Layer listening={false}>
      {/* Escurece as áreas fora da safe zone */}
      <Rect x={0} y={0} width={width} height={sy} fill="rgba(0,0,0,0.18)" />
      <Rect x={0} y={sy + sh} width={width} height={height - sy - sh} fill="rgba(0,0,0,0.18)" />
      <Rect x={0} y={sy} width={sx} height={sh} fill="rgba(0,0,0,0.18)" />
      <Rect x={sx + sw} y={sy} width={width - sx - sw} height={sh} fill="rgba(0,0,0,0.18)" />

      {/* Borda tracejada da safe zone */}
      <Rect
        x={sx}
        y={sy}
        width={sw}
        height={sh}
        stroke="white"
        strokeWidth={2}
        dash={[10, 6]}
        listening={false}
      />
    </Layer>
  );
}
