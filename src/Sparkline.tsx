// Sparkline.tsx
// Minimal, modern sparkline for small history graphs (pitch/energy)
import React from "react";


// Props for Sparkline: data points, optional dimensions and color, min/max overrides
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

export default function Sparkline({ data, width = 120, height = 24, color = "#00f0ff", min, max }: SparklineProps) {
  // Don't render if no data
  if (!data.length) return null;
  // Determine min/max for scaling
  const minValue = min !== undefined ? min : Math.min(...data);
  const maxValue = max !== undefined ? max : Math.max(...data);
  const range = maxValue - minValue || 1;
  // Map data to SVG points
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - minValue) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* Polyline for sparkline */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        points={points}
        style={{ filter: "drop-shadow(0 0 2px #00f0ff88)" }}
      />
    </svg>
  );
}
